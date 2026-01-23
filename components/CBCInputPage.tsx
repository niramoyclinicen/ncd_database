
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SaveIcon, FileTextIcon } from './Icons';
import { Patient, LabInvoice, Doctor, Employee } from './DiagnosticData';

export interface CBCResults {
  hemoglobin: string; esr: string; wbc: string; neutrophils: string; lymphocytes: string; monocytes: string; eosinophils: string; basophils: string; platelets: string;
}

export const emptyCBCResults: CBCResults = {
  hemoglobin: '', esr: '', wbc: '', neutrophils: '', lymphocytes: '', monocytes: '', eosinophils: '', basophils: '', platelets: ''
};

const CBCInputPage: React.FC<any> = ({ results: initialResults, onSaveOverride, disabled, patient, invoice, doctors, employees, technologistId, consultantId, isEmbedded, checkRange }) => {
    const [localResults, setLocalResults] = useState<CBCResults>(initialResults || emptyCBCResults);
    const technologist = useMemo(() => employees.find((e: any) => e.emp_id === technologistId), [employees, technologistId]);
    const consultant = useMemo(() => doctors.find((d: any) => d.doctor_id === consultantId), [doctors, consultantId]);
    const typingTimeoutRef = useRef<any | null>(null);

    useEffect(() => { 
        if (!typingTimeoutRef.current && initialResults) {
            setLocalResults(initialResults); 
        }
    }, [initialResults]);
    
    const updateField = (f: keyof CBCResults, v: string) => {
        const updated = { ...localResults, [f]: v };
        setLocalResults(updated);
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (onSaveOverride && isEmbedded) {
                // Pass true to indicate this is an auto-save and shouldn't show a toast
                onSaveOverride(updated, true);
            }
            typingTimeoutRef.current = null;
        }, 1000);
    };

    const formattedPatientName = useMemo(() => {
      if (!patient?.pt_name) return '...........................................';
      const parts = patient.pt_name.split(' ');
      return parts.map((p: string, i: number) => {
          const formatted = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
          if (parts.length > 1 && i === 1) return <b key={i} className="font-black">{formatted} </b>;
          if (parts.length === 1) return <b key={i} className="font-black">{formatted} </b>;
          return <span key={i}>{formatted} </span>;
      });
    }, [patient?.pt_name]);

    const longDate = useMemo(() => {
      const d = invoice?.invoice_date ? new Date(invoice.invoice_date) : new Date();
      return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }, [invoice?.invoice_date]);

    const formattedRegNo = useMemo(() => {
      const serial = invoice?.invoice_id?.split('-').pop() || '000';
      const year = invoice?.invoice_date ? invoice.invoice_date.substring(2, 4) : new Date().getFullYear().toString().substring(2, 4);
      return `${serial}/${year}`;
    }, [invoice?.invoice_id, invoice?.invoice_date]);

    const docObj = doctors.find((d: any) => d.doctor_id === invoice?.doctor_id);
    const doctorFullInfo = (invoice?.doctor_name || 'Self') + (docObj?.degree ? ', ' + docObj.degree : '');

    const labelClass = "p-2 border-2 border-black font-black uppercase text-[11px] w-[45%]";
    const valueCellClass = "p-0.5 border-2 border-black w-[25%] text-center";
    const unitCellClass = "p-2 border-2 border-black text-center font-black text-[10px] uppercase w-[10%]";
    const rangeCellClass = "p-2 border-2 border-black text-[10px] text-slate-700 font-bold italic w-[20%]";

    const TableRow = ({ label, field, unit, range }: any) => {
        const val = localResults[field as keyof CBCResults] || '';
        const isAlert = checkRange && checkRange(val, range);
        return (
            <tr className="h-9">
                <td className={labelClass}>{label}</td>
                <td className={valueCellClass}>
                    <input 
                        value={val} 
                        onChange={e => updateField(field as keyof CBCResults, e.target.value)} 
                        onFocus={e => e.currentTarget.select()} 
                        disabled={disabled} 
                        className={`w-full border-none p-1.5 rounded-md text-center font-black no-print text-sm outline-none placeholder:text-slate-300 ${isAlert ? 'bg-red-50 text-red-600' : 'bg-blue-50/50 text-slate-900'}`} 
                        placeholder="..."
                    />
                    <span className={`hidden print:block font-black text-sm ${isAlert ? 'text-red-600' : ''}`}>{val || '---'}</span>
                </td>
                <td className={unitCellClass}>{unit}</td>
                <td className={rangeCellClass}>{range}</td>
            </tr>
        );
    };

    return (
        <div className={`flex flex-col h-full ${isEmbedded ? 'bg-transparent' : 'bg-slate-100 overflow-hidden'} font-sans text-black`}>
            {!isEmbedded && (
                <div className="p-3 bg-white border-b flex justify-between items-center shrink-0 no-print shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"><FileTextIcon size={16}/></div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tighter">CBC Result Entry</h3>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onSaveOverride(localResults)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all"><SaveIcon size={12}/> Save Result</button>
                    </div>
                </div>
            )}

            <div className={`flex-1 ${isEmbedded ? '' : 'overflow-y-auto p-4 flex justify-center custom-scrollbar bg-slate-200/50'}`}>
                <div className={`${isEmbedded ? 'w-full' : 'bg-white w-full max-w-[820px] shadow-2xl p-12'} flex flex-col font-serif relative`}>
                    
                    {!isEmbedded && (
                        <div className="mb-6 shrink-0">
                            <table className="w-full border-collapse border-2 border-black text-[12px]">
                                <tbody>
                                    <tr className="h-8">
                                        <td className="border-2 border-black px-2 py-1 bg-slate-100 w-24 font-bold uppercase text-[9px]">Date:</td>
                                        <td className="border-2 border-black px-2 py-1 font-bold w-[45%]">{longDate}</td>
                                        <td className="border-2 border-black px-2 py-1 bg-slate-100 w-28 font-bold uppercase text-[9px]">Reg. No:</td>
                                        <td className="border-2 border-black px-2 py-1 font-black text-blue-800 text-sm">{formattedRegNo}</td>
                                    </tr>
                                    <tr className="h-9">
                                        <td className="border-2 border-black px-2 py-1 bg-slate-100 font-bold uppercase text-[9px]">Patient:</td>
                                        <td className="border-2 border-black px-2 py-1 text-base font-black uppercase">{formattedPatientName}</td>
                                        <td className="border-2 border-black px-2 py-1 bg-slate-100 font-bold uppercase text-[9px]">Age/Sex:</td>
                                        <td className="border-2 border-black px-2 py-1 font-black">{patient?.ageY || '0'} Y / {patient?.gender || 'N/A'}</td>
                                    </tr>
                                    <tr className="h-8">
                                        <td className="border-2 border-black px-2 py-1 bg-slate-100 font-bold uppercase text-[9px]">Refd. By:</td>
                                        <td colSpan={3} className="border-2 border-black px-2 py-1 font-bold text-[11px]">{doctorFullInfo}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <h1 className="text-xl text-center font-black underline uppercase tracking-[0.2em] mb-8 text-black">Complete Blood Count (CBC)</h1>
                    
                    <div className="flex-1">
                        <table className="w-full border-collapse border-2 border-black">
                            <thead className="bg-slate-100">
                                <tr className="border-b-2 border-black">
                                    <th className="p-2 border-2 border-black text-left text-[10px] font-black uppercase">Investigation Name</th>
                                    <th className="p-2 border-2 border-black text-center text-[10px] font-black uppercase">Result</th>
                                    <th className="p-2 border-2 border-black text-center text-[10px] font-black uppercase">Unit</th>
                                    <th className="p-2 border-2 border-black text-left text-[10px] font-black uppercase">Normal Range</th>
                                </tr>
                            </thead>
                            <tbody>
                                <TableRow label="Hemoglobin (Hb)" field="hemoglobin" unit="g/dL" range="12.0 - 16.0" />
                                <TableRow label="ESR (Westergren)" field="esr" unit="mm/hr" range="00 - 20" />
                                <TableRow label="Total WBC Count" field="wbc" unit="/cmm" range="4,000 - 11,000" />
                                <tr className="bg-slate-50 h-7"><td colSpan={4} className="p-1.5 border-2 border-black font-black text-[9px] uppercase text-slate-500 tracking-widest pl-4 italic">Differential WBC Count</td></tr>
                                <TableRow label="Neutrophils" field="neutrophils" unit="%" range="40 - 75" />
                                <TableRow label="Lymphocytes" field="lymphocytes" unit="%" range="20 - 45" />
                                <TableRow label="Monocytes" field="monocytes" unit="%" range="02 - 10" />
                                <TableRow label="Eosinophils" field="eosinophils" unit="%" range="01 - 06" />
                                <TableRow label="Basophils" field="basophils" unit="%" range="00 - 01" />
                                <tr className="bg-slate-50 h-7"><td colSpan={4} className="p-1.5 border-2 border-black font-black text-[9px] uppercase text-slate-500 tracking-widest pl-4 italic">Platelet Status</td></tr>
                                <TableRow label="Platelet Count" field="platelets" unit="/cmm" range="150,000 - 450,000" />
                            </tbody>
                        </table>

                        <div className="mt-8 border-t-2 border-black pt-4">
                            <h4 className="text-[12px] font-black uppercase underline mb-2 italic">Impression / Note:</h4>
                            <p className="text-[14px] font-black italic whitespace-pre-wrap leading-tight text-black">Peripheral blood film reveals normal cellular morphology. No abnormal cells seen.</p>
                        </div>
                    </div>

                    {!isEmbedded && (
                        <div className="mt-auto pt-8 flex justify-between px-6 shrink-0 font-sans border-t-2 border-black">
                            <div className="text-center w-64 flex flex-col items-center">
                                <p className="text-[9px] font-black uppercase text-slate-500 mb-1 leading-none">Technologist</p>
                                <div className="h-8 w-full"></div>
                                <div className="text-[12px] font-black uppercase text-black leading-tight border-t border-black pt-1 w-full">{technologist?.emp_name || '...........................................'}</div>
                            </div>
                            <div className="text-center w-64 flex flex-col items-center">
                                <p className="text-[9px] font-black uppercase text-slate-500 mb-1 leading-none">Reporting Doctor</p>
                                <div className="h-8 w-full"></div>
                                <div className="text-[12px] font-black uppercase text-black leading-tight border-t border-black pt-1 w-full">{consultant?.doctor_name || '...........................................'}</div>
                                <div className="text-[9px] font-bold text-slate-700 whitespace-pre-wrap mt-1">{consultant?.degree || 'Specialist Pathologist'}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CBCInputPage;
