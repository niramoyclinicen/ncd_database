const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', 'utf8');

// Adding Reset button to UI
const targetReset = `                                {profitShareReportType === 'custom' && (
                                    <div className="flex items-center gap-2">
                                        <input type="date" value={profitShareStartDate} onChange={e => setProfitShareStartDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white" />
                                        <span className="text-slate-400 font-bold">to</span>
                                        <input type="date" value={profitShareEndDate} onChange={e => setProfitShareEndDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white" />
                                    </div>
                                )}`;
const replacementReset = targetReset + `
                                {profitShareReportType !== 'monthly' && (
                                    <button onClick={() => {
                                        setProfitShareReportType('monthly');
                                        setProfitShareStartDate('');
                                        setProfitShareEndDate('');
                                        setProfitShareYearStr(new Date().getFullYear().toString());
                                    }} className="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 text-sm">
                                        Clear / Reset
                                    </button>
                                )}`;

content = content.replace(targetReset, replacementReset);

// Modifying the input to hide for non-monthly
const targetInput = `<span className="text-lg font-black text-blue-900 no-print invisible">৳</span>
                                        <input type="number" value={profitShareAdj.profitDist || ''} onChange={e=>updateProfitShareAdjustment('profitDist', parseFloat(e.target.value)||0)} className="w-24 bg-transparent border-b-2 border-blue-300 text-center text-2xl font-black text-blue-900 outline-none no-print" />
                                        <button 
                                            onClick={() => setShowSaveConfirm(true)}
                                            className="no-print p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
                                            title="Save"
                                        >
                                            <SaveIcon className="w-4 h-4" />
                                        </button>
                                        <span className="text-2xl font-black text-blue-900 print:inline-block hidden print:text-[10pt]">{safeNum(profitShareAdj.profitDist).toLocaleString()}</span>`;

const replacementInput = `{profitShareReportType === 'monthly' ? (
                                            <>
                                                <span className="text-lg font-black text-blue-900 no-print invisible">৳</span>
                                                <input type="number" value={profitShareAdj.profitDist || ''} onChange={e=>updateProfitShareAdjustment('profitDist', parseFloat(e.target.value)||0)} className="w-24 bg-transparent border-b-2 border-blue-300 text-center text-2xl font-black text-blue-900 outline-none no-print" />
                                                <button 
                                                    onClick={() => setShowSaveConfirm(true)}
                                                    className="no-print p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
                                                    title="Save"
                                                >
                                                    <SaveIcon className="w-4 h-4" />
                                                </button>
                                                <span className="text-2xl font-black text-blue-900 print:inline-block hidden print:text-[10pt]">{safeNum(profitShareAdj.profitDist).toLocaleString()}</span>
                                            </>
                                        ) : (
                                            <span className="text-2xl font-black text-blue-900">{safeNum(profitShareAdj.profitDist).toLocaleString()}</span>
                                        )}`;

content = content.replace(targetInput, replacementInput);

fs.writeFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', content);
console.log("Done UI fix");
