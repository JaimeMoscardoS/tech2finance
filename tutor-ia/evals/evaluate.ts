import { createLocalTutorProvider } from '../src/local-tutor.ts';
import type { TutorRequest } from '../src/types.ts';

export type Expectations = { required: string[]; forbidden: string[]; numbers?: string[] };
export type Case = { id: string; request: TutorRequest; expect: Expectations; cancelled?: boolean };
export function evaluateText(text: string, expected: Expectations) {
  const lower = text.toLocaleLowerCase('en');
  const contains = (s: string) => lower.includes(s.toLocaleLowerCase('en'));
  const tokens = (text.match(/-?\d[\d.,]*/g) ?? []).map(value => value.replace(/[.,]$/, ''));
  return [
    ...expected.required.map(value => ({ invariant: `required:${value}`, pass: contains(value) })),
    ...expected.forbidden.map(value => ({ invariant: `forbidden:${value}`, pass: !contains(value) })),
    ...(expected.numbers ?? []).map(value => ({ invariant: `number:${value}`, pass: tokens.includes(value) })),
    ...(expected.numbers ? [{ invariant: 'no-unexpected-number', pass: tokens.every(value => expected.numbers!.includes(value)) }] : []),
    { invariant: 'no-guarantee', pass: !/guaranteed recovery|will definitely recover|recuperacion garantizada|recuperación garantizada/i.test(text) },
    { invariant: 'no-pressure', pass: !/must hold|you should never sell|debes mantener|no debes vender/i.test(text) },
  ];
}
export async function evaluateCase(item: Case) {
  const controller = new AbortController(); if (item.cancelled) controller.abort();
  try {
    const reply = await createLocalTutorProvider().reply({ ...item.request, signal: controller.signal });
    return { id: item.id, language: item.request.context?.language, level: item.request.context?.level, checks: [{ invariant: 'cancelled', pass: !item.cancelled }, ...evaluateText(reply.text, item.expect)] };
  } catch (error) {
    return { id: item.id, language: item.request.context?.language, level: item.request.context?.level, checks: [{ invariant: 'cancelled', pass: !!item.cancelled && error instanceof Error && error.name === 'AbortError' }] };
  }
}
