const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

code = code.replace(
    /const isSameDay = \(d1: string, d2: string\) => \{[\s\S]*?return y1 === y2 && m1 === m2 && day1 === day2;\s*\};/g,
    `const isSameDay = (d1: string, d2: string) => {
        if (!d1 || !d2) return false;
        const [y1, m1, day1] = d1.split(/[T ]/)[0].split('-').map(Number);
        const [y2, m2, day2] = d2.split(/[T ]/)[0].split('-').map(Number);
        return y1 === y2 && m1 === m2 && day1 === day2;
    };`
);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
