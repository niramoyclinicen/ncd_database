
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
    
    const [customTechName, setCustomTechName] = useState('');
    const [customTechDegree, setCustomTechDegree] = useState('');
    const [customDocName, setCustomDocName] = useState('');
    const [customDocDegree, setCustomDocDegree] = useState('');

    const [printFullPad, setPrintFullPad] = useState<boolean>(true); 

    const currentInvoice = useMemo(() => invoices.find((inv: Invoice) => inv.invoice_id === selectedInvoiceId), [selectedInvoiceId, invoices]);
    const patient = useMemo(() => patients.find((p: Patient) => p.pt_id === currentInvoice?.patient_id), [currentInvoice, patients]);

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

    useEffect(() => {
        if (!selectedInvoiceId || !activeTestName) return;
        const saved = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === activeTestName);
        if (saved) {
            setCurrentReportData(saved.data);
            setSelectedTechnologistId(saved.technologistId || '');
            setSelectedConsultantId(saved.consultantId || '');
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
                        .paper-page { 
                            width: 210mm; 
                            min-height: 297mm; 
                            margin: 0 auto; 
                            position: relative; 
                            display: flex; 
                            flex-direction: column; 
                            box-sizing: border-box; 
                            page-break-after: always;
                        }
                        .report-content { 
                            padding: 10mm 15mm 45mm 15mm; 
                            ${printFullPad ? 'margin-top: 0;' : 'margin-top: 2.1in;'} 
                            flex: 1;
                        }
                        .footer-sign {
                            position: absolute;
                            bottom: 15mm;
                            left: 0;
                            right: 0;
                            padding: 0 20mm;
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-end;
                            background: white;
                            z-index: 100;
                        }
                        .signature-box { text-align: center; width: 45%; }
                        .category-title { 
                            font-weight: 900; 
                            text-transform: uppercase; 
                            text-decoration: underline; 
                            font-size: 16pt; 
                            margin-bottom: 20px; 
                            text-align: center; 
                            display: block;
                        }
                        .no-print { display: none !important; }
                    </style>
                </head>
                <body>
                    ${content.innerHTML}
                    <script>
                        window.onload = () => {
                            setTimeout(() => { window.print(); window.close(); }, 850);
                        };
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    };

    const ReportHeader = () => {
        const regNo = currentInvoice?.invoice_id?.split('-').pop() + '/' + (currentInvoice?.invoice_date.substring(2,4) || '25');
        const docObj = doctors.find((d: Doctor) => d.doctor_id === currentInvoice?.doctor_id);
        const doctorFullInfo = (currentInvoice?.doctor_name || 'Self') + (docObj?.degree ? ', ' + docObj.degree : '');
        
        return (
            <div className="mb-6 shrink-0 text-black">
                <table className="w-full border-collapse border-2 border-black text-[11px]">
                    <tbody>
                        <tr className="h-8">
                            <td className="border border-black px-2 py-1 font-bold whitespace-nowrap" style={{ width: '80px' }}>Pt. Name :</td>
                            <td className="border border-black px-2 py-1 font-bold uppercase" style={{ width: 'auto' }}>
                                {patient?.pt_name} / {patient?.ageY}Y
                            </td>
                            <td className="border border-black px-2 py-1 font-bold whitespace-nowrap" style={{ width: '45px' }}>Sex :</td>
                            <td className="border border-black px-2 py-1 font-normal" style={{ width: '60px' }}>{patient?.gender || 'N/A'}</td>
                            <td className="border border-black px-2 py-1 font-bold whitespace-nowrap" style={{ width: '70px' }}>Reg.No :</td>
                            <td className="border border-black px-2 py-1 font-bold text-blue-800" style={{ width: '85px' }}>{regNo}</td>
                            <td className="border border-black px-2 py-1 font-bold whitespace-nowrap" style={{ width: '45px' }}>Date :</td>
                            <td className="border border-black px-2 py-1 font-normal" style={{ width: '85px' }}>{currentInvoice?.invoice_date}</td>
                        </tr>
                        <tr className="h-10">
                            <td className="border border-black px-2 py-1 font-bold whitespace-nowrap" style={{ width: '80px' }}>Refd By Dr. :</td>
                            <td colSpan={3} className="border border-black px-2 py-1 font-bold text-[10px]" style={{ width: 'auto' }}>{doctorFullInfo}</td>
                            <td className="border border-black px-2 py-1 font-bold whitespace-nowrap" style={{ width: '70px' }}>B_Code :</td>
                            <td colSpan={3} className="border border-black p-1 bg-white">
                                <div className="flex items-center justify-center w-full">
                                    <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(patient?.pt_id || '')}&scale=1&height=6&incltext=false`} alt="BC" className="h-5" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const MasterPadHeader = () => (
        <div className="header p-10 border-b-4 border-slate-900 flex justify-between items-start shrink-0">
            <div className="flex gap-5">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-blue-900 leading-tight uppercase tracking-tighter">Niramoy Clinic & Diagnostic</h1>
                    <p className="text-[12px] font-bold text-slate-700">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-sans font-bold">Govt. Reg No: ${DIAGNOSTIC_LICENSE} | Open 24/7</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-xl font-black text-white bg-slate-900 px-5 py-2 rounded-xl inline-block uppercase tracking-tighter shadow-md">Lab Report</h2>
            </div>
        </div>
    );

    const Signatures = () => (
        <div className="footer-sign">
            <div className="signature-box">
                <p className="text-[11px] font-black uppercase text-slate-500 mb-1">Lab Technologist</p>
                <div className="h-12 w-full"></div>
                <p className="text-[14px] font-black text-slate-950 uppercase border-t-2 border-black pt-1">{customTechName || '...........................................'}</p>
                <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">{customTechDegree || 'Medical Technologist'}</p>
            </div>
            <div className="signature-box">
                <p className="text-[11px] font-black uppercase text-slate-500 mb-1">Reported By</p>
                <div className="h-12 w-full"></div>
                <p className="text-[14px] font-black text-slate-950 uppercase border-t-2 border-black pt-1">{customDocName || '...........................................'}</p>
                <p className="text-[10px] font-bold text-slate-600 italic whitespace-pre-wrap leading-tight">{customDocDegree || ''}</p>
            </div>
        </div>
    );

    if (viewMode === 'template_mgmt') return <TemplateManagementPage onBack={() => setViewMode('reporting')} />;

    return (
        <div className="bg-slate-200 h-screen flex flex-col font-sans overflow-hidden">
            {successMessage && <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border-2 border-emerald-500 text-white px-12 py-8 rounded-[3rem] shadow-2xl z-[500] animate-bounce flex flex-col items-center gap-4"><div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-black">✓</div><div className="text-xl font-black uppercase tracking-widest">{successMessage}</div></div>}
            
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
                                <div key={r.invoice_id} onClick={() => { setSelectedInvoiceId(r.invoice_id); setActiveTestName(null); }} className={`p-3 border-2 rounded-2xl cursor-pointer transition-all ${isActive ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105' : 'bg-white hover:border-blue-200'}`}>
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
                                <button key={it.test_id} onClick={() => setActiveTestName(it.test_name)} className={`w-full text-left p-4 rounded-2xl text-[11px] font-black transition-all border flex justify-between items-center ${activeTestName === it.test_name ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : isTestDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                                    <span className="truncate pr-1 uppercase">{it.test_name}</span>
                                    {isTestDone && <span>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-slate-700 space-y-3">
                         <select value={selectedTechnologistId} onChange={e=>setSelectedTechnologistId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] text-white font-bold outline-none"><option value="">-- Select Tech --</option>{employees.filter((e:any)=>e.department==='Diagnostic').map((e: any) => <option key={e.emp_id} value={e.emp_id}>{e.emp_name}</option>)}</select>
                         <select value={selectedConsultantId} onChange={e=>setSelectedConsultantId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] text-white font-bold outline-none"><option value="">-- Select Doctor --</option>{doctors.map((d: any) => <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name}</option>)}</select>
                    </div>
                </div>

                <div className="col-span-8 bg-white flex flex-col shadow-2xl relative overflow-hidden">
                    {activeTestName ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b no-print flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-xl font-black text-xs uppercase shadow-inner">{activeTestName}</div>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
                                        <input type="checkbox" checked={printFullPad} onChange={e => setPrintFullPad(e.target.checked)} className="w-4 h-4 text-blue-600" />
                                        <span className="text-[10px] font-black uppercase text-slate-500">Professional A4 Pad</span>
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleSaveReport(currentReportData)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-2xl font-black uppercase text-xs shadow-xl transition-all"><SaveIcon size={14} className="inline mr-1"/> Save</button>
                                    <button onClick={handlePrintReport} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-black uppercase text-xs shadow-xl transition-all"><PrinterIcon size={14} className="inline mr-1"/> Print</button>
                                </div>
                            </div>

                            {/* Main Scrolling View - Mimics Word Documents */}
                            <div className="flex-1 overflow-y-auto bg-slate-300 custom-scrollbar py-10 space-y-10" id="printable-report-content">
                                {(activeTestName.toLowerCase().includes('usg') || activeTestName.toLowerCase().includes('ultra')) ? (
                                    <div className="paper-page bg-white shadow-2xl mx-auto rounded-sm flex flex-col text-black">
                                        {printFullPad && <MasterPadHeader />}
                                        <div className="report-content">
                                            <ReportHeader />
                                            <div className="category-title">Ultrasonography Report</div>
                                            <UltrasonographyReportEditor template={null} patient={patient} invoice={currentInvoice} onSave={handleSaveReport} reportData={currentReportData} setReportData={setCurrentReportData} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} />
                                        </div>
                                        <Signatures />
                                    </div>
                                ) : (
                                    <>
                                        {(Object.entries(groupedPathologyTests) as [string, string[]][]).map(([category, testsInCat], catIdx) => {
                                            const cbcTest = testsInCat.find(t => t.toLowerCase().includes('cbc'));
                                            const otherTests = testsInCat.filter(t => !t.toLowerCase().includes('cbc'));
                                            
                                            // Handle Special Standalones like Urine/Semen within Category
                                            const specialTests = otherTests.filter(t => t.toLowerCase().includes('urine') || t.toLowerCase().includes('semen'));
                                            const regularTests = otherTests.filter(t => !specialTests.includes(t));

                                            return (
                                                <React.Fragment key={category}>
                                                    {/* REGULAR PATHOLOGY PAGE */}
                                                    {regularTests.length > 0 && (
                                                        <div className="paper-page bg-white shadow-2xl mx-auto rounded-sm flex flex-col text-black">
                                                            {printFullPad && <MasterPadHeader />}
                                                            <div className="report-content">
                                                                <ReportHeader />
                                                                <div className="category-title">{category} Report</div>
                                                                <table className="w-full border-collapse border-2 border-black">
                                                                    <thead className="bg-slate-100">
                                                                        <tr>
                                                                            <th className="border-2 border-black p-2 text-left text-[11px] uppercase font-black w-[45%]">Investigation</th>
                                                                            <th className="border-2 border-black p-2 text-center text-[11px] uppercase font-black w-[20%]">Result</th>
                                                                            <th className="border-2 border-black p-2 text-center text-[11px] uppercase font-black w-[15%]">Unit</th>
                                                                            <th className="border-2 border-black p-2 text-left text-[11px] uppercase font-black w-[20%]">Normal Range</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {regularTests.map((tName: string) => {
                                                                            const testDef = tests.find((t: any) => t.test_name === tName);
                                                                            const val = currentReportData?.[tName] || '';
                                                                            const isAlert = isOutOfRange(val, testDef?.normal_range || '');
                                                                            return (
                                                                                <tr key={tName} className="h-9">
                                                                                    <td className="border-2 border-black px-3 py-1 font-black uppercase text-[11px]">{tName}</td>
                                                                                    <td className="border-2 border-black p-0 text-center">
                                                                                        <input className={`w-full h-full p-1 border-none font-black text-center text-sm outline-none no-print ${isAlert ? 'bg-red-50 text-red-600' : 'bg-blue-50'}`} onChange={(e) => setCurrentReportData({ ...currentReportData, [tName]: e.target.value })} value={val} />
                                                                                        <span className={`hidden print:block font-black text-sm ${isAlert ? 'text-red-600' : ''}`}>{val || '---'}</span>
                                                                                    </td>
                                                                                    <td className="border-2 border-black text-center text-[10px]">{testDef?.unit || '-'}</td>
                                                                                    <td className="border-2 border-black px-3 text-[9px] italic font-bold">{testDef?.normal_range || '-'}</td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <Signatures />
                                                        </div>
                                                    )}

                                                    {/* ISOLATED CBC PAGE */}
                                                    {cbcTest && (
                                                        <div className="paper-page bg-white shadow-2xl mx-auto rounded-sm flex flex-col text-black">
                                                            {printFullPad && <MasterPadHeader />}
                                                            <div className="report-content">
                                                                <ReportHeader />
                                                                <div className="category-title">Hematology Report</div>
                                                                <CBCInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} checkRange={isOutOfRange} />
                                                            </div>
                                                            <Signatures />
                                                        </div>
                                                    )}

                                                    {/* ISOLATED SPECIAL TEST PAGES (Urine, Semen) */}
                                                    {specialTests.map(tName => (
                                                        <div key={tName} className="paper-page bg-white shadow-2xl mx-auto rounded-sm flex flex-col text-black">
                                                            {printFullPad && <MasterPadHeader />}
                                                            <div className="report-content">
                                                                <ReportHeader />
                                                                <div className="category-title">Clinical Pathology Report</div>
                                                                {tName.toLowerCase().includes('urine') ? (
                                                                    <UrineRMEInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} />
                                                                ) : (
                                                                    <SemenAnalysisInputPage results={currentReportData} onSaveOverride={handleSaveReport} patient={patient} invoice={currentInvoice} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} />
                                                                )}
                                                            </div>
                                                            <Signatures />
                                                        </div>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4 bg-slate-50/50 p-20 text-center">
                            <div className="p-16 bg-white rounded-full border-4 border-dashed border-slate-100 shadow-xl opacity-20"><Activity size={100} /></div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-400">Select Patient & Test to Begin</h2>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Override Controls for technologist/doctor names at the bottom of the screen */}
            {activeTestName && (
                <div className="no-print bg-slate-900 border-t border-slate-700 p-4 shrink-0 flex justify-center gap-10">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Technologist:</span>
                        <input value={customTechName} onChange={e=>setCustomTechName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none w-48" placeholder="Name"/>
                        <input value={customTechDegree} onChange={e=>setCustomTechDegree(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none w-48" placeholder="Degree"/>
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
