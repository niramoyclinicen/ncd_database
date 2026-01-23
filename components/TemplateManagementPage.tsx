
import React, { useState, useEffect, useMemo } from 'react';
import { ReportTemplate, ReportField, testCategories } from './DiagnosticData';
import { SaveIcon, BackIcon, PlusIcon, FileTextIcon, SettingsIcon, Activity } from './Icons';

interface Props {
  onBack: () => void;
}

interface EditorField extends ReportField {
  id: string;
}

const TemplateManagementPage: React.FC<Props> = ({ onBack }) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>(() => {
    const saved = localStorage.getItem('ncd_report_templates_v4');
    return saved ? JSON.parse(saved) : [];
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All List');
  
  const [currentTemplate, setCurrentTemplate] = useState<{
    id: string;
    name: string;
    category: string;
    gender: 'Male' | 'Female' | 'Common';
    fields: EditorField[];
    impression: string;
    extraNote: string;
  }>({
    id: '', 
    name: '', 
    category: 'Ultrasonography (USG)', 
    gender: 'Common', 
    fields: [{ label: '', value: '', type: 'locked', isBold: false, fontSize: '14px', color: '#000000', id: `row-${Date.now()}` }], 
    extraNote: '', 
    impression: ''
  });

  useEffect(() => {
    localStorage.setItem('ncd_report_templates_v4', JSON.stringify(templates));
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'All List') return templates;
    return templates.filter(t => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  const handleAddField = () => {
    setCurrentTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, { 
        label: '', 
        value: '', 
        type: 'locked', 
        isBold: false, 
        fontSize: '14px', 
        color: '#000000', 
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` 
      }]
    }));
  };

  const handleFieldChange = (fieldId: string, property: keyof ReportField, val: any) => {
    setCurrentTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, [property]: val } : f)
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    if (currentTemplate.fields.length <= 1) return;
    setCurrentTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const handleSave = () => {
    if (!currentTemplate.name) return alert("টেমপ্লেটের একটি নাম দিন।");
    
    const storageTemplate: ReportTemplate = {
      id: isEditing && currentTemplate.id ? currentTemplate.id : `TMP-${Date.now()}`,
      name: currentTemplate.name,
      category: currentTemplate.category,
      gender: currentTemplate.gender,
      testMapping: [],
      fields: currentTemplate.fields.map(({ id, ...rest }) => rest),
      impression: currentTemplate.impression,
      extraNote: currentTemplate.extraNote
    };

    setTemplates(prev => {
      if (isEditing && currentTemplate.id) {
        return prev.map(t => t.id === currentTemplate.id ? storageTemplate : t);
      }
      return [storageTemplate, ...prev];
    });
    
    setIsEditing(false);
    resetForm();
    alert("Master Template Saved Successfully!");
  };

  const resetForm = () => {
    setCurrentTemplate({ 
      id: '', name: '', category: 'Ultrasonography (USG)', gender: 'Common', 
      fields: [{ label: '', value: '', type: 'locked', isBold: false, fontSize: '14px', color: '#000000', id: `row-${Date.now()}` }], 
      extraNote: '', impression: '' 
    });
  };

  const editTemplate = (t: ReportTemplate) => {
    setCurrentTemplate({
      ...t,
      fields: t.fields.map(f => ({ ...f, id: `row-${Math.random().toString(36).substr(2, 9)}` }))
    });
    setIsEditing(true);
  };

  const libraryCategories = ['All List', ...testCategories];

  return (
    <div className="bg-slate-100 h-full flex flex-col overflow-hidden text-slate-800">
      <div className="p-4 bg-slate-900 flex justify-between items-center text-white shrink-0 shadow-2xl z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-all"><BackIcon size={20}/></button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black uppercase tracking-tighter">NCD Template Master</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Logic Configuration</p>
          </div>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button onClick={() => { resetForm(); setIsEditing(true); }} className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-500 transition-all">Create New Master</button>
          ) : (
            <>
              <button onClick={() => { setIsEditing(false); resetForm(); }} className="bg-slate-700 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase">Cancel</button>
              <button onClick={handleSave} className="bg-emerald-600 text-white px-10 py-2.5 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2 border-b-4 border-emerald-900 active:scale-95 transition-all"><SaveIcon size={14}/> Save Master</button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* CATEGORY SIDEBAR */}
        {!isEditing && (
          <div className="w-64 bg-slate-800 flex flex-col shrink-0 border-r border-slate-700 no-print">
            <div className="p-4 bg-slate-900 border-b border-slate-700">
              <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest">Template Groups</h3>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {libraryCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-6 py-3 text-xs font-bold transition-all border-l-4 ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-400 shadow-inner' : 'text-slate-400 border-transparent hover:bg-slate-700 hover:text-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="flex-1 flex overflow-hidden animate-fade-in">
            <div className="w-[600px] overflow-y-auto bg-slate-50 border-r border-slate-300 p-4 space-y-4 custom-scrollbar shadow-inner shrink-0">
                
                <div className="bg-indigo-900 text-indigo-100 p-3 rounded-xl shadow-lg border-l-4 border-indigo-400">
                    <h4 className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-2"><Activity size={12}/> Shortcuts Guide</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-bold opacity-90">
                        <span className="flex items-center gap-1">🔹 Dropdown: <code className="bg-indigo-800 px-1 rounded">[A/B]</code></span>
                        <span className="flex items-center gap-1">🔹 Tag: <code className="bg-indigo-800 px-1 rounded">[[Name]]</code></span>
                        <span className="flex items-center gap-1">🔹 Input: <code className="bg-indigo-800 px-1 rounded">___</code></span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Report Title</label>
                        <input value={currentTemplate.name} onChange={e=>setCurrentTemplate(prev=>({...prev, name: e.target.value}))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-sm focus:border-blue-500 outline-none" placeholder="e.g. USG OF KUB" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                            <select value={currentTemplate.category} onChange={e=>setCurrentTemplate(prev=>({...prev, category: e.target.value}))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs">
                            {testCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Gender</label>
                            <select value={currentTemplate.gender} onChange={e=>setCurrentTemplate(prev=>({...prev, gender: e.target.value as any}))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs">
                                <option value="Common">Common</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1 mb-1">
                        <h3 className="font-black text-slate-500 uppercase text-[10px] tracking-widest">Findings Sequence</h3>
                        <button onClick={handleAddField} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all">+ Add Row</button>
                    </div>
                    
                    <div className="space-y-1">
                        {currentTemplate.fields.map((f) => (
                        <div key={f.id} className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-all">
                            <div className="flex gap-3 items-start">
                                <div className="w-1/3 space-y-1">
                                    <div className="flex justify-between items-center pr-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase">Label</label>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={()=>handleFieldChange(f.id, 'isBold', !f.isBold)} title="Toggle Bold" className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black transition-all ${f.isBold ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>B</button>
                                            <input type="color" value={f.color} onChange={e=>handleFieldChange(f.id, 'color', e.target.value)} className="w-5 h-5 border-none p-0 cursor-pointer bg-transparent" title="Pick Color" />
                                            <select value={f.fontSize} onChange={e=>handleFieldChange(f.id, 'fontSize', e.target.value)} className="text-[8px] border-none bg-slate-100 rounded px-1 outline-none">
                                                {['10px','12px','14px','16px','18px','20px'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <button onClick={()=>handleRemoveField(f.id)} className="w-5 h-5 rounded bg-rose-50 text-rose-500 flex items-center justify-center text-[9px] font-black hover:bg-rose-500 hover:text-white transition-all">×</button>
                                        </div>
                                    </div>
                                    <input 
                                        value={f.label} 
                                        onChange={e=>handleFieldChange(f.id, 'label', e.target.value)} 
                                        className="w-full p-1.5 border border-slate-100 bg-slate-50/50 rounded-md text-[11px] font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white capitalize" 
                                        placeholder="e.g. Liver" 
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Findings / Result Template</label>
                                    <textarea 
                                        value={f.value} 
                                        onChange={e=>handleFieldChange(f.id, 'value', e.target.value)} 
                                        className={`w-full p-1.5 border border-slate-100 bg-slate-50/50 rounded-md text-[11px] h-9 outline-none focus:bg-white focus:border-blue-200 transition-all resize-none ${f.isBold ? 'font-black' : 'font-medium'}`} 
                                        placeholder="[N/E], ___, [[Tag]]" 
                                        style={{ fontSize: f.fontSize, color: f.color }}
                                    />
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl shadow-xl mt-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Final Impression / Conclusion</label>
                    <textarea value={currentTemplate.impression} onChange={e=>setCurrentTemplate(prev=>({...prev, impression: e.target.value}))} className="w-full p-3 bg-slate-800 border-none rounded-lg font-bold text-xs h-20 text-white focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" placeholder="Use [[TagName]] to link..." />
                </div>
            </div>

            <div className="flex-1 bg-slate-200 p-10 overflow-y-auto flex justify-center custom-scrollbar">
                <div className="bg-white w-full max-w-[820px] min-h-[1100px] shadow-2xl p-16 flex flex-col font-serif text-black origin-top scale-[0.8] -mt-20">
                    <div className="text-center mb-10 border-b-4 border-slate-900 pb-4">
                        <h2 className="text-3xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h2>
                        <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-[0.3em]">Master Template Preview</p>
                    </div>
                    <h1 className="text-2xl text-center font-black underline uppercase tracking-widest mb-12">{currentTemplate.name || 'UNTITLED REPORT'}</h1>
                    
                    <div className="flex-1 space-y-2">
                        {currentTemplate.fields.map((f) => (
                            <div key={f.id} className="flex items-start">
                                <div className="w-48 shrink-0 text-sm font-bold text-slate-800 pt-1 text-left font-sans capitalize pl-2">
                                    {f.label || 'Label'}
                                </div>
                                <div className="w-6 shrink-0 text-center font-black text-sm pt-1">:</div>
                                <div className="flex-1">
                                    <div style={{ fontSize: f.fontSize, color: f.color }} className={`leading-relaxed whitespace-pre-wrap pl-1 ${f.isBold ? 'font-black' : 'font-normal'}`}>
                                        {f.value || '...'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <div className="mt-20 pt-8 border-t-4 border-slate-900">
                            <h4 className="text-base font-black uppercase underline mb-4">Impression:</h4>
                            <p className="text-xl font-black italic whitespace-pre-wrap">{currentTemplate.impression || '...'}</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-10">
            <div className="max-w-7xl mx-auto space-y-10">
                <div className="flex justify-between items-end border-b-2 border-slate-200 pb-5">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">NCD Master Library</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Found {filteredTemplates.length} Saved Masters {selectedCategory !== 'All List' && `in ${selectedCategory}`}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTemplates.map(t => (
                        <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-white shadow-xl hover:shadow-2xl hover:border-blue-400 transition-all group flex flex-col justify-between relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-2 ${t.gender === 'Male' ? 'bg-blue-500' : t.gender === 'Female' ? 'bg-pink-500' : 'bg-slate-300'}`}></div>
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`text-[10px] font-black px-4 py-1 rounded-full uppercase shadow-inner ${t.gender === 'Male' ? 'bg-blue-50 text-blue-700' : t.gender === 'Female' ? 'bg-pink-50 text-pink-700' : 'bg-slate-100 text-slate-700'}`}>{t.gender}</span>
                                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors"><FileTextIcon className="text-slate-300 group-hover:text-blue-500" size={20}/></div>
                                </div>
                                <h4 className="font-black text-slate-800 text-2xl uppercase tracking-tighter leading-none mb-4 group-hover:text-blue-900 transition-colors">{t.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{t.category}</p>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => editTemplate(t)} className="flex-1 py-4 bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-blue-600 transition-all shadow-lg active:scale-95">Edit Master</button>
                                <button onClick={() => { if(confirm("Confirm Delete?")) setTemplates(templates.filter(x=>x.id!==t.id)) }} className="p-4 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-rose-100 shadow-sm active:scale-90">×</button>
                            </div>
                        </div>
                    ))}
                    <div onClick={() => { resetForm(); setIsEditing(true); }} className="bg-slate-100 p-8 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-400 transition-all group min-h-[300px]">
                        <div className="p-6 bg-white rounded-full shadow-lg group-hover:bg-blue-600 transition-all group-hover:scale-110"><PlusIcon className="text-slate-400 group-hover:text-white" size={40} /></div>
                        <p className="mt-6 text-xl font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Create New Master</p>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TemplateManagementPage;
