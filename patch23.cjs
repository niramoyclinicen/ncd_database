const fs = require('fs');

const files = [
    'components/CBCInputPage.tsx',
    'components/UrineRMEInputPage.tsx',
    'components/SemenAnalysisInputPage.tsx',
    'components/GeneralPathologyInputPage.tsx'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let code = fs.readFileSync(file, 'utf8');
        code = code.replace(
            /<div className=\{\`flex flex-col h-full \$\{isEmbedded \? 'bg-transparent' : 'bg-slate-100 overflow-hidden'\} font-sans text-black\`\}>/g,
            `<div className={\`flex flex-col \${isEmbedded ? 'flex-1 min-h-0 bg-transparent' : 'h-full bg-slate-100 overflow-hidden'} font-sans text-black\`}>`
        );
        fs.writeFileSync(file, code);
    }
}
