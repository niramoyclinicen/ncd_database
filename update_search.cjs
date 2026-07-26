const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

// Change the inventory table visibility
code = code.replace(
    `{viewMode !== 'ledger' && (`,
    `{['inventory', 'requisition'].includes(viewMode) && (`
);

// Update getSummaryData to use filteredReagents instead of reagents
code = code.replace(
    `const getSummaryData = () => {
                        return reagents.map(r => {`,
    `const getSummaryData = () => {
                        return filteredReagents.map(r => {`
);

// Add the search bar to the summary header
const searchBarHtml = `
                                <div>
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3"><DatabaseIcon size={24} className="text-indigo-400" /> Reagent & Film Inventory (Excel View)</h3>
                                </div>
                                <div className="relative w-64 mt-4 md:mt-0">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                                    <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search..." className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-12 pr-6 text-sm text-white focus:border-indigo-500 outline-none shadow-inner"/>
                                </div>
`;

code = code.replace(
    `                                <div>
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3"><DatabaseIcon size={24} className="text-indigo-400" /> Reagent & Film Inventory (Excel View)</h3>
                                </div>`,
    searchBarHtml
);


fs.writeFileSync('components/ReagentInfoPage.tsx', code);
console.log("Updated search and table visibility");
