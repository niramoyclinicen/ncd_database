const fs = require('fs');
let file = 'components/LabReportingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state variables
code = code.replace(
    'const [rtTemplates, setRtTemplates]',
    `const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateSaveName, setTemplateSaveName] = useState('');
    const [rtTemplates, setRtTemplates]`
);

// 2. Replace the button click
const oldButton = `<button 
                                                        onClick={() => {
                                                            const name = prompt("Enter Template Name:");
                                                            if (name) {
                                                                const newTpl = {
                                                                    id: \`TPL-\${Date.now()}\`,
                                                                    templateName: name,
                                                                    testName: activeTestName,
                                                                    contentHtml: typeof currentReportData === 'string' ? currentReportData : (currentReportData?.html || currentReportData?.impression || '')
                                                                };
                                                                const current = JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]');
                                                                localStorage.setItem('ncd_rt_templates_v1', JSON.stringify([...current, newTpl]));
                                                                setRtTemplates([...current, newTpl]);
                                                                setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                                            }
                                                        }}
                                                        className="w-full bg-slate-800 text-white hover:bg-slate-700 text-[10px] py-1.5 rounded uppercase font-bold mt-1"
                                                    >
                                                        Save As Template
                                                    </button>`;

const newButton = `<button 
                                                        onClick={() => {
                                                            setTemplateSaveName('');
                                                            setShowTemplateModal(true);
                                                        }}
                                                        className="w-full bg-slate-800 text-white hover:bg-slate-700 text-[10px] py-1.5 rounded uppercase font-bold mt-1"
                                                    >
                                                        Save As Template
                                                    </button>`;

code = code.replace(oldButton, newButton);

// 3. Add the modal rendering near the end of the return statement
const modalHtml = `
            {/* Template Save Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-4">Save Template</h3>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Template Name:</label>
                        <input 
                            type="text" 
                            className="w-full border-2 border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 mb-6 font-bold text-slate-800"
                            placeholder="e.g. Normal Study"
                            value={templateSaveName}
                            onChange={e => setTemplateSaveName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300">Cancel</button>
                            <button onClick={() => {
                                if (!templateSaveName.trim()) { alert("Please enter a name"); return; }
                                const newTpl = {
                                    id: \`TPL-\${Date.now()}\`,
                                    templateName: templateSaveName.trim(),
                                    testName: activeTestName,
                                    contentHtml: typeof currentReportData === 'string' ? currentReportData : (currentReportData?.html || currentReportData?.impression || '')
                                };
                                const current = JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]');
                                localStorage.setItem('ncd_rt_templates_v1', JSON.stringify([...current, newTpl]));
                                setRtTemplates([...current, newTpl]);
                                setShowTemplateModal(false);
                                setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                            }} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
`;

code = code.replace('        </div>\n    );\n};', modalHtml + '\n        </div>\n    );\n};');

fs.writeFileSync(file, code);
console.log("Fixed prompt in LabReportingPage");
