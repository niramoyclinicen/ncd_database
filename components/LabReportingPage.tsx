import React, { useState, useMemo, useEffect } from 'react';
import { LabInvoice as Invoice, Patient, Employee, Doctor, Test, ReportTemplate, LabReport, defaultPregnancyTemplates } from './DiagnosticData'; 
import UltrasonographyReportEditor from './UltrasonographyReportEditor';
import UrineRMEInputPage from './UrineRMEInputPage';
import CBCInputPage from './CBCInputPage';
import SemenAnalysisInputPage from './SemenAnalysisInputPage';
import LipidProfileInputPage from './LipidProfileInputPage';
import TemplateManagementPage from './TemplateManagementPage';
import { FileTextIcon, SettingsIcon, Activity, SaveIcon, PrinterIcon } from './Icons';

// Use fixed license constant
const DIAGNOSTIC_LICENSE = 'HSM41671';

const isOutOfRange = (valStr: string, rangeStr: string): boolean => {
    if (!valStr || !rangeStr) return false;
    const val = parseFloat(valStr);
    if (isNaN(val)) {
        if (rangeStr.toLowerCase().includes('non-reactive') && valStr.toLowerCase().includes('reactive')) return true;
        if (rangeStr.toLowerCase().includes('nil') && !['nil', 'negative', 'normal'].includes(valStr.toLowerCase())) return true;
        return false;
    }
    const dashMatch = rangeStr.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (dashMatch) {
        const min = parseFloat(dashMatch[1]); const max = parseFloat(dashMatch[2]);
        return val < min || val > max;
    }
    return false;
};

