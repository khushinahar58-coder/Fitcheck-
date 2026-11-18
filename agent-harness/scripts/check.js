// "Is it working, and is it mine?" Runs the tests, then looks for HinH material
// left over in the files your AI generates from my-agent.md.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

let ok = true;
try {
  execSync('node --test tests/*.test.js', { stdio: 'pipe' });
  console.log('✓ Tests pass.');
} catch (e) {
  ok = false;
  console.log('✗ Some tests fail. Ask your AI: "Run npm test and fix what fails."');
}

const mine = fs.readFileSync('my-agent.md', 'utf8');
if (/HinH|HVAC in a Hurry|Trent/.test(mine)) {
  console.log('• my-agent.md still describes the HinH example. That is fine if you are just trying it out.');
} else {
  const words = /HinH|HVAC|Trent|Ridgeline|Bayview|Harbor Point|blower motor/i;
  const dirs = ['harness', 'cases', 'fixtures', 'tests', 'src/tools.js'];
  const left = [];
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) fs.readdirSync(p).forEach((f) => walk(path.join(p, f)));
    else if (words.test(fs.readFileSync(p, 'utf8'))) left.push(p);
  };
  dirs.forEach(walk);
  if (left.length) {
    ok = false;
    console.log(`✗ HinH material is still in: ${left.join(', ')}`);
    console.log('  Ask your AI: "Update the harness from my-agent.md and remove everything about HinH."');
  } else {
    console.log('✓ No HinH material left. The harness is yours.');
  }
}
const drafts = (mine.match(/\(AI draft/g) || []).length;
if (drafts) console.log(`• ${drafts} case(s) in my-agent.md are still marked as AI drafts. Replace them with your own.`);
process.exit(ok ? 0 : 1);
