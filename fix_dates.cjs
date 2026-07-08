const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

code = code.replace(
    /const isSameDay = \(d1: string, d2: string\) => \{[\s\S]*?return y1 === y2 && m1 === m2 && day1 === day2;\s*\};/g,
    `const isSameDay = (d1: any, d2: any) => {
        if (!d1 || !d2) return false;
        try {
            const [y1, m1, day1] = String(d1).split(/[T ]/)[0].split('-').map(Number);
            const [y2, m2, day2] = String(d2).split(/[T ]/)[0].split('-').map(Number);
            return y1 === y2 && m1 === m2 && day1 === day2;
        } catch(e) { return false; }
    };`
);

code = code.replace(
    /const isSelectedMonth = \(dateStr: string\) => \{[\s\S]*?return m - 1 === selectedMonth && y === selectedYear;\s*\};/g,
    `const isSelectedMonth = (dateStr: any) => {
            if (!dateStr) return false;
            try {
                const [y, m] = String(dateStr).split(/[T ]/)[0].split('-').map(Number);
                return m - 1 === selectedMonth && y === selectedYear;
            } catch(e) { return false; }
        };`
);

code = code.replace(
    /const isBeforeSelectedMonth = \(dateStr: string\) => \{[\s\S]*?return y < selectedYear \|\| \(y === selectedYear && m - 1 < selectedMonth\);\s*\};/g,
    `const isBeforeSelectedMonth = (dateStr: any) => {
            if (!dateStr) return false;
            try {
                const [y, m] = String(dateStr).split(/[T ]/)[0].split('-').map(Number);
                return y < selectedYear || (y === selectedYear && m - 1 < selectedMonth);
            } catch(e) { return false; }
        };`
);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
