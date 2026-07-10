const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

code = code.replace(
    '<div className="pl-8 pr-4 space-y-4">',
    '<div className="pl-6 pr-1 space-y-4">'
);

code = code.replace(
    '<span>বাড়ী ভাড়া কর্তন</span>',
    '<span className="whitespace-nowrap">বাড়ী ভাড়া কর্তন</span>'
);

code = code.replace(
    '<span>লভ্যাংশ বন্টন</span>',
    '<span className="whitespace-nowrap">লভ্যাংশ বন্টন</span>'
);

// also let's make the profit distribution input a bit smaller if needed? The user said: "অংশ বন্টন এন্টিভ বক্সটির প্রশস্ততা একটু কমিয়ে দিলে লভ্যাংশ বন্টন এটিও এক লাইনে লেখা যাবে"
// Wait, I already made the profit dist input smaller (w-16) instead of w-24 previously.

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
