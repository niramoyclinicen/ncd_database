const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

const targetStr = \`<tr className="bg-gray-50 h-9"><td className={collectionTableCellClass}>বাড়ী ভাড়া কর্তন</td><td className="no-print"><input type="number" value={adj.houseRent || ''} onChange={e=>updateAdjustment('houseRent', parseFloat(e.target.value)||0)} className="w-16 text-right border border-gray-400 rounded" /></td><td className={collectionAmtCellClass}>({safeNum(adj.houseRent).toLocaleString()})</td></tr>\`;

const replaceStr = \`<tr className="bg-gray-50 h-9">
    <td colSpan={2} className={\`\${collectionTableCellClass} !text-left\`}>
        <div className="flex justify-between items-center w-full">
            <span>বাড়ী ভাড়া কর্তন</span>
            <span className="no-print"><input type="number" value={adj.houseRent || ''} onChange={e=>updateAdjustment('houseRent', parseFloat(e.target.value)||0)} className="w-16 text-right border border-gray-400 rounded text-xs font-normal ml-2" /></span>
        </div>
    </td>
    <td className={collectionAmtCellClass}>({safeNum(adj.houseRent).toLocaleString()})</td>
</tr>\`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
    console.log("Success house rent patch");
} else {
    console.log("Target string not found!");
}
