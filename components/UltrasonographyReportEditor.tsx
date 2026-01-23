
import React, { useState, useEffect, useMemo } from 'react';
import { SaveIcon, FileTextIcon, PlusIcon } from './Icons';
import { ReportTemplate, Patient, LabInvoice, ReportField, Doctor, Employee } from './DiagnosticData';

interface Props {
  template: ReportTemplate | null;
  patient: Patient | null;
  invoice: LabInvoice | null;
  onSave: (data: any) => void;
  reportData: any;
  setReportData: (data: any | ((prev: any) => any)) => void;
  doctors: Doctor[];
  employees: Employee[];
  technologistId?: string;
  consultantId?: string;
  setIsDirty?: (val: boolean) => void;
  isEmbedded?: boolean;
}

interface ReportingField extends ReportField {
  fieldId: string;
}

const UltrasonographyReportEditor: React.FC<Props> = ({ template, patient, invoice, onSave, reportData, setReportData, doctors, employees, technologistId, consultantId, setIsDirty, isEmbedded = false }) => {
    const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
    const [tagValues, setTagValues] = useState<Record<string, string>>({});

    const technologist = useMemo(() => employees.find(e => e.emp_id === technologistId), [employees, technologistId]);
    const consultant = useMemo(() => doctors.find(d => d.doctor_id === consultantId), [doctors, consultantId]);

    const formattedPatientName = useMemo(() => {
        if (!patient?.pt_name) return '...........................................';
        const parts = patient.pt_name.split(' ');
        return parts.map((p, i) => {
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

    useEffect(() => {
        if (reportData && reportData.fields) {
            const hasMissingIds = reportData.fields.some((f: any) => !f.fieldId);
            if (hasMissingIds) {
                setReportData((prev: any) => ({
                    ...prev,
                    fields: prev.fields.map((f: any) => ({
                        ...f,
                        fieldId: f.fieldId || `row-${Math.random().toString(36).substr(2, 9)}`
                    }))
                }));
            }
        }
    }, [reportData, setReportData]);

    if (!reportData) return <div className="flex flex-col items-center justify-center h-full text-slate-100 uppercase font-black tracking-widest italic opacity-20 font-bengali">লাইব্রেরি থেকে টেমপ্লেট নির্বাচন করুন</div>;

    const handleFieldUpdate = (fieldId: string, property: keyof ReportField, val: any) => {
        if (setIsDirty) setIsDirty(true);
        setReportData((prev: any) => {
            if (!prev) return prev;
            return { ...prev, fields: prev.fields.map((f: ReportingField) => f.fieldId === fieldId ? { ...f, [property]: val } : f) };
        });
    };

    const updateValueAndTags = (fieldId: string, placeholderIdx: number, value: string, fullText: string) => {
        if (setIsDirty) setIsDirty(true);
        setPlaceholderValues(prev => ({ ...prev, [`${fieldId}-${placeholderIdx}`]: value }));
        const tagMatch = fullText.match(/\[\[(.*?)\]\]/);
        if (tagMatch) {
            const tagName = tagMatch[1];
            setTagValues(prev => ({ ...prev, [tagName]: value }));
        }
    };

    const addLine = () => {
        if (setIsDirty) setIsDirty(true);
        setReportData((prev: any) => ({
            ...prev,
            fields: [...prev.fields, { label: 'New Label', value: '', type: 'input', isBold: false, fontSize: '14px', color: '#000000', fieldId: `row-${Date.now()}` }]
        }));
    };

    const handleFinalizeAndSave = () => {
        let finalImpression = reportData.impression;
        Object.entries(tagValues).forEach(([tag, val]) => {
            const regex = new RegExp(`\\[\\[${tag}\\]\\]`, 'g');
            finalImpression = finalImpression.replace(regex, val as string);
        });
        const finalFields = reportData.fields.map((f: ReportingField) => {
            let merged = f.value;
            Object.entries(tagValues).forEach(([tag, val]) => {
                const regex = new RegExp(`\\[\\[${tag}\\]\\]`, 'g');
                merged = merged.replace(regex, val as string);
            });
            const parts = merged.split('___');
            if (parts.length > 1) {
                merged = '';
                parts.forEach((part, pIdx) => {
                    merged += part;
                    if (pIdx < parts.length - 1) merged += placeholderValues[`${f.fieldId}-${pIdx}`] || '...';
                });
            }
            merged = merged.replace(/\[.*?\/.*?\]/g, (match: string) => {
                return placeholderValues[`${f.fieldId}-dropdown`] || match;
            });
            return { ...f, value: merged };
        });
        onSave({ ...reportData, fields: finalFields, impression: finalImpression });
    };

    const barcodeUrl = patient ? `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(patient.pt_id)}&scale=1&height=5&incltext=false` : '';

    const renderFieldContent = (f: ReportingField) => {
        const dropdownMatch = f.value.match(/\[(.*?\/.*?)\]/);
        if (dropdownMatch) {
            const options = dropdownMatch[1].split('/');
            return (
                <div className="flex items-center gap-2">
                    <span className="text-black" style={{ fontSize: f.fontSize }}>{f.value.split('[')[0]}</span>
                    <select value={placeholderValues[`${f.fieldId}-dropdown`] || ''} onChange={e => updateValueAndTags(f.fieldId, 0, e.target.value, f.value)} className="border-2 border-blue-400 bg-blue-50 px-2 font-black text-blue-950 rounded h-7 text-xs outline-none focus:ring-2 focus:ring-blue-500 no-print">
                        <option value="">Select...</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <span className="hidden print:inline-block font-black text-black" style={{ fontSize: f.fontSize }}>{placeholderValues[`${f.fieldId}-dropdown`] || '...'}</span>
                    <span className="text-black" style={{ fontSize: f.fontSize }}>{f.value.split(']')[1]}</span>
                </div>
            );
        }
        const parts = f.value.split(/___|\[\[.*?\]\]/);
        if (parts.length === 1) {
            return (
                <>
                    <textarea value={f.value || ''} onChange={e => handleFieldUpdate(f.fieldId, 'value', e.target.value)} style={{ fontSize: f.fontSize }} className={`w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 p-0 outline-none resize-none min-h-[25px] transition-all font-sans no-print text-black ${f.isBold ? 'font-black' : 'font-normal'}`} rows={1} onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                    <p className="hidden print:block whitespace-pre-wrap font-sans leading-snug text-black" style={{ fontSize: f.fontSize, fontWeight: f.isBold ? 900 : 400 }}>{f.value}</p>
                </>
            );
        }
        return (
            <div style={{ fontSize: f.fontSize }} className={`leading-tight py-0.5 flex flex-wrap items-center gap-1 font-sans text-black ${f.isBold ? 'font-black' : 'font-normal'}`}>
                {parts.map((part, pIdx) => (
                    <React.Fragment key={`${f.fieldId}-${pIdx}`}>
                        {part && <span className="whitespace-pre-wrap">{part}</span>}
                        {pIdx < parts.length - 1 && (
                            <>
                                <input type="text" value={placeholderValues[`${f.fieldId}-${pIdx}`] || ''} onChange={e => updateValueAndTags(f.fieldId, pIdx, e.target.value, f.value)} className="border-2 border-blue-400 bg-blue-50 px-2 font-black text-blue-950 w-28 text-center outline-none focus:ring-2 focus:ring-blue-500 transition-all h-7 rounded shadow-inner no-print" placeholder="..." />
                                <span className="hidden print:inline-block font-black text-black border-b border-black/20 min-w-[30px] text-center" style={{ fontSize: f.fontSize }}>{placeholderValues[`${f.fieldId}-${pIdx}`] || '...'}</span>
                            </>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const docObj = doctors.find(d => d.doctor_id === invoice?.doctor_id);
    const doctorFullInfo = (invoice?.doctor_name || 'Self') + (docObj?.degree ? ', ' + docObj.degree : '');

    return (
        <div className={`flex flex-col h-full ${isEmbedded ? 'bg-transparent' : 'bg-slate-100 overflow-hidden'} font-sans text-black`}>
            {!isEmbedded && (
                <div className="p-3 bg-white border-b flex justify-between items-center shrink-0 no-print shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-600 text-white rounded-lg"><FileTextIcon size={16}/></div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tighter">USG Report Editor</h3>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addLine} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-md flex items-center gap-1 active:scale-95"><PlusIcon size={10}/> New Line</button>
                        <button onClick={handleFinalizeAndSave} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-md flex items-center gap-1 active:scale-95"><SaveIcon size={12}/> Save Report</button>
                    </div>
                </div>
            )}

            <div className={`flex-1 ${isEmbedded ? '' : 'overflow-y-auto p-2 flex justify-center custom-scrollbar bg-slate-200'}`}>
                <div className={`${isEmbedded ? 'w-full' : 'bg-white w-full max-w-[820px] min-h-[1160px] shadow-2xl p-10'} flex flex-col font-serif relative`}>
                    
                    {/* Header Table - Only if NOT embedded */}
                    {!isEmbedded && (
                        <div className="mb-8 shrink-0">
                            <table className="w-full border-collapse border border-black text-[12px]">
                                <tbody>
                                    <tr className="h-8">
                                        <td className="border border-black px-3 py-1 bg-slate-50 w-24 text-left font-bold uppercase text-[9px]">Date:</td>
                                        <td className="border border-black px-3 py-1 font-bold w-[45%]">{longDate}</td>
                                        <td className="border border-black px-3 py-1 bg-slate-50 w-28 text-left font-bold uppercase text-[9px]">Reg. No:</td>
                                        <td className="border border-black px-3 py-1 font-black text-blue-800 text-sm">{formattedRegNo}</td>
                                        <td rowSpan={2} className="border border-black p-1 w-28 text-center bg-white">
                                            <img src={barcodeUrl} alt="BC" className="h-6 mx-auto" />
                                            <span className="text-[7px] font-black uppercase leading-none block mt-1 tracking-tighter">Patient ID Barcode</span>
                                        </td>
                                    </tr>
                                    <tr className="h-10">
                                        <td className="border border-black px-3 py-1 bg-slate-50 text-left font-bold uppercase text-[9px]">Patient Name:</td>
                                        <td className="border border-black px-3 py-1 text-base font-bold leading-none uppercase">{formattedPatientName}</td>
                                        <td className="border border-black px-3 py-1 bg-slate-50 text-left font-bold uppercase text-[9px]">Age/Sex:</td>
                                        <td className="border border-black px-3 py-1 font-black">{patient?.ageY || '0'} Y / {patient?.gender || 'N/A'}</td>
                                    </tr>
                                    <tr className="h-9">
                                        <td className="border border-black px-3 py-1 bg-slate-50 text-left font-bold uppercase text-[9px]">Refd. By:</td>
                                        <td colSpan={2} className="border border-black px-3 py-1 font-bold text-[12px]">{doctorFullInfo}</td>
                                        <td className="border border-black px-3 py-1 bg-slate-50 text-left font-bold uppercase text-[9px]">Address:</td>
                                        <td className="border border-black px-3 py-1 font-black uppercase text-[10px]">{patient?.address || '...'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    <h1 className="text-lg text-center font-black underline uppercase tracking-widest mb-8 text-black">{reportData.title}</h1>
                    
                    <div className="flex-1 space-y-1 px-4">
                        <div className="grid grid-cols-[180px_20px_1fr] gap-y-1 items-start">
                            {reportData.fields.map((f: ReportingField) => (
                                <React.Fragment key={f.fieldId}>
                                    <div className="relative group/label">
                                        <button onClick={() => setReportData((prev: any) => ({ ...prev, fields: prev.fields.filter((x: any) => x.fieldId !== f.fieldId) }))} className="no-print absolute -left-6 top-1 opacity-0 group-hover/label:opacity-100 text-rose-300 hover:text-rose-600 transition-all font-black text-sm">×</button>
                                        <div className="text-[14px] font-bold text-slate-800 pt-1 text-left pl-2 font-sans capitalize no-print">
                                            <input value={f.label || ''} onChange={e => handleFieldUpdate(f.fieldId, 'label', e.target.value)} className="bg-transparent border-none text-left font-bold w-full outline-none focus:text-blue-600" />
                                        </div>
                                        <div className="hidden print:block text-[14px] font-bold text-black pt-1 text-left pl-2 font-sans capitalize">{f.label || '...'}</div>
                                    </div>
                                    
                                    <div className="flex justify-center text-black font-black text-[14px] pt-1">:</div>
                                    
                                    <div className="min-h-[25px] pl-1">{renderFieldContent(f)}</div>
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="mt-12 pt-6 border-t-2 border-black">
                            <h4 className="text-[12px] font-black uppercase underline mb-2 tracking-tighter">Impression / Conclusion:</h4>
                            <textarea value={reportData.impression || ''} onChange={e=>{ if(setIsDirty) setIsDirty(true); setReportData((prev:any)=>({...prev, impression: e.target.value}))}} className="w-full bg-transparent p-0 font-black text-[16px] leading-snug outline-none resize-none h-24 italic text-black no-print" onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} placeholder="Write conclusion here..." />
                            <p className="hidden print:block font-black text-[16px] italic text-black whitespace-pre-wrap leading-tight">{reportData.impression || 'Normal Study.'}</p>
                        </div>
                    </div>
                    
                    {/* Signature Area Only if NOT embedded */}
                    {!isEmbedded && (
                        <div className="mt-20 pt-8 flex justify-between px-6 shrink-0 font-sans">
                            <div className="text-center w-64 flex flex-col items-center">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1 leading-none font-bengali">ল্যাব টেকনোলজিস্ট</p>
                                <div className="h-10 w-full"></div>
                                <div className="text-[12px] font-black uppercase text-black leading-tight border-t border-black pt-1 w-full">{technologist?.emp_name || '...........................................'}</div>
                            </div>
                            <div className="text-center w-64 flex flex-col items-center">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1 leading-none font-bengali">প্যাথলজিস্ট / রিপোর্টিং ডাক্তার</p>
                                <div className="h-10 w-full"></div>
                                <div className="text-[12px] font-black uppercase text-black leading-tight border-t border-black pt-1 w-full">{consultant?.doctor_name || '...........................................'}</div>
                                <div className="text-[9px] font-bold text-slate-700 whitespace-pre-wrap">{consultant?.degree}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UltrasonographyReportEditor;
