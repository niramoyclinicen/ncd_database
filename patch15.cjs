const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

code = code.replace(
/<b>Printed By:<\/b> \` \+ "\$\{collectedBy \|\| ''\}" \+ \` <br><br>/,
`<b>Printed By:</b> \${collectedBy || ''} <br><br>`
);

fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
