const fs = require('fs');
const content = fs.readFileSync('components/order-builder.tsx', 'utf8');

// A very naive JSX tag balancer for div
let lineNum = 1;
let openDivs = 0;
const stack = [];

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // match <div optionally with spaces or attributes
  // avoid self closing or matching substring inside strings if possible. 
  // Naive approach:
  const opens = (line.match(/<div[ >\n]/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  
  for(let o=0;o<opens;o++) {
     stack.push(i+1);
  }
  for(let c=0;c<closes;c++) {
     if(stack.length === 0) {
        console.log(`Extra </div> at line ${i+1}`);
     } else {
        stack.pop();
     }
  }
}
console.log(`Remaining open divs: ${stack.length}`);
if(stack.length > 0) {
   console.log(`Open div lines:`, stack);
}
