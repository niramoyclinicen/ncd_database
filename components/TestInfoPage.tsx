import React, { useState, useEffect, useMemo } from 'react';
import { Reagent, Test, emptyTest, testCategories, SubTest } from './DiagnosticData';
import { PlusIcon, SaveIcon, SearchIcon } from './Icons';

interface Props {
    reagents: Reagent[];
    tests: Test[];
    setTests: React.Dispatch<React.SetStateAction<Test[]>>;
}

const TestInfoPage: React.FC<Props> = ({ reagents, tests, setTests }) => {
  const [formData, setFormData] = useState<Test>(emptyTest);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');
  const [successMessage, setSuccessMessage] = useState('');

  // Sub-test Management Local State
  const [tempSubTests, setTempSubTests] = useState<SubTest[]>([]);

  useEffect(() => {
    if (successMessage) {
        const timer = setTimeout(() => setSuccessMessage(''), 5000);
        return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const matchesSearch = test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          test.test_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedFilterCategory === 'All' || test.category === selectedFilterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, tests, selectedFilterCategory]);

  // Count helper for category buttons
  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return tests.length;
    return tests.filter(t => t.category === cat).length;
  };

  useEffect(() => {
    setTempSubTests(formData.sub_tests || []);
  }, [formData.test_id, formData.sub_tests]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'is_group_test') {
      setFormData(prev => ({ ...prev, is_group_test: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addSubTestRow = () => {
    const newSub: SubTest = { id: Date.now().toString(), name: '', unit: '', normal_range: '' };
    setTempSubTests([...tempSubTests, newSub]);
  };

  const updateSubTest = (id: string, field: keyof SubTest, val: string) => {
    setTempSubTests(tempSubTests.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const removeSubTest = (id: string) => {
    setTempSubTests(tempSubTests.filter(s => s.id !== id));
  };

  const resetForm = () => {
    setFormData(emptyTest);
    setSelectedTestId(null);
    setIsEditing(false);
    setTempSubTests([]);
  };

  const handleGetNewId = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const count = tests.length + 1;
    const newId = `TEST-${dateStr}-${String(count).padStart(3, '0')}`;
    resetForm();
    setFormData({ ...emptyTest, test_id: newId });
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.test_id || !formData.test_name || !formData.category) return alert("Missing info");

    const finalTest = { ...formData, sub_tests: formData.is_group_test ? tempSubTests : [] };

    if (isEditing) {
      setTests(tests.map(t => t.test_id === finalTest.test_id ? finalTest : t));
    } else {
      setTests([finalTest, ...tests]);
    }
    setSuccessMessage('Test data saved successfully!');
    resetForm();
  };

  const handleRowClick = (test: Test) => {
    setFormData(test);
    setSelectedTestId(test.test_id);
    setIsEditing(true);
  };

  const inputBaseClasses = "py-2 px-3 mt-1 block w-full border border-sky-800 rounded-md shadow-sm sm:text-sm bg-sky-900/50 text-sky-200 placeholder-sky-400 focus:bg-sky-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";
  const labelBaseClasses = "block text-xs font-black text-sky-400 uppercase tracking-widest ml-1";

  return (
    <div className="bg-slate-900 text-slate-200 rounded-xl p-4 sm:p-6 space-y-8 relative">
        {/* Success Message - Moved to top center with high z-index */}
        {successMessage && (
            <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[999] bg-emerald-600 border-2 border-white text-white px-10 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-down font-black flex items-center gap-3">
                <div className="bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-lg">✓</div>
                {successMessage}
            </div>
        )}
        
        {/* TOP CONFIGURATION FORM */}
        <div className="bg-sky-950 rounded-[2.5rem] p-8 border border-sky-800 shadow-2xl">
            <h2 className="text-3xl font-black text-sky-100 mb-8 border-b border-sky-800 pb-4 uppercase tracking-tighter">Diagnostic Test Configuration</h2>
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-800 pb-6 mb-8">
                <div className="flex items-center gap-3">
                    <label className="font-black text-xs text-sky-500 uppercase tracking-widest">Master ID:</label>
                    <input type="text" disabled value={formData.test_id} className="w-44 border border-sky-800 rounded-xl shadow-inner px-4 py-2 bg-slate-900 text-sky-400 font-mono text-sm cursor-not-allowed" placeholder="AUTO-ID" />
                    <button type="button" onClick={handleGetNewId} className="px-5 py-2.5 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-lg active:scale-95 transition-all uppercase tracking-widest">Get New ID</button>
                </div>
                <div className="flex items-center gap-3">
                    <button type="submit" form="test-form" className="px-10 py-2.5 text-xs font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 shadow-xl active:scale-95 transition-all uppercase tracking-widest">Save Test</button>
                    <button type="button" onClick={resetForm} className="px-6 py-2.5 text-xs font-black text-sky-200 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all uppercase tracking-widest">Cancel</button>
                </div>
            </div>

            <form id="test-form" onSubmit={handleSaveTest} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelBaseClasses}>Test Name / Group Name</label>
                        <input type="text" name="test_name" value={formData.test_name} onChange={handleInputChange} required className={inputBaseClasses} placeholder="e.g. Lipid Profile or CBC"/>
                    </div>
                    <div>
                        <label className={labelBaseClasses}>Category</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} required className={inputBaseClasses}>
                            <option value="" disabled hidden>Select Category</option>
                            {testCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center justify-center bg-slate-900/50 rounded-2xl border border-sky-800 p-2 mt-4">
                        <input id="is_group" name="is_group_test" type="checkbox" checked={formData.is_group_test} onChange={handleInputChange} className="h-5 w-5 text-blue-600 bg-slate-800 border-sky-700 rounded focus:ring-blue-500" />
                        <label htmlFor="is_group" className="ml-3 text-sm font-black text-sky-200 uppercase tracking-widest cursor-pointer">Group / Panel Test?</label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className={labelBaseClasses}>Service Price (BDT)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" className={inputBaseClasses} />
                    </div>
                    <div>
                        <label className={labelBaseClasses}>Commission (PC)</label>
                        <input type="number" name="test_commission" value={formData.test_commission} onChange={handleInputChange} min="0" className={inputBaseClasses} />
                    </div>
                    {!formData.is_group_test && (
                        <>
                            <div>
                                <label className={labelBaseClasses}>Normal Range</label>
                                <input type="text" name="normal_range" value={formData.normal_range} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. 70 - 110"/>
                            </div>
                            <div>
                                <label className={labelBaseClasses}>Unit</label>
                                <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. mg/dL"/>
                            </div>
                        </>
                    )}
                </div>

                {formData.is_group_test && (
                    <div className="bg-slate-900/50 rounded-[2rem] p-6 border-2 border-dashed border-sky-800 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-sky-300 uppercase tracking-tighter font-bengali">সাব-টেস্ট তালিকা (Parameters for Group Report)</h3>
                            <button type="button" onClick={addSubTestRow} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all"><PlusIcon size={14}/> Add Parameter</button>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-sky-900 shadow-inner">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-800 text-[10px] uppercase font-black text-sky-500 tracking-widest">
                                    <tr>
                                        <th className="p-3">Parameter Name</th>
                                        <th className="p-3">Unit</th>
                                        <th className="p-3">Normal Range / Reference</th>
                                        <th className="p-3 text-center w-20">Remove</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sky-900/30">
                                    {tempSubTests.map((sub) => (
                                        <tr key={sub.id} className="bg-slate-950/20">
                                            <td className="p-2"><input value={sub.name} onChange={e=>updateSubTest(sub.id, 'name', e.target.value)} className="w-full bg-slate-900 border border-sky-900 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. S. Cholesterol" /></td>
                                            <td className="p-2"><input value={sub.unit} onChange={e=>updateSubTest(sub.id, 'unit', e.target.value)} className="w-full bg-slate-900 border border-sky-900 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="mg/dL" /></td>
                                            <td className="p-2"><input value={sub.normal_range} onChange={e=>updateSubTest(sub.id, 'normal_range', e.target.value)} className="w-full bg-slate-900 border border-sky-900 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="< 200" /></td>
                                            <td className="p-2 text-center"><button type="button" onClick={()=>removeSubTest(sub.id)} className="text-red-500 font-bold hover:text-red-300 transition-colors">×</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </form>
        </div>
      
        {/* FILTERED TEST LIST TABLE */}
        <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 bg-slate-900/80 border-b border-slate-700 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Test Master Library</h3>
                    <div className="relative w-96">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Quick search by name or ID..." 
                            value={searchTerm} 
                            onChange={e=>setSearchTerm(e.target.value)} 
                            className="w-full bg-slate-950 border border-slate-700 rounded-full py-3 pl-12 pr-6 text-sm text-white focus:border-blue-500 outline-none shadow-inner font-medium"
                        />
                    </div>
                </div>

                {/* CATEGORY FILTER BUTTONS */}
                <div className="flex flex-wrap gap-2">
                    {['All', ...testCategories].map(cat => {
                        const isActive = selectedFilterCategory === cat;
                        const count = getCategoryCount(cat);
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedFilterCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105 z-10' 
                                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                                }`}
                            >
                                {cat}
                                <span className={`px-2 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-blue-400 text-blue-900' : 'bg-slate-900 text-slate-600'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700/50 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                        <tr>
                            <th className="px-8 py-5 text-left">Master ID</th>
                            <th className="px-8 py-5 text-left">Investigation Description</th>
                            <th className="px-8 py-5 text-left">Department</th>
                            <th className="px-8 py-5 text-center">Protocol</th>
                            <th className="px-8 py-5 text-right">Price (BDT)</th>
                            <th className="px-8 py-5 text-right">PC Amt</th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700/50">
                        {filteredTests.map((test) => (
                        <tr 
                            key={test.test_id} 
                            onClick={() => handleRowClick(test)} 
                            className={`cursor-pointer hover:bg-blue-900/20 transition-all group ${selectedTestId === test.test_id ? 'bg-blue-900/40' : ''}`}
                        >
                            <td className="px-8 py-5 whitespace-nowrap text-xs text-sky-400 font-mono group-hover:text-sky-300">{test.test_id}</td>
                            <td className="px-8 py-5 whitespace-nowrap">
                                <div className="text-sm text-slate-200 font-black group-hover:text-white transition-colors">{test.test_name}</div>
                                {test.normal_range && <div className="text-[10px] text-slate-500 mt-0.5">Ref: {test.normal_range} {test.unit}</div>}
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-xs text-slate-400 font-bold">{test.category}</td>
                            <td className="px-8 py-5 whitespace-nowrap text-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${
                                    test.is_group_test 
                                    ? 'bg-purple-900/30 text-purple-400 border-purple-800' 
                                    : 'bg-blue-900/30 text-blue-400 border-blue-800'
                                }`}>
                                    {test.is_group_test ? 'Group / Panel' : 'Single Test'}
                                </span>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-lg text-white font-black text-right tracking-tight group-hover:text-emerald-400 transition-colors">৳{test.price.toFixed(2)}</td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-400 text-right font-bold">৳{test.test_commission.toFixed(2)}</td>
                        </tr>
                        ))}
                        {filteredTests.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center opacity-20">
                                        <SearchIcon size={64} className="mb-4" />
                                        <p className="text-2xl font-black uppercase tracking-[0.2em]">No Matches Found</p>
                                        <p className="text-xs font-bold mt-2 uppercase">Try adjusting your search or category filters</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Showing {filteredTests.length} of {tests.length} tests</span>
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Single Test</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Group Test</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TestInfoPage;