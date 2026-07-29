const fs = require('fs');
const file = 'components/ConsolidatedAccountsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/<th className="border-2 border-black p-1 w-\[8%\] whitespace-nowrap" rowSpan=\{2\}>Date<\/th>/g, 
    '<th className="border-2 border-black p-1 w-[7%] whitespace-nowrap" rowSpan={2}>Date</th>');
    
code = code.replace(/<th className="border-2 border-black p-1 bg-slate-50 w-\[10%\]" rowSpan=\{2\}>Total Collection<\/th>/g, 
    '<th className="border-2 border-black p-1 bg-slate-50 w-[9%] text-[7px]" rowSpan={2}>Total Collection</th>');

code = code.replace(/<th className="border-2 border-black p-1 w-\[9%\]">Today<\/th>/g, 
    '<th className="border-2 border-black p-1 w-[10%]">Today</th>');

code = code.replace(/<th className="border-2 border-black p-1 w-\[11%\]">Total<\/th>/g, 
    '<th className="border-2 border-black p-1 w-[11%]">Total</th>'); // Stays 11%

code = code.replace(/<th className="border-2 border-black p-1 bg-blue-50 w-\[14%\]">Upto<\/th>/g, 
    '<th className="border-2 border-black p-1 bg-blue-50 w-[14%]">Upto</th>');

code = code.replace(/<th className="border-2 border-black p-1 bg-emerald-50 w-\[14%\]">Upto<\/th>/g, 
    '<th className="border-2 border-black p-1 bg-emerald-50 w-[14%]">Upto</th>');

fs.writeFileSync(file, code);
