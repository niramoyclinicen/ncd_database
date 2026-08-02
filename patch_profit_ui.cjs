const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', 'utf8');

const targetUI = `<div className="text-center mb-8 border-b pb-6 print:mb-8 print:pb-2">
                                <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter leading-none mb-2 print:text-2xl">Niramoy Clinic & Diagnostic</h1>
                                <h2 className="text-xl font-black text-slate-700 font-['Hind_Siliguri'] print:text-base">অংশীদারদের লভ্যাংশ বন্টন রিপোর্ট</h2>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 print:text-xs print:mt-1">{monthOptions[selectedMonth].name} {selectedYear}</p>
                            </div>`;

const newUI = `<div className="no-print flex gap-4 items-center justify-center mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 w-fit mx-auto">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-bold text-slate-700">Report Type:</label>
                                    <select value={profitShareReportType} onChange={e => setProfitShareReportType(e.target.value as any)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="custom">Custom Date Range</option>
                                    </select>
                                </div>
                                {profitShareReportType === 'yearly' && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-bold text-slate-700">Year:</label>
                                        <select value={profitShareYearStr} onChange={e => setProfitShareYearStr(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
                                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                )}
                                {profitShareReportType === 'custom' && (
                                    <div className="flex items-center gap-2">
                                        <input type="date" value={profitShareStartDate} onChange={e => setProfitShareStartDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white" />
                                        <span className="text-slate-400 font-bold">to</span>
                                        <input type="date" value={profitShareEndDate} onChange={e => setProfitShareEndDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white" />
                                    </div>
                                )}
                            </div>

                            <div className="text-center mb-8 border-b pb-6 print:mb-8 print:pb-2">
                                <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter leading-none mb-2 print:text-2xl">Niramoy Clinic & Diagnostic</h1>
                                <h2 className="text-xl font-black text-slate-700 font-['Hind_Siliguri'] print:text-base">অংশীদারদের লভ্যাংশ বন্টন রিপোর্ট</h2>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 print:text-xs print:mt-1">{profitShareTitle}</p>
                            </div>`;

content = content.replace(targetUI, newUI);

fs.writeFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', content);
console.log("Done phase 2");
