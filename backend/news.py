"""Bounded, server-owned discovery of ECB market context for observed declines."""
import asyncio
from collections import OrderedDict
from concurrent.futures import Future
from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
import hashlib
from html.parser import HTMLParser
import re
import threading
import time
from urllib.parse import urlsplit

import httpx

ORIGIN = 'https://www.ecb.europa.eu'
ARTICLE = re.compile(r'^/press/pr/date/\d{4}/html/ecb\.pr[\w~.-]+\.en\.html$')
WORDS = re.compile(r'\b(?:market|monetary|policy|pandemic|emergency|financial|inflation|interest|purchase|liquidity|economy|economic|coronavirus|covid|rates)\b', re.I)
HIGH = re.compile(r'\b(?:pandemic|emergency|coronavirus|covid|monetary policy decisions|economic activity|economic growth)\b', re.I)
EXCLUDE = re.compile(r'\b(?:statistics|statistical|reporting|appointments?|consultations?|feedback|eonia|operational precautions)\b', re.I)
MAX_BYTES = 512 * 1024
DEADLINE = 12
TRANSPORT = None
_lock = threading.Lock()
_slots = threading.BoundedSemaphore(4)
_cache = OrderedDict()
_inflight = {}

def valid_article(url):
    parsed = urlsplit(url)
    return (parsed.scheme == 'https' and parsed.netloc == 'www.ecb.europa.eu'
            and not parsed.query and not parsed.fragment and bool(ARTICLE.fullmatch(parsed.path)))

class ArchiveParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.date = None
        self.in_title = False
        self.link = None
        self.text = []
        self.rows = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'dt':
            self.date = attrs.get('isodate')
        if tag == 'div' and attrs.get('class') == 'title':
            self.in_title = True
        if tag == 'a' and self.in_title and self.link is None:
            self.link = attrs.get('href', '')
            self.text = []

    def handle_data(self, text):
        if self.link is not None:
            self.text.append(text)

    def handle_endtag(self, tag):
        if tag == 'a' and self.link is not None:
            self.rows.append((self.date, self.link, ' '.join(''.join(self.text).split())))
            self.link = None
        if tag == 'div' and self.in_title:
            self.in_title = False

class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.date = None
        self.title = None
        self.after_heading = False
        self.in_p = False
        self.ignored = 0
        self.text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            if attrs.get('property') == 'article:published_time':
                self.date = attrs.get('content')
            if attrs.get('name') == 'citation_title':
                self.title = attrs.get('content')
        if tag == 'h1':
            self.after_heading = True
        if tag in ('script', 'style', 'noscript'):
            self.ignored += 1
        if tag == 'p' and self.after_heading and not self.ignored:
            self.in_p = True

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript') and self.ignored:
            self.ignored -= 1
        if tag == 'p':
            self.in_p = False

    def handle_data(self, text):
        if self.in_p and not self.ignored and sum(map(len, self.text)) < 3000:
            self.text.append(text)

async def fetch(client, url):
    async with client.stream('GET', url, headers={'Accept-Encoding': 'identity'}) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError('unexpected status')
        data = bytearray()
        async for chunk in response.aiter_bytes():
            if len(data) + len(chunk) > MAX_BYTES:
                raise ValueError('page too large')
            data.extend(chunk)
        return data.decode('utf-8', errors='replace')

def envelope(start, end, status, items=None, reason=None):
    limitations = ['ECB coverage is macroeconomic context, not evidence of the cause or holdings of this fund.',
                   'No fund-specific news was established in the ECB archive.']
    if reason:
        limitations.append(reason)
    return {'status': status, 'provider': 'ecb_archive', 'checkedAt': datetime.now(timezone.utc).isoformat(),
            'periodStart': start.isoformat() if start else None, 'periodEnd': end.isoformat() if end else None, 'items': items or [], 'limitations': limitations}

