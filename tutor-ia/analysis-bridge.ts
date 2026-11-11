import { buildDetailedDeclineAnalysis } from './src/decline-analysis.ts';
let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;
try { process.stdout.write(JSON.stringify(buildDetailedDeclineAnalysis(JSON.parse(input)))); }
catch { process.stderr.write('Analysis bridge failed\n'); process.exitCode = 1; }
