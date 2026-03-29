const fs = require('fs');
const code = fs.readFileSync('/Users/arnabjena/Desktop/Internship/Zlice/v0-canteen-management-tool/components/order-builder.tsx', 'utf8');
const lines = code.split('\n');

let depth = 0;
let targetDepth = -1;
let startLine = 2503;

for (let i = 2502; i < lines.length; i++) {
  const line = lines[i];
  
  // simple heuristic for counting divs
  const matchesOpen = (line.match(/<div(\s|>)/g) || []).length;
  const matchesClose = (line.match(/<\/div>/g) || []).length;
  
  depth += matchesOpen;
  depth -= matchesClose;
  
  if (i === 2502) {
     targetDepth = depth - 1; // we want to find when depth returns to what it was BEFORE this div opened
  }
  
  if (depth === targetDepth) {
     console.log('Closes at line:', i + 1);
     break;
  }
}
