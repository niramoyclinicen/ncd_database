
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SaveIcon, FileTextIcon } from './Icons';
import { Patient, LabInvoice, Doctor, Employee } from './DiagnosticData';

export interface LipidResults {
  s_cholesterol: string; triglycerides: string; hdl_cholesterol: string; ldl_cholesterol: string; vldl_cholesterol: string; note: string;
  s_cholesterol_range: string; triglycerides_range: string; hdl_cholesterol_range: string; ldl_cholesterol_range: string; vldl_cholesterol_range: string;
}

const defaultLipidResults: LipidResults = {
  s_cholesterol: '', triglycerides: '', hdl_cholesterol: '', ldl_cholesterol: '', vldl_cholesterol: '', note: '',
  s_cholesterol_range: 'Desirable: < 200',
  triglycerides_range: 'Normal: < 150',
  hdl_cholesterol_range: 'Low: < 40',
  ldl_cholesterol_range: 'Optimal: < 100',
  vldl_cholesterol_range: 'Normal: 05 - 40'
};

const LipidProfileInputPage: React.FC<any> = ({ results: initialResults, onSaveOverride, disabled, patient, invoice, doctors, employees, technologistId, consultantId, isEmbedded, checkRange }) => {
    const [localResults, setLocalResults] = useState<LipidResults>(initialResults || defaultLipidResults);
    const typingTimeoutRef = useRef<any>(null);

    useEffect(() => { 
        if (!typingTimeoutRef.current && initialResults) {
            setLocalResults(initialResults); 
        }
    }, [initialResults]);

    const updateField = (f: keyof LipidResults, v: string) => {
        const updated = { ...localResults, [f]: v };
        setLocalResults(updated);
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (onSaveOverride && isEmbedded) {
                // Pass true for auto-save flag
                onSaveOverride(updated, true);
            }
            typingTimeoutRef.current = null;
        }, 1000);
    };

    const TableRow = ({ label, field, rangeField }: any) => {
        const val = localResults[field as keyof LipidResults] || '';
        const range = localResults[rangeField as keyof LipidResults] || '';
        const isAlert = checkRange && checkRange(val, range);

        return (
            <tr className="border-b-2 border-black h-10">
                <td className="p-2 border-r-2 border-black font-black uppercase text-[11px]">{label}</td>
                <td className="p-0.5 border-r-2 border-black text-center">
                    <input 
                        value={val} 
                        onChange={e=>updateField(field as keyof LipidResults, e.target.value)} 
                        className={`w-full border-none text-center font-black text-lg outline-none no-print placeholder:text-slate-300 ${isAlert ? 'bg-red-50 text-red-600' : 'bg-blue-50/50 text-slate-900'}`} 
                        placeholder="..." 
                        onFocus={e=>e.target.select()}
                    />
                    <span className={`hidden print:block text-center font-black text-base ${isAlert ? 'text-red-600' : ''}`}>{val || '...'}</span>
                </td>
                <td className="p-2 border-r-2 border-black text-center font-black text-[10px] uppercase italic">mg/dL</td>
                <td className="p-1.5 font-bold text-[9px] text-slate-700 italic whitespace-pre-wrap leading-tight">
                    <textarea 
                        value={range} 
                        onChange={e=>updateField(rangeField as keyof LipidResults, e.target.value)} 
                        className="w-full bg-transparent border-none text-[9px] outline-none no-print leading-tight h-8 resize-none" 
                        rows={1}
                    />
                    <span className="hidden print:block">{range}</span>
                </td>
            </tr>
        );
    };

    return (
        <div className={`flex flex-col h-full ${isEmbedded ? 'bg-transparent' : 'bg-slate-100 overflow-hidden'} font-sans text-black`}>
            <div className={`flex-1 ${isEmbedded ? '' : 'overflow-y-auto p-4 flex justify-center custom-scrollbar bg-slate-200/50'}`}>
                <div className={`${isEmbedded ? 'w-full' : 'bg-white w-full max-w-[820px] shadow-2xl p-12'} flex flex-col font-serif relative`}>
                    <h1 className="text-xl text-center font-black underline uppercase tracking-[0.2em] mb-10 text-black">Report On Lipid Profile</h1>
                    <div className="flex-1 px-2">
                        <table className="w-full border-collapse border-2 border-black">
                            <thead className="bg-slate-100">
                                <tr className="border-b-2 border-black">
                                    <th className="p-2 border-r-2 border-black text-left text-[10px] font-black uppercase w-[40%]">Investigation Name</th>
                                    <th className="p-2 border-r-2 border-black text-center text-[10px] font-black uppercase w-[15%]">Result</th>
                                    <th className="p-2 border-r-2 border-black text-center text-[10px] font-black uppercase w-[10%]">Unit</th>
                                    <th className="p-2 text-left text-[10px] font-black uppercase w-[35%]">Biological Reference Range</th>
                                </tr>
                            </thead>
                            <tbody>
                                <TableRow label="Serum Cholesterol" field="s_cholesterol" rangeField="s_cholesterol_range" />
                                <TableRow label="Serum Triglycerides" field="triglycerides" rangeField="triglycerides_range" />
                                <TableRow label="HDL Cholesterol" field="hdl_cholesterol" rangeField="hdl_cholesterol_range" />
                                <TableRow label="LDL Cholesterol (Calc)" field="ldl_cholesterol" rangeField="ldl_cholesterol_range" />
                                <TableRow label="VLDL Cholesterol (Calc)" field="vldl_cholesterol" rangeField="vldl_cholesterol_range" />
                            </tbody>
                        </table>
                        <div className="mt-6 border-t-2 border-black pt-4">
                            <h4 className="text-[12px] font-black uppercase underline mb-2 italic">Note / Comment:</h4>
                            <textarea 
                                value={localResults.note || ''} 
                                onChange={e=>updateField('note', e.target.value)} 
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 font-black italic text-base outline-none resize-none no-print" 
                                placeholder="Enter findings or notes..." 
                                rows={2}
                            />
                            <p className="hidden print:block font-black italic text-base whitespace-pre-wrap leading-snug">{localResults.note || 'Fastings for 10-12 hours were maintained before sample collection.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LipidProfileInputPage;