async def discover(start, end, identity=()):
    if not _slots.acquire(blocking=False):
        return envelope(start, end, 'unavailable', reason='News capacity is temporarily unavailable.')
    try:
        async with asyncio.timeout(DEADLINE):
            async with httpx.AsyncClient(timeout=DEADLINE, transport=TRANSPORT, follow_redirects=False, trust_env=True) as client:
                candidates = []
                identity_matches = False
                for year in range(start.year, end.year + 1):
                    parser = ArchiveParser()
                    parser.feed(await fetch(client, f'{ORIGIN}/press/pr/date/{year}/html/index_include.en.html'))
                    for raw_date, path, title in parser.rows:
                        try:
                            day = date.fromisoformat(raw_date)
                        except (TypeError, ValueError):
                            continue
                        url = ORIGIN + path if path.startswith('/') else path
                        if start <= day <= end and day <= date.today() and valid_article(url):
                            matched = any(term and term.casefold() in title.casefold() for term in identity)
                            identity_matches |= matched
                            if matched or (WORDS.search(title) and not EXCLUDE.search(title)):
                                candidates.append((day, url, title, matched))
                candidates.sort(key=lambda row: (-int(row[3]), -len(HIGH.findall(row[2])), -len(WORDS.findall(row[2])), -row[0].toordinal(), row[1]))
                items = []
                unique = list({row[1]: row for row in candidates}.values())[:4]
                failures = 0
                for day, url, title, _matched in unique:
                    try:
                        parser = ArticleParser()
                        parser.feed(await fetch(client, url))
                        if not parser.date or parser.date[:10] != day.isoformat() or not parser.title or not parser.text:
                            continue
                        excerpt = ' '.join(' '.join(parser.text).split())[:650]
                        items.append({'id': 'ecb-' + hashlib.sha256(url.encode()).hexdigest()[:16],
                                      'title': parser.title[:300], 'url': url, 'publisher': 'European Central Bank',
                                      'publishedAt': day.isoformat(), 'excerpt': excerpt, 'scope': 'market_context'})
                    except (httpx.HTTPError, ValueError):
                        failures += 1
                        continue
                if unique and failures == len(unique):
                    return envelope(start, end, 'unavailable', reason='The ECB articles could not be consulted.')
                result = envelope(start, end, 'ready' if items else 'empty', items)
                if identity_matches:
                    result['limitations'][1] = 'A catalog identity matched an archive title; fund-specific relevance has not been independently established.'
                return result
    except (httpx.HTTPError, TimeoutError, ValueError):
        return envelope(start, end, 'unavailable', reason='The ECB archive could not be consulted.')
    finally:
        _slots.release()

async def get_news(report, enabled=True, identity=(), disabled_reason='External news is disabled by configuration.'):
    try:
        end = date.fromisoformat(report['latestLabel'])
        open_episodes = [e for e in report.get('episodes', []) if e.get('recoveryLabel') is None]
        start = date.fromisoformat(open_episodes[-1]['peakLabel']) if open_episodes else end
    except (KeyError, TypeError, ValueError):
        return envelope(None, None, 'unavailable', reason='No valid observed period is available.')
    start = max(start, end - timedelta(days=365))
    if not enabled:
        return envelope(start, end, 'unavailable', reason=disabled_reason)
    key = (start.isoformat(), end.isoformat(), tuple(identity))
    with _lock:
        cached = _cache.get(key)
        if cached and time.monotonic() - cached[0] < 300:
            _cache.move_to_end(key)
            return deepcopy(cached[1])
        future = _inflight.get(key)
        owner = future is None
        if owner:
            future = _inflight[key] = Future()
    if not owner:
        return deepcopy(await asyncio.shield(asyncio.wrap_future(future)))
    try:
        result = await discover(start, end, identity)
        with _lock:
            if result['status'] != 'unavailable':
                _cache[key] = (time.monotonic(), deepcopy(result))
                while len(_cache) > 64:
                    _cache.popitem(last=False)
            future.set_result(result)
        return deepcopy(result)
    except BaseException:
        future.set_result(envelope(start, end, 'unavailable', reason='The shared news request was interrupted; retry is possible.'))
        raise
    finally:
        with _lock:
            _inflight.pop(key, None)
