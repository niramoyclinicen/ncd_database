const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', 'utf8');

const regex = /const profitShareAdj = (.*?);/;
const match = content.match(regex);
console.log(match ? match[0] : "Not found");
