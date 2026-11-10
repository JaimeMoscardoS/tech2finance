import { createLocalTutorProvider } from './src/local-tutor.ts';
import type { TutorRequest } from './src/types.ts';

// The HTTP server validates the request and builds its context from trusted data.
try {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  const request = JSON.parse(input) as TutorRequest;
  const reply = await createLocalTutorProvider().reply(request);
  process.stdout.write(JSON.stringify({ ...reply, mode: 'api', provider: 'server_rules' }));
} catch {
  process.stderr.write('Tutor bridge failed\n');
  process.exitCode = 1;
}
