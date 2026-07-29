const fs = require('fs');
const file = 'components/LabReportingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix template select value issue by controlling it or just forcing it to reset
const targetSelect = `<select 
                                                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold outline-none"
                                                        onChange={(e) => {
                                                            const t = rtTemplates.find(x => x.id === e.target.value);
                                                            if(t) {
                                                                if(confirm('Replace current content with template?')) {
                                                                    setCurrentReportData(t.contentHtml);
                                                                }
                                                            }
                                                        }}
                                                    >`;

const replaceSelect = `<select 
                                                        value=""
                                                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] font-bold outline-none"
                                                        onChange={(e) => {
                                                            const t = rtTemplates.find(x => x.id === e.target.value);
                                                            if(t) {
                                                                if(confirm('Replace current content with template?')) {
                                                                    setCurrentReportData(t.contentHtml);
                                                                }
                                                            }
                                                        }}
                                                    >`;

code = code.replace(targetSelect, replaceSelect);

// 2. Hide toolbar inside the page
const targetToolbar = `<RichTextEditor 
                                                            value={typeof currentReportData === 'string' ? currentReportData : (currentReportData?.html || currentReportData?.impression || '')} 
                                                            onChange={(val: string) => setCurrentReportData(val)} 
                                                            readOnly={false}
                                                            hideToolbar={false}
                                                        />`;

const replaceToolbar = `<RichTextEditor 
                                                            value={typeof currentReportData === 'string' ? currentReportData : (currentReportData?.html || currentReportData?.impression || '')} 
                                                            onChange={(val: string) => setCurrentReportData(val)} 
                                                            readOnly={false}
                                                            hideToolbar={true}
                                                        />`;

code = code.replace(targetToolbar, replaceToolbar);

fs.writeFileSync(file, code);
