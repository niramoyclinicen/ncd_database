const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetOld = `                                                    <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                                                        {rtTemplates.filter((t: any) => t.testName === activeTestName).length === 0 && (
                                                            <div className="text-[9px] text-slate-400 text-center py-3 font-bold italic">No templates for this test.</div>
                                                        )}
                                                        {rtTemplates.filter((t: any) => t.testName === activeTestName).map((t: any) => (
                                                            <button 
                                                                key={t.id} 
                                                                onClick={() => {
                                                                    if(confirm('Replace current content with template?')) {
                                                                        setCurrentReportData(t.contentHtml);
                                                                    }
                                                                }}
                                                                className="w-full text-left bg-blue-50 hover:bg-blue-500 text-blue-900 hover:text-white px-2 py-1.5 rounded text-[10px] font-bold truncate transition-colors border border-blue-200 shadow-sm"
                                                                title={t.templateName}
                                                            >
                                                                {t.templateName || 'Unnamed'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    
                                                    {rtTemplates.filter((t: any) => t.testName !== activeTestName).length > 0 && (
                                                        <select 
                                                            value=""
                                                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[9px] font-bold outline-none mt-1 text-slate-600"
                                                            onChange={(e) => {
                                                                const currentTemplates = JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]');
                                                                const t = currentTemplates.find((x: any) => x.id === e.target.value);
                                                                if(t) {
                                                                    if(confirm('Replace current content with template?')) {
                                                                        setCurrentReportData(t.contentHtml);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Other Templates...</option>
                                                            {rtTemplates.filter((t: any) => t.testName !== activeTestName).map((t: any) => (
                                                                <option key={t.id} value={t.id}>{t.templateName || 'Unnamed'} ({t.testName || 'Unknown'})</option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    <button 
                                                        onClick={() => {
                                                            setTemplateSaveName('');
                                                            setShowTemplateModal(true);
                                                        }}
                                                        className="w-full bg-slate-800 text-white hover:bg-slate-700 text-[10px] py-2 rounded uppercase font-black mt-1 shadow-md transition-all active:scale-95"
                                                    >
                                                        Save As Template
                                                    </button>`;

const targetNew = `                                                    <button 
                                                        onClick={() => {
                                                            setInsertTemplateSearchTerm('');
                                                            setInsertTemplateCategoryFilter(isUSG ? 'Ultrasonography (USG)' : 'Pathology');
                                                            setInsertTemplateSubCategoryFilter(activeTestName || 'All');
                                                            setShowInsertTemplateModal(true);
                                                        }}
                                                        className="w-full bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] py-2 rounded uppercase font-black shadow-md transition-all active:scale-95 mb-1"
                                                    >
                                                        Insert Template
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setTemplateSaveName('');
                                                            setTemplateSaveCategory(isUSG ? 'Ultrasonography (USG)' : 'Pathology');
                                                            setTemplateSaveSubCategory(activeTestName || '');
                                                            setShowSaveTemplateModal(true);
                                                        }}
                                                        className="w-full bg-slate-800 text-white hover:bg-slate-700 text-[10px] py-2 rounded uppercase font-black shadow-md transition-all active:scale-95"
                                                    >
                                                        Save As Template
                                                    </button>`;

if (content.includes(targetOld)) {
    content = content.replace(targetOld, targetNew);
    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("Could not find the target string.");
}
