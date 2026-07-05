const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

const target = `                                        <datalist id={\`desc-list-\${item.id}\`}>
                                            {Array.from(descriptionSuggestions[\`\${item.category}|\${item.subCategory}\`] || []).map((desc, i) => (
                                                <option key={i} value={desc} />
                                            ))}
                                        </datalist>
                                    </td>`;

const replacement = `                                        <datalist id={\`desc-list-\${item.id}\`}>
                                            {Array.from(descriptionSuggestions[\`\${item.category}|\${item.subCategory}\`] || []).map((desc, i) => (
                                                <option key={i} value={desc} />
                                            ))}
                                        </datalist>
                                        {(item.category === 'Reagent buy' || item.category === 'X-ray Film buy') && (
                                            <div className="flex items-center gap-2 mt-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                                <input
                                                    type="number"
                                                    placeholder="Box/Pcs"
                                                    value={item.metadata?.numberOfBoxes || ''}
                                                    onChange={e => handleItemChange(item.id, 'metadata', { ...item.metadata, numberOfBoxes: parseFloat(e.target.value) || 0 })}
                                                    className="w-16 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs font-black text-white text-center focus:border-blue-500 outline-none"
                                                    title="Number of Boxes/Pieces"
                                                />
                                                <span className="text-slate-500 font-bold text-xs">×</span>
                                                <input
                                                    type="number"
                                                    placeholder="Qty/Box"
                                                    value={item.metadata?.quantityPerBox || ''}
                                                    onChange={e => handleItemChange(item.id, 'metadata', { ...item.metadata, quantityPerBox: parseFloat(e.target.value) || 0 })}
                                                    className="w-16 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs font-black text-white text-center focus:border-blue-500 outline-none"
                                                    title="Quantity per Box"
                                                />
                                                <div className="ml-auto text-right">
                                                    <div className="text-[9px] text-slate-500 font-black uppercase">Total Add</div>
                                                    <div className="text-emerald-400 font-black text-sm">
                                                        +{(item.metadata?.numberOfBoxes || 0) * (item.metadata?.quantityPerBox || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </td>`;

if (code.includes(target)) {
    fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code.replace(target, replacement));
    console.log("Patched successfully");
} else {
    console.log("Target not found!");
}
