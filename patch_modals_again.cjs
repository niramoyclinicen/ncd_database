const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetStr = `    if (viewMode === 'template_mgmt') return <TemplateManagementPage onBack={() => setViewMode('reporting')} tests={tests} />;

    return (`;

const modalCode = `    if (viewMode === 'template_mgmt') return <TemplateManagementPage onBack={() => setViewMode('reporting')} tests={tests} />;

    const renderModals = () => (
        <>
            {/* Template Save Modal */}
            {showSaveTemplateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
                        <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-widest border-b pb-2">Save Template</h3>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Category</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-bold text-slate-800"
                                    placeholder="e.g. Ultrasonography"
                                    value={templateSaveCategory}
                                    onChange={e => setTemplateSaveCategory(e.target.value)}
                                    list="save-cat-list"
                                />
                                <datalist id="save-cat-list">
                                    {Array.from(new Set(rtTemplates.map(t => t.category).filter(Boolean))).map(c => <option key={c as string} value={c as string} />)}
                                </datalist>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Sub Category</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-bold text-slate-800"
                                    placeholder="e.g. Pregnancy"
                                    value={templateSaveSubCategory}
                                    onChange={e => setTemplateSaveSubCategory(e.target.value)}
                                    list="save-subcat-list"
                                />
                                <datalist id="save-subcat-list">
                                    {Array.from(new Set(rtTemplates.filter(t => t.category === templateSaveCategory).map(t => t.subCategory).filter(Boolean))).map(c => <option key={c as string} value={c as string} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Template Name</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-bold text-slate-800"
                                    placeholder="e.g. Normal Study"
                                    value={templateSaveName}
                                    onChange={e => setTemplateSaveName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowSaveTemplateModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={() => {
                                if (!templateSaveName.trim() || !templateSaveCategory.trim() || !templateSaveSubCategory.trim()) { alert("Please fill all fields"); return; }
                                const newTpl = {
                                    id: 'TPL-' + Date.now(),
                                    templateName: templateSaveName.trim(),
                                    category: templateSaveCategory.trim(),
                                    subCategory: templateSaveSubCategory.trim(),
                                    testName: templateSaveSubCategory.trim(),
                                    contentHtml: typeof currentReportData === 'string' ? currentReportData : (currentReportData?.html || currentReportData?.impression || '')
                                };
                                const current = JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]');
                                localStorage.setItem('ncd_rt_templates_v1', JSON.stringify([...current, newTpl]));
                                setRtTemplates([...current, newTpl]);
                                setShowSaveTemplateModal(false);
                                setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                setTimeout(() => setSuccessMessage(''), 3000);
                            }} className="px-5 py-2.5 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">Save Template</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Insert Modal */}
            {showInsertTemplateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in">
                    <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
                        <div className="bg-white px-6 py-4 border-b flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Insert Template</h3>
                                <p className="text-xs font-bold text-slate-500">Find and insert a template into your report</p>
                            </div>
                            <button onClick={() => setShowInsertTemplateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors">×</button>
                        </div>
                        
                        <div className="flex flex-1 overflow-hidden min-h-0">
                            {/* Filter Sidebar */}
                            <div className="w-[250px] bg-white border-r p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar shrink-0">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Search Templates</label>
                                    <input 
                                        type="text" 
                                        placeholder="Search..."
                                        value={insertTemplateSearchTerm}
                                        onChange={e => setInsertTemplateSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Category</label>
                                    <select 
                                        value={insertTemplateCategoryFilter}
                                        onChange={e => { setInsertTemplateCategoryFilter(e.target.value); setInsertTemplateSubCategoryFilter('All'); }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                                    >
                                        <option value="All">All Categories</option>
                                        {Array.from(new Set(rtTemplates.map(t => t.category).filter(Boolean))).map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                                    </select>
                                </div>
                                {insertTemplateCategoryFilter !== 'All' && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Sub Category</label>
                                        <select 
                                            value={insertTemplateSubCategoryFilter}
                                            onChange={e => setInsertTemplateSubCategoryFilter(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                                        >
                                            <option value="All">All Sub Categories</option>
                                            {Array.from(new Set(rtTemplates.filter(t => t.category === insertTemplateCategoryFilter).map(t => t.subCategory).filter(Boolean))).map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            
                            {/* Results Grid */}
                            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(() => {
                                        const filtered = rtTemplates.filter(t => 
                                            (insertTemplateCategoryFilter === 'All' || t.category === insertTemplateCategoryFilter) &&
                                            (insertTemplateSubCategoryFilter === 'All' || t.subCategory === insertTemplateSubCategoryFilter) &&
                                            (t.templateName.toLowerCase().includes(insertTemplateSearchTerm.toLowerCase()) || 
                                             (t.subCategory && t.subCategory.toLowerCase().includes(insertTemplateSearchTerm.toLowerCase())))
                                        );
                                        
                                        if (filtered.length === 0) {
                                            return <div className="col-span-full py-10 text-center text-slate-400 font-bold">No templates found matching your criteria.</div>;
                                        }
                                        
                                        return filtered.map(t => (
                                            <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col">
                                                <div className="mb-3">
                                                    <div className="flex flex-wrap gap-1 mb-1">
                                                        <span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-sm font-black uppercase">{t.category}</span>
                                                        <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-sm font-black uppercase">{t.subCategory}</span>
                                                    </div>
                                                    <h4 className="font-black text-slate-800 text-sm leading-tight">{t.templateName}</h4>
                                                </div>
                                                <button onClick={() => {
                                                    if(confirm('Replace current content with this template?')) {
                                                        setCurrentReportData(t.contentHtml);
                                                        setShowInsertTemplateModal(false);
                                                    }
                                                }} className="mt-auto w-full py-2 bg-indigo-50 text-indigo-700 font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">
                                                    Insert
                                                </button>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, modalCode);
    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("Target string not found!");
}
