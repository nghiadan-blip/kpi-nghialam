import fs from 'fs';
import path from 'path';

function searchInDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist' || f === 'build') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchInDir(full);
    } else if (/\.(tsx|ts|js|jsx|json)$/.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('\\ge') || content.includes('$\\ge') || content.includes('$$') || content.includes('\\le') || content.includes('\\times')) {
        console.log(`Found LaTeX in: ${full}`);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes('\\ge') || l.includes('$\\ge') || l.includes('$$') || l.includes('\\le') || l.includes('\\times')) {
            console.log(`  Line ${i + 1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

searchInDir(path.resolve(__dirname, '../../'));
