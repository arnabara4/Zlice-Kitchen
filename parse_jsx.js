const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('components/order-builder.tsx', 'utf8');

try {
  babel.parse(code, {
    filename: 'components/order-builder.tsx',
    presets: ['@babel/preset-typescript', '@babel/preset-react']
  });
  console.log("Parse Success!");
} catch (e) {
  console.log("Error line: " + e.loc?.line + ", col: " + e.loc?.column);
  console.log(e.message);
}
