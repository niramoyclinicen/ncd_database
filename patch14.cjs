const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

code = code.replace(
/<div className="w-48">\s*<input/,
`<div className="flex gap-2">
                        <input`
);

fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