const LabReportingPage: React.FC<any> = ({ invoices, setInvoices, reports, setReports, patients, employees, tests, doctors }) => {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [activeTestName, setActiveTestName] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [viewMode, setViewMode] = useState<'reporting' | 'template_mgmt'>('reporting');
    const [selectedTechnologistId, setSelectedTechnologistId] = useState<string>('');
    const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
    const [currentReportData, setCurrentReportData] = useState<any>(null);
    
    // Manual Signature Overrides
    const [customTechName, setCustomTechName] = useState('');
    const [customTechDegree, setCustomTechDegree] = useState('');
    const [customDocName, setCustomDocName] = useState('');
    const [customDocDegree, setCustomDocDegree] = useState('');

    const [printFullPad, setPrintFullPad] = useState<boolean>(true); 

    const currentInvoice = useMemo(() => invoices.find((inv: Invoice) => inv.invoice_id === selectedInvoiceId), [selectedInvoiceId, invoices]);
    const patient = useMemo(() => patients.find((p: Patient) => p.pt_id === currentInvoice?.patient_id), [currentInvoice, patients]);

    // Update manual signature states when dropdowns change
    useEffect(() => {
        const tech = employees.find((e: any) => e.emp_id === selectedTechnologistId);
        if (tech) {
            setCustomTechName(tech.emp_name);
            setCustomTechDegree(tech.degree || 'Medical Technologist');
        }
    }, [selectedTechnologistId, employees]);

    useEffect(() => {
        const doc = doctors.find((d: any) => d.doctor_id === selectedConsultantId);
        if (doc) {
            setCustomDocName(doc.doctor_name);
            setCustomDocDegree(doc.degree);
        }
    }, [selectedConsultantId, doctors]);

    const activeTestGroup = useMemo(() => {
        if (!currentInvoice || !activeTestName) return [];
        const clickedTest = tests.find((t: Test) => t.test_name === activeTestName);
        if (!clickedTest) return [activeTestName];
        if (['Ultrasonography (USG)', 'X-Ray', 'ECG'].includes(clickedTest.category)) return [activeTestName];
        return currentInvoice.items.filter((item: any) => {
            const testDef = tests.find((t: any) => t.test_name === item.test_name);
            return testDef && ['Hematology', 'Biochemistry', 'Serology', 'Immunology', 'Hormone', 'Clinical Pathology', 'Others'].includes(testDef.category);
        }).map((item: any) => item.test_name);
    }, [currentInvoice, activeTestName, tests]);

    useEffect(() => {
        if (!selectedInvoiceId || !activeTestName) return;
        const saved = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === activeTestName);
        if (saved) {
            setCurrentReportData(saved.data);
            setSelectedTechnologistId(saved.technologistId || '');
            setSelectedConsultantId(saved.consultantId || '');
            // Try to load custom values if they were saved (optional improvement, using current logic for now)
        } else {
            setCurrentReportData(null);
        }
    }, [selectedInvoiceId, activeTestName, reports]);

    const handleSaveReport = (reportData: any, isAutoSave: boolean = false) => {
        if (!selectedInvoiceId || !activeTestName) return;
        const testsToSave = activeTestGroup.length > 1 ? activeTestGroup : [activeTestName];
        
        let updatedReports: LabReport[] = [];
        setReports((prev: LabReport[]) => {
            let newList = [...prev];
            testsToSave.forEach((tName: string) => {
                const existing = prev.find(r => r.invoice_id === selectedInvoiceId && r.test_name === tName);
                const newReport: LabReport = {
                    report_id: existing?.report_id || `REP-${selectedInvoiceId}-${tName.replace(/\s+/g, '')}`,
                    invoice_id: selectedInvoiceId, test_name: tName, patient_id: patient?.pt_id || '',
                    report_date: new Date().toISOString().split('T')[0], status: 'Completed', data: reportData,
                    technologistId: selectedTechnologistId, consultantId: selectedConsultantId,
                    isDelivered: existing?.isDelivered || false
                };
                newList = newList.filter(r => !(r.invoice_id === selectedInvoiceId && r.test_name === tName));
                newList.push(newReport);
            });
            updatedReports = newList;
            return newList;
        });

        if (currentInvoice) {
            const completedTestsForInvoice = updatedReports.filter(r => r.invoice_id === selectedInvoiceId).map(r => r.test_name);
            const allTestsDone = currentInvoice.items.every((item: any) => completedTestsForInvoice.includes(item.test_name));
            if (allTestsDone && currentInvoice.status !== 'Cancelled') {
                setInvoices((prev: Invoice[]) => prev.map(inv => inv.invoice_id === selectedInvoiceId ? { ...inv, status: 'Report Ready' } : inv));
            }
        }
        if (!isAutoSave) setSuccessMessage(`রিপোর্ট সফলভাবে সেভ হয়েছে!`);
    };

    const handlePrintReport = () => {
        const content = document.getElementById('printable-report-content');
        if (!content) return;

        const win = window.open('', '_blank');
        if (!win) return;

        win.document.write(`
            <html>
                <head>
                    <title>Report_${patient?.pt_name}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4; margin: 0; }
                        body { background: white; margin: 0; padding: 0; font-family: 'Times New Roman', serif; }
                        .a4-container { width: 210mm; min-height: 297mm; margin: 0 auto; position: relative; display: flex; flex-direction: column; box-sizing: border-box; }
                        .report-content { 
                            padding: 10mm 15mm; 
                            ${printFullPad ? 'margin-top: 0;' : 'margin-top: 2.1in;'} 
                            flex: 1; 
                        }
                        .no-print { display: none !important; }
                        .font-bengali { font-family: 'Arial', sans-serif !important; }
                    </style>
                </head>
                <body>
                    <div class="a4-container">
                        ${printFullPad ? `
                            <div class="header p-10 border-b-4 border-slate-900 flex justify-between items-start shrink-0">
                                <div class="flex gap-5">
                                    <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-slate-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                    </div>
                                    <div>
                                        <h1 class="text-3xl font-black text-blue-900 leading-tight uppercase tracking-tighter">Niramoy Clinic & Diagnostic</h1>
                                        <p class="text-[12px] font-bold text-slate-700">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                                        <p class="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-sans font-bold">Govt. Reg No: ${DIAGNOSTIC_LICENSE} | Open 24/7</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <h2 class="text-xl font-black text-white bg-slate-900 px-5 py-2 rounded-xl inline-block uppercase tracking-tighter shadow-md">Lab Report</h2>
                                </div>
                            </div>
                        ` : ''}

                        <div class="report-content">
                            ${content.innerHTML}
                        </div>

                        <div class="footer p-12 mt-auto flex justify-between items-end shrink-0">
                            <div class="text-center w-64">
                                <p class="text-[11px] font-black uppercase text-slate-500 mb-1">Lab Technologist</p>
                                <div class="h-10 w-full"></div>
                                <p class="text-[14px] font-black text-slate-950 uppercase border-t-2 border-black pt-1">${customTechName || '...........................................'}</p>
                                <p class="text-[9px] font-bold uppercase text-slate-500 tracking-widest">${customTechDegree || ''}</p>
                            </div>
                            <div class="text-center w-72">
                                <p class="text-[11px] font-black uppercase text-slate-500 mb-1">Reported By</p>
                                <div class="h-10 w-full"></div>
                                <p class="text-[14px] font-black text-slate-950 uppercase border-t-2 border-black pt-1">${customDocName || '...........................................'}</p>
                                <p class="text-[10px] font-bold text-slate-600 italic whitespace-pre-wrap leading-tight">${customDocDegree || ''}</p>
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = () => {
                            setTimeout(() => { window.print(); window.close(); }, 750);
                        };
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    };

    const ReportHeader = () => {
        const regNo = currentInvoice?.invoice_id?.split('-').pop() + '/' + (currentInvoice?.invoice_date.substring(2,4) || '25');
        return (
            <div className="mb-6 shrink-0 text-black">
                <table className="w-full border-collapse border-2 border-black text-[12px]">
                    <tbody>
                        <tr className="h-9">
                            <td className="border-2 border-black px-3 py-1 bg-slate-50 w-24 font-bold uppercase text-[9px]">Date:</td>
                            <td className="border-2 border-black px-3 py-1 font-bold w-[45%]">{currentInvoice?.invoice_date}</td>
                            <td className="border-2 border-black px-3 py-1 bg-slate-50 w-28 font-bold uppercase text-[9px]">Reg. No:</td>
                            <td className="border-2 border-black px-3 py-1 font-black text-blue-900 text-sm">{regNo}</td>
                            <td rowSpan={2} className="border-2 border-black p-1 w-32 text-center bg-white">
                                <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(patient?.pt_id || '')}&scale=1&height=5`} alt="BC" className="h-6 mx-auto" />
                            </td>
                        </tr>
                        <tr className="h-10">
                            <td className="border-2 border-black px-3 py-1 bg-slate-50 font-bold uppercase text-[9px]">Patient:</td>
                            <td className="border-2 border-black px-3 py-1 text-base font-black uppercase tracking-tight">{patient?.pt_name}</td>
                            <td className="border-2 border-black px-3 py-1 bg-slate-50 font-bold uppercase text-[9px]">Age/Sex:</td>
                            <td className="border-2 border-black px-3 py-1 font-black text-sm">{patient?.ageY || '0'} Y / {patient?.gender || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    if (viewMode === 'template_mgmt') return <TemplateManagementPage onBack={() => setViewMode('reporting')} />;

    return (
        <div className="bg-slate-200 h-screen flex flex-col font-sans overflow-hidden">
            {successMessage && <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border-2 border-emerald-500 text-white px-12 py-8 rounded-[3rem] shadow-2xl z-[500] animate-bounce flex flex-col items-center gap-4"><div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-black">✓</div><div className="text-xl font-black uppercase tracking-widest">{successMessage}</div></div>}
            
            <div className="grid grid-cols-12 flex-1 overflow-hidden">
                <div className="col-span-3 bg-white border-r flex flex-col shadow-sm no-print">
                    <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest">Lab Reporting Queue</h3>
                        <button onClick={() => setViewMode('template_mgmt')} className="p-2 bg-slate-800 rounded-xl hover:bg-blue-600 transition-all shadow-md"><SettingsIcon size={16}/></button>
                    </div>
                    <div className="p-3 bg-slate-50 border-b">
                        <input placeholder="Search ID/Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border rounded-2xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-sm" />
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3 custom-scrollbar">
                        {invoices.filter((i: any) => i.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || i.invoice_id.includes(searchTerm)).map((r: any) => {
                            const completedCount = reports.filter((rep: any) => rep.invoice_id === r.invoice_id).length;
                            const isAllDone = completedCount >= r.items.length;
                            const isActive = selectedInvoiceId === r.invoice_id;
                            return (
                                <div key={r.invoice_id} onClick={() => { setSelectedInvoiceId(r.invoice_id); setActiveTestName(null); }} className={`p-4 border-2 rounded-[2rem] cursor-pointer transition-all ${isActive ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105' : 'bg-white hover:border-blue-200'}`}>
                                    <div className={`font-black text-sm uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{r.patient_name}</div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`text-[10px] font-mono ${isActive ? 'text-white/70' : 'text-slate-500'}`}>{r.invoice_id}</span>
                                        <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase ${isAllDone ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>{isAllDone ? 'Ready' : 'Pending'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="col-span-2 bg-slate-100 border-r flex flex-col shadow-inner no-print">
                    <div className="p-5 border-b bg-white text-[11px] font-black text-slate-800 uppercase tracking-widest">Investigations</div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {currentInvoice?.items.map((it: any) => {
                            const isTestDone = reports.some((rep: any) => rep.invoice_id === selectedInvoiceId && rep.test_name === it.test_name);
                            return (
                                <button key={it.test_id} onClick={() => setActiveTestName(it.test_name)} className={`w-full text-left p-4 rounded-2xl text-[11px] font-black transition-all border flex justify-between items-center ${activeTestName === it.test_name ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : isTestDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                                    <span className="truncate pr-1 uppercase">{it.test_name}</span>
                                    {isTestDone && <span>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-slate-700 space-y-3">
                         <select value={selectedTechnologistId} onChange={e=>setSelectedTechnologistId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] text-white font-bold outline-none"><option value="">-- Tech --</option>{employees.filter((e:any)=>e.department==='Diagnostic').map((e: any) => <option key={e.emp_id} value={e.emp_id}>{e.emp_name}</option>)}</select>
                         <select value={selectedConsultantId} onChange={e=>setSelectedConsultantId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] text-white font-bold outline-none"><option value="">-- Doctor --</option>{doctors.map((d: any) => <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name}</option>)}</select>
                    </div>
                </div>

                <div className="col-span-7 bg-white flex flex-col shadow-2xl relative overflow-hidden">
                    {activeTestName ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b no-print flex justify-between items-center">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-xl font-black text-xs uppercase shadow-inner">{activeTestName}</div>
                                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
                                            <input type="checkbox" checked={printFullPad} onChange={e => setPrintFullPad(e.target.checked)} className="w-4 h-4 text-blue-600" />
                                            <span className="text-[10px] font-black uppercase text-slate-500">Professional A4 Design</span>
                                        </label>
                                    </div>
                                    {!printFullPad && (
                                        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] px-3 py-1 rounded-lg font-bold">
                                            ⚠️ ২.১ ইঞ্চি টপ মার্জিন অটো-সেট করা হয়েছে।
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleSaveReport(currentReportData)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-2xl font-black uppercase text-xs shadow-xl transition-all"><SaveIcon size={14} className="inline mr-1"/> Save Result</button>
                                    <button onClick={handlePrintReport} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-black uppercase text-xs shadow-xl transition-all"><PrinterIcon size={14} className="inline mr-1"/> Print Report</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-200 custom-scrollbar py-10">
                                <div className="w-full max-w-[850px] mx-auto bg-white shadow-2xl min-h-[900px] flex flex-col p-12 rounded-[2.5rem] text-black" id="printable-report-content">
                                    <ReportHeader />
                                    <div className="flex-1">
                                        {(activeTestName.toLowerCase().includes('lipid')) ? (
                                            <LipidProfileInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} checkRange={isOutOfRange} />
                                        ) : (activeTestName.toLowerCase().includes('urine')) ? (
                                            <UrineRMEInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} checkRange={isOutOfRange} />
                                        ) : (activeTestName.toLowerCase().includes('cbc')) ? (
                                            <CBCInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} checkRange={isOutOfRange} />
                                        ) : (activeTestName.toLowerCase().includes('semen')) ? (
                                            <SemenAnalysisInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} checkRange={isOutOfRange} />
                                        ) : (activeTestName.toLowerCase().includes('usg') || activeTestName.toLowerCase().includes('ultra')) ? (
                                            <UltrasonographyReportEditor template={null} patient={patient} invoice={currentInvoice} onSave={handleSaveReport} reportData={currentReportData} setReportData={setCurrentReportData} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} />
                                        ) : (
                                            <div className="space-y-6">
                                                <h1 className="text-center font-black uppercase underline text-xl mb-8">Investigation Report</h1>
                                                <table className="w-full border-collapse border-2 border-black">
                                                    <thead className="bg-slate-100"><tr><th className="border-2 border-black p-2 text-left text-[11px] uppercase font-black w-[45%]">Investigation</th><th className="border-2 border-black p-2 text-center text-[11px] uppercase font-black w-[20%]">Result</th><th className="border-2 border-black p-2 text-center text-[11px] uppercase font-black w-[15%]">Unit</th><th className="border-2 border-black p-2 text-left text-[11px] uppercase font-black w-[20%]">Normal Range</th></tr></thead>
                                                    <tbody>
                                                        {activeTestGroup.map((tName: string) => {
                                                            const testDef = tests.find((t: any) => t.test_name === tName);
                                                            const val = currentReportData?.[tName] || '';
                                                            const isAlert = isOutOfRange(val, testDef?.normal_range || '');
                                                            return (
                                                                <tr key={tName} className="h-9">
                                                                    <td className="border-2 border-black px-3 py-1 font-black uppercase text-[11px]">{tName}</td>
                                                                    <td className="border-2 border-black p-0 text-center"><input className={`w-full h-full p-1 border-none font-black text-center text-sm outline-none no-print ${isAlert ? 'bg-red-50 text-red-600' : 'bg-blue-50'}`} onChange={(e) => setCurrentReportData({ ...currentReportData, [tName]: e.target.value })} value={val} /><span className={`hidden print:block font-black text-sm ${isAlert ? 'text-red-600' : ''}`}>{val || '---'}</span></td>
                                                                    <td className="border-2 border-black text-center text-[10px]">{testDef?.unit || '-'}</td>
                                                                    <td className="border-2 border-black px-3 text-[9px] italic font-bold">{testDef?.normal_range || '-'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Manual Signature Section for Real-time Editing */}
                                    <div className="mt-20 flex justify-between px-10 text-black no-print border-t-2 border-slate-100 pt-10">
                                        <div className="text-center w-64 space-y-2">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 leading-none">Lab Technologist Override</p>
                                            <input value={customTechName} onChange={e=>setCustomTechName(e.target.value)} placeholder="Name" className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-black uppercase text-center"/>
                                            <input value={customTechDegree} onChange={e=>setCustomTechDegree(e.target.value)} placeholder="Degree" className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[9px] font-bold text-center"/>
                                        </div>
                                        <div className="text-center w-72 space-y-2">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 leading-none">Reporting Doctor Override</p>
                                            <input value={customDocName} onChange={e=>setCustomDocName(e.target.value)} placeholder="Name" className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-black uppercase text-center"/>
                                            <textarea value={customDocDegree} onChange={e=>setCustomDocDegree(e.target.value)} placeholder="Degree" className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[9px] font-bold text-center h-12 resize-none"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4 bg-slate-50/50 p-20 text-center">
                            <div className="p-16 bg-white rounded-full border-4 border-dashed border-slate-100 shadow-xl opacity-20"><Activity size={100} /></div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-400">রিপোর্ট তৈরি করতে পেশেন্ট ও টেস্ট সিলেক্ট করুন</h2>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabReportingPage;