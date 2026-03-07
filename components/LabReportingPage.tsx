
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LabInvoice as Invoice, Patient, Employee, Doctor, Test, LabReport } from './DiagnosticData'; 
import UltrasonographyReportEditor from './UltrasonographyReportEditor';
import UrineRMEInputPage from './UrineRMEInputPage';
import CBCInputPage from './CBCInputPage';
import SemenAnalysisInputPage from './SemenAnalysisInputPage';
import LipidProfileInputPage from './LipidProfileInputPage';
import TemplateManagementPage from './TemplateManagementPage';
import { SettingsIcon, Activity, SaveIcon, PrinterIcon } from './Icons';

// Use fixed license constant
const DIAGNOSTIC_LICENSE = 'HSM41671';

// --- STABLE SUB-COMPONENTS ---

const MasterPadHeader = () => (
    <div className="header p-8 border-b-2 border-slate-950 flex justify-between items-start shrink-0 mb-6">
        <div className="flex gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div>
                <h1 className="text-2xl font-black text-blue-900 leading-tight uppercase tracking-tighter">Niramoy Clinic & Diagnostic</h1>
                <p className="text-[10px] font-bold text-slate-700">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-widest font-sans font-bold">Govt. Reg No: {DIAGNOSTIC_LICENSE} | Open 24/7</p>
            </div>
        </div>
        <div className="text-right">
            <h2 className="text-sm font-black text-white bg-slate-900 px-4 py-1.5 rounded-lg inline-block uppercase tracking-tighter shadow-md">Lab Report</h2>
        </div>
    </div>
);

const ReportHeader = ({ patient, currentInvoice, doctors }: { patient: any, currentInvoice: any, doctors: any[] }) => {
    const regNo = currentInvoice?.invoice_id?.split('-').pop() + '/' + (currentInvoice?.invoice_date.substring(2,4) || '25');
    const docObj = doctors.find((d: Doctor) => d.doctor_id === currentInvoice?.doctor_id);
    const doctorFullInfo = (currentInvoice?.doctor_name || 'Self') + (docObj?.degree ? ', ' + docObj.degree : '');
    
    return (
        <div className="mb-6 shrink-0 text-black">
            <table className="w-full border-collapse border border-black text-[10px]">
                <tbody>
                    <tr className="h-7">
                        <td className="border border-black px-2 py-0.5 font-bold whitespace-nowrap" style={{ width: '80px' }}>Pt. Name :</td>
                        <td className="border border-black px-2 py-0.5 font-bold uppercase" style={{ width: 'auto' }}>
                            {patient?.pt_name} / {patient?.ageY}Y
                        </td>
                        <td className="border border-black px-2 py-0.5 font-bold whitespace-nowrap" style={{ width: '40px' }}>Sex :</td>
                        <td className="border border-black px-2 py-0.5 font-normal" style={{ width: '50px' }}>{patient?.gender || 'N/A'}</td>
                        <td className="border border-black px-2 py-0.5 font-bold whitespace-nowrap" style={{ width: '60px' }}>Reg.No :</td>
                        <td className="border border-black px-2 py-0.5 font-bold text-blue-800" style={{ width: '80px' }}>{regNo}</td>
                        <td className="border border-black px-2 py-0.5 font-bold whitespace-nowrap" style={{ width: '40px' }}>Date :</td>
                        <td className="border border-black px-2 py-0.5 font-normal" style={{ width: '80px' }}>{currentInvoice?.invoice_date}</td>
                    </tr>
                    <tr className="h-8">
                        <td className="border border-black px-2 py-0.5 font-bold whitespace-nowrap" style={{ width: '80px' }}>Refd By Dr. :</td>
                        <td colSpan={3} className="border border-black px-2 py-0.5 font-bold text-[9px]" style={{ width: 'auto' }}>{doctorFullInfo}</td>
                        <td className="border border-black px-2 py-0.5 font-bold whitespace-nowrap" style={{ width: '60px' }}>B_Code :</td>
                        <td colSpan={3} className="border border-black p-0.5 bg-white">
                            <div className="flex items-center justify-center w-full">
                                <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(patient?.pt_id || '')}&scale=1&height=5&incltext=false`} alt="BC" className="h-4" />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const Signatures = ({ customTechName, customTechDegree, customDocName, customDocDegree }: any) => (
    <div className="footer-sign-container">
        <div className="signature-box flex flex-col items-center">
            <p className="text-[9px] font-black uppercase text-black mb-1" style={{ color: '#000000 !important' }}>Lab Technologist</p>
            <div className="h-10 w-full"></div>
            <div className="w-64 border-t-2 border-black"></div>
            <p className="text-[13px] font-black uppercase pt-0.5 leading-none" style={{ color: '#000000 !important' }}>{customTechName || '...........................................'}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest mt-1 whitespace-pre-wrap text-center" style={{ color: '#000000 !important' }}>{customTechDegree || 'Medical Technologist'}</p>
        </div>
        <div className="signature-box flex flex-col items-center">
            <p className="text-[9px] font-black uppercase text-black mb-1" style={{ color: '#000000 !important' }}>Reported By</p>
            <div className="h-10 w-full"></div>
            <div className="w-64 border-t-2 border-black"></div>
            <p className="text-[15px] font-black uppercase pt-0.5 leading-none" style={{ color: '#000000 !important' }}>{customDocName || '...........................................'}</p>
            <p className="text-[9px] font-bold italic whitespace-pre-wrap leading-tight mt-1 text-center" style={{ color: '#000000 !important' }}>{customDocDegree || ''}</p>
        </div>
    </div>
);

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

// --- MAIN COMPONENT ---

const LabReportingPage: React.FC<any> = ({ invoices, setInvoices, reports, setReports, patients, employees, tests, doctors }) => {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [activeTestName, setActiveTestName] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [viewMode, setViewMode] = useState<'reporting' | 'template_mgmt'>('reporting');
    const [selectedTechnologistId, setSelectedTechnologistId] = useState<string>('');
    const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
    const [currentReportData, setCurrentReportData] = useState<any>(null);
    
    const [customTechName, setCustomTechName] = useState('');
    const [customTechDegree, setCustomTechDegree] = useState('');
    const [customDocName, setCustomDocName] = useState('');
    const [customDocDegree, setCustomDocDegree] = useState('');

    const [printFullPad, setPrintFullPad] = useState<boolean>(true); 

    const handleSelectInvoice = (id: string) => {
        setSelectedInvoiceId(id);
        setActiveTestName(null);
        setCurrentReportData(null);
    };

    const handleSelectTest = (tName: string) => {
        setActiveTestName(tName);
        const saved = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === tName);
        if (saved) {
            setCurrentReportData(saved.data);
            setSelectedTechnologistId(saved.technologistId || '');
            setSelectedConsultantId(saved.consultantId || '');
            
            const tech = employees.find((e: any) => e.emp_id === saved.technologistId);
            if (tech) {
                setCustomTechName(tech.emp_name);
                setCustomTechDegree(tech.degree || 'Medical Technologist');
            }
            const doc = doctors.find((d: any) => d.doctor_id === saved.consultantId);
            if (doc) {
                setCustomDocName(doc.doctor_name);
                setCustomDocDegree(doc.degree);
            }
        } else {
            setCurrentReportData(null);
        }
    };
    const currentInvoice = useMemo(() => {
        if (!Array.isArray(invoices)) return null;
        return invoices.find((inv: Invoice) => inv.invoice_id === selectedInvoiceId);
    }, [selectedInvoiceId, invoices]);

    const patient = useMemo(() => {
        if (!Array.isArray(patients) || !currentInvoice) return null;
        return patients.find((p: Patient) => p.pt_id === currentInvoice.patient_id);
    }, [currentInvoice, patients]);

    // Clear success message quickly (1s)
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // FOCUS LOGIC: Only show/print the active selected test
    const activeTestGroup = useMemo(() => {
        if (!currentInvoice || !activeTestName) return [];
        return [activeTestName];
    }, [currentInvoice, activeTestName]);

    const groupedPathologyTests = useMemo(() => {
        const groups: Record<string, string[]> = {};
        activeTestGroup.forEach(tName => {
            const testDef = tests.find(t => t.test_name === tName);
            const cat = testDef?.category || 'Others';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(tName);
        });
        return groups;
    }, [activeTestGroup, tests]);

    const handleSaveReport = (reportData: any, isAutoSave: boolean = false) => {
        if (!selectedInvoiceId || !activeTestName) return;
        
        let updatedReports: LabReport[] = [];
        setReports((prev: LabReport[]) => {
            let newList = [...prev];
            const existing = prev.find(r => r.invoice_id === selectedInvoiceId && r.test_name === activeTestName);
            const newReport: LabReport = {
                report_id: existing?.report_id || `REP-${selectedInvoiceId}-${activeTestName.replace(/\s+/g, '')}`,
                invoice_id: selectedInvoiceId, test_name: activeTestName, patient_id: patient?.pt_id || '',
                report_date: new Date().toISOString().split('T')[0], status: 'Completed', data: reportData,
                technologistId: selectedTechnologistId, consultantId: selectedConsultantId,
                isDelivered: existing?.isDelivered || false
            };
            newList = newList.filter(r => !(r.invoice_id === selectedInvoiceId && r.test_name === activeTestName));
            newList.push(newReport);
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
                        * { box-sizing: border-box; }
                        html, body { 
                            background: white; 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            font-family: 'Times New Roman', serif; 
                            color: black; 
                            width: 100%; 
                            height: 100%;
                            overflow: hidden !important; 
                            -webkit-print-color-adjust: exact;
                        }
                        .paper-page { 
                            width: 210mm; 
                            height: 294mm; 
                            max-height: 294mm; 
                            margin: 0 auto; 
                            position: relative; 
                            display: flex; 
                            flex-direction: column; 
                            background: white; 
                            overflow: hidden !important;
                            page-break-after: avoid !important;
                            page-break-inside: avoid !important;
                        }
                        .paper-inner { padding: 0 15mm; flex: 1; display: flex; flex-direction: column; position: relative; width: 100%; height: 100%; }
                        .report-content-body { ${printFullPad ? 'margin-top: 0;' : 'margin-top: 2.3in;'} flex: 1; width: 100%; }
                        .footer-sign-container { 
                            position: absolute; 
                            bottom: 12mm; 
                            left: 15mm; 
                            right: 15mm; 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: flex-end; 
                            background: white; 
                            width: calc(100% - 30mm); 
                        }
                        .signature-box { text-align: center; width: 45%; }
                        .category-title { 
                            font-weight: 950 !important; 
                            text-transform: uppercase; 
                            text-decoration: underline; 
                            font-size: 14pt; 
                            margin-bottom: 15px; 
                            text-align: center; 
                            display: block; 
                            color: #000000 !important; 
                        }
                        .no-print { display: none !important; }
                        input, textarea { border: none !important; outline: none !important; background: transparent !important; }
                    </style>
                </head>
                <body>
                    <div id="print-mount" style="width: 100%; height: 100%; overflow: hidden;">${content.innerHTML}</div>
                    <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 850); };</script>
                </body>
            </html>
        `);
        win.document.close();
    };

    if (viewMode === 'template_mgmt') return <TemplateManagementPage onBack={() => setViewMode('reporting')} />;

    return (
        <div className="bg-slate-200 h-full flex flex-col font-sans overflow-hidden text-black">
            <style>{`
                .paper-page { width: 210mm; height: 294mm; min-height: 294mm; margin: 0 auto; position: relative; background: white; display: flex; flex-direction: column; box-shadow: 0 0 50px rgba(0,0,0,0.1); box-sizing: border-box; overflow: hidden; }
                .paper-inner { padding: 0 15mm; flex: 1; display: flex; flex-direction: column; position: relative; }
                .footer-sign-container { position: absolute; bottom: 12mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; align-items: flex-end; }
                .signature-box { text-align: center; width: 45%; }
                .category-title { font-weight: 950 !important; text-transform: uppercase; text-decoration: underline; font-size: 14pt; margin-bottom: 15px; text-align: center; display: block; color: #000000 !important; }
                
                /* In-workspace Side Controls */
                .side-controls-container { position: sticky; top: 20px; z-index: 50; width: 0; height: 0; }
                .side-controls-left { position: absolute; right: 15px; top: 20px; display: flex; flex-direction: column; gap: 10px; width: 120px; }
                .side-controls-right { position: absolute; left: calc(210mm + 15px); top: 20px; display: flex; flex-direction: column; gap: 12px; width: 50px; }
            `}</style>

            {successMessage && <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border-2 border-emerald-500 text-white px-12 py-8 rounded-[3rem] shadow-2xl z-[500] animate-fade-in-up flex flex-col items-center gap-4"><div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-black">✓</div><div className="text-xl font-black uppercase tracking-widest">{successMessage}</div></div>}
            
            <div className="grid grid-cols-12 flex-1 overflow-hidden">
                <div className="col-span-2 bg-white border-r flex flex-col shadow-sm no-print">
                    <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                        <h3 className="font-black text-[10px] uppercase tracking-widest">Reporting Queue</h3>
                        <button onClick={() => setViewMode('template_mgmt')} className="p-2 bg-slate-800 rounded-xl hover:bg-blue-600 transition-all shadow-md"><SettingsIcon size={14}/></button>
                    </div>
                    <div className="p-3 bg-slate-50 border-b">
                        <input placeholder="Search Patient..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border rounded-2xl text-[11px] bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-sm" />
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3 custom-scrollbar">
                        {invoices.filter((i: any) => i.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || i.invoice_id.includes(searchTerm)).map((r: any) => {
                            const isActive = selectedInvoiceId === r.invoice_id;
                            return (
                                <div key={r.invoice_id} onClick={() => handleSelectInvoice(r.invoice_id)} className={`p-3 border-2 rounded-2xl cursor-pointer transition-all ${isActive ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105' : 'bg-white hover:border-blue-200'}`}>
                                    <div className={`font-black text-[11px] uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{r.patient_name}</div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`text-[9px] font-mono ${isActive ? 'text-white/70' : 'text-slate-500'}`}>{r.invoice_id}</span>
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
                                <button key={it.test_id} onClick={() => handleSelectTest(it.test_name)} className={`w-full text-left p-4 rounded-2xl text-[11px] font-black transition-all border flex justify-between items-center ${activeTestName === it.test_name ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : isTestDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                                    <span className="truncate pr-1 uppercase">{it.test_name}</span>
                                    {isTestDone && <span>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-slate-700 space-y-3">
                         <select value={selectedTechnologistId} onChange={e=>{
                             const id = e.target.value;
                             setSelectedTechnologistId(id);
                             const tech = employees.find((emp: any) => emp.emp_id === id);
                             if (tech) {
                                 setCustomTechName(tech.emp_name);
                                 setCustomTechDegree(tech.degree || 'Medical Technologist');
                             }
                         }} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] text-white font-bold outline-none"><option value="">-- Select Tech --</option>{employees.filter((e:any)=>e.department==='Diagnostic').map((e: any) => <option key={e.emp_id} value={e.emp_id}>{e.emp_name}</option>)}</select>
                         <select value={selectedConsultantId} onChange={e=>{
                             const id = e.target.value;
                             setSelectedConsultantId(id);
                             const doc = doctors.find((d: any) => d.doctor_id === id);
                             if (doc) {
                                 setCustomDocName(doc.doctor_name);
                                 setCustomDocDegree(doc.degree);
                             }
                         }} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] text-white font-bold outline-none"><option value="">-- Select Doctor --</option>{doctors.map((d: any) => <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name}</option>)}</select>
                    </div>
                </div>

                <div className="col-span-8 bg-slate-200 flex flex-col relative overflow-hidden">
                    {activeTestName ? (
                        <div className="flex-1 overflow-y-auto bg-slate-200 custom-scrollbar relative">
                            {/* CENTERED WRAPPER FOR PAPER AND IMMEDIATE CONTROLS */}
                            <div className="relative mx-auto w-fit py-10">
                                
                                {/* STICKY SIDE CONTROLS WITHIN THE WORKSPACE BACKGROUND */}
                                <div className="side-controls-container no-print">
                                    <div className="side-controls-left">
                                        <div className="bg-indigo-600 text-white px-2 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-lg text-center truncate border border-indigo-400">{activeTestName}</div>
                                        <label className="flex items-center justify-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border-2 border-slate-300 shadow-xl group hover:border-blue-500 transition-all">
                                            <input type="checkbox" checked={printFullPad} onChange={e => setPrintFullPad(e.target.checked)} className="w-4 h-4 text-blue-600" />
                                            <span className="text-[12px] font-black uppercase text-slate-700 group-hover:text-blue-600 leading-none">Pad Mode</span>
                                        </label>
                                    </div>
                                    <div className="side-controls-right">
                                        <button onClick={() => handleSaveReport(currentReportData)} className="bg-emerald-600 hover:bg-emerald-500 text-white w-9 h-9 rounded-full shadow-xl transition-all flex items-center justify-center border-2 border-white active:scale-90" title="Save Report"><SaveIcon size={16}/></button>
                                        <button onClick={handlePrintReport} className="bg-blue-600 hover:bg-blue-500 text-white w-9 h-9 rounded-full shadow-xl transition-all flex items-center justify-center border-2 border-white active:scale-90" title="Print Report"><PrinterIcon size={16}/></button>
                                    </div>
                                </div>

                                <div id="printable-report-content">
                                    {(activeTestName.toLowerCase().includes('usg') || activeTestName.toLowerCase().includes('ultra')) ? (
                                        <div className="paper-page">
                                            <div className="paper-inner">
                                                {printFullPad && <MasterPadHeader />}
                                                <div className="report-content-body">
                                                    <ReportHeader patient={patient} currentInvoice={currentInvoice} doctors={doctors} />
                                                    <div className="category-title">Ultrasonography Report</div>
                                                    <UltrasonographyReportEditor template={null} patient={patient} invoice={currentInvoice} onSave={handleSaveReport} reportData={currentReportData} setReportData={setCurrentReportData} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} />
                                                </div>
                                                <Signatures customTechName={customTechName} customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            {(Object.entries(groupedPathologyTests) as [string, string[]][]).map(([category, testsInCat]) => {
                                                const cbcTest = testsInCat.find(t => t.toLowerCase().includes('cbc'));
                                                const otherTests = testsInCat.filter(t => !t.toLowerCase().includes('cbc'));
                                                const specialTests = otherTests.filter(t => t.toLowerCase().includes('urine') || t.toLowerCase().includes('semen'));
                                                const regularTests = otherTests.filter(t => !specialTests.includes(t));

                                                return (
                                                    <React.Fragment key={category}>
                                                        {regularTests.length > 0 && (
                                                            <div className="paper-page">
                                                                <div className="paper-inner">
                                                                    {printFullPad && <MasterPadHeader />}
                                                                    <div className="report-content-body">
                                                                        <ReportHeader patient={patient} currentInvoice={currentInvoice} doctors={doctors} />
                                                                        <div className="category-title">{category} Report</div>
                                                                        <table className="w-full border-collapse border border-black">
                                                                            <thead className="bg-slate-50">
                                                                                <tr>
                                                                                    <th className="border border-black p-2 text-left text-[10px] uppercase font-black w-[45%]">Investigation</th>
                                                                                    <th className="border border-black p-2 text-center text-[10px] uppercase font-black w-[20%]">Result</th>
                                                                                    <th className="border border-black p-2 text-center text-[10px] uppercase font-black w-[15%]">Unit</th>
                                                                                    <th className="border border-black p-2 text-left text-[10px] uppercase font-black w-[20%]">Normal Range</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {regularTests.map((tName: string) => {
                                                                                    const testDef = tests.find((t: any) => t.test_name === tName);
                                                                                    const val = currentReportData?.[tName] || '';
                                                                                    const isAlert = isOutOfRange(val, testDef?.normal_range || '');
                                                                                    return (
                                                                                        <tr key={tName} className="h-8">
                                                                                            <td className="border border-black px-2 py-0.5 font-bold uppercase text-[10px]">{tName}</td>
                                                                                            <td className="border border-black p-0 text-center">
                                                                                                <input className={`w-full h-full p-1 border-none font-black text-center text-sm outline-none no-print ${isAlert ? 'bg-red-50 text-red-600' : 'bg-blue-50'}`} onChange={(e) => setCurrentReportData({ ...currentReportData, [tName]: e.target.value })} value={val} />
                                                                                                <span className={`hidden print:block font-black text-sm ${isAlert ? 'text-red-600' : ''}`}>{val || '---'}</span>
                                                                                            </td>
                                                                                            <td className="border border-black text-center text-[9px]">{testDef?.unit || '-'}</td>
                                                                                            <td className="border border-black px-2 text-[9px] italic font-bold">{testDef?.normal_range || '-'}</td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    <Signatures customTechName={customTechName} customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {cbcTest && (
                                                            <div className="paper-page">
                                                                <div className="paper-inner">
                                                                    {printFullPad && <MasterPadHeader />}
                                                                    <div className="report-content-body">
                                                                        <ReportHeader patient={patient} currentInvoice={currentInvoice} doctors={doctors} />
                                                                        <div className="category-title">Hematology Report</div>
                                                                        <CBCInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} checkRange={isOutOfRange} />
                                                                    </div>
                                                                    <Signatures customTechName={customTechName} customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {specialTests.map(tName => (
                                                            <div key={tName} className="paper-page">
                                                                <div className="paper-inner">
                                                                    {printFullPad && <MasterPadHeader />}
                                                                    <div className="report-content-body">
                                                                        <ReportHeader patient={patient} currentInvoice={currentInvoice} doctors={doctors} />
                                                                        <div className="category-title">Clinical Pathology Report</div>
                                                                        {tName.toLowerCase().includes('urine') ? (
                                                                            <UrineRMEInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} />
                                                                        ) : (
                                                                            <SemenAnalysisInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} />
                                                                        )}
                                                                    </div>
                                                                    <Signatures customTechName={customTechName} customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4 bg-white p-20 text-center">
                            <div className="p-16 bg-slate-50 rounded-full border-4 border-dashed border-slate-100 shadow-inner opacity-20"><Activity size={100} /></div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-400">Select Patient & Test to Begin</h2>
                        </div>
                    )}
                </div>
            </div>
            {activeTestName && (
                <div className="no-print bg-slate-900 border-t border-slate-700 p-4 shrink-0 flex justify-center gap-10">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Technologist:</span>
                        <input value={customTechName} onChange={e=>setCustomTechName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none w-48" placeholder="Name"/>
                        <textarea value={customTechDegree} onChange={e=>setCustomTechDegree(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1 text-[10px] text-white outline-none w-48 h-8 resize-none" placeholder="Degree"/>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Consultant:</span>
                        <input value={customDocName} onChange={e=>setCustomDocName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none w-48" placeholder="Name"/>
                        <textarea value={customDocDegree} onChange={e=>setCustomDocDegree(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1 text-[10px] text-white outline-none w-64 h-8 resize-none" placeholder="Degrees"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabReportingPage;
