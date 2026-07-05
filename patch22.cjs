const fs = require('fs');
let code = fs.readFileSync('components/UltrasonographyReportEditor.tsx', 'utf8');

code = code.replace(
/<div className=\{\`flex flex-col h-full \$\{isEmbedded \? 'bg-transparent' : 'bg-slate-100 overflow-hidden'\} font-sans text-black\`\}>/,
`<div className={\`flex flex-col \${isEmbedded ? 'flex-1 min-h-0 bg-transparent' : 'h-full bg-slate-100 overflow-hidden'} font-sans text-black\`}>`
);

fs.writeFileSync('components/UltrasonographyReportEditor.tsx', code);
