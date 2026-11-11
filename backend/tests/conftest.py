import pytest

@pytest.fixture(autouse=True)
def disable_external_news_by_default(monkeypatch):
    monkeypatch.setenv('T2F_NEWS_PROVIDER', 'off')
