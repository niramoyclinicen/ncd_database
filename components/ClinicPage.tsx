import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Patient, Doctor, Employee, Medicine, Referrar, MedicineItem, ExpenseItem } from './DiagnosticData';
import SearchableSelect from './SearchableSelect';
import PatientInfoPage from './PatientInfoPage';
import DoctorInfoPage from './DoctorInfoPage';
import ReferrerInfoPage from './ReferrerInfoPage';
import { BackIcon, ClinicIcon, StethoscopeIcon, ClipboardIcon, FileTextIcon, SettingsIcon, UserPlusIcon, Armchair, Activity, SaveIcon, MoneyIcon, TrashIcon, PrinterIcon, EyeIcon, SearchIcon, PlusIcon, RefreshIcon } from './Icons';

// Fixed Clinic Config
const CLINIC_REGISTRATION = 'HSM76710';

// Clinic Expense Categories for net balance calculation
const clinicExpenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Clinic development', 
    'Medicine buy (Pharmacy)', 'X-Ray', 'House rent', 'Stationery', 'Food/Refreshment', 
    'Doctor donation', 'Repair/Instruments', 'Press', 'License/Official', 
    'Bank/NGO Installment', 'Mobile', 'Interest/Loan', 'Others', 'Old Loan Repay'
];

// --- TYPES ---

interface TreatmentLog {
    id: number;
    date: string;
    time: string;
    note: string;
    by: string;
    medicationId?: number;
    supplySrc?: 'Clinic' | 'Outside';
    actualInventoryId?: string; // Tracks which specific inventory item was actually given
}

interface Medication {
    id: number;
    inventoryId?: string; 
    type: string;
    name: string;
    genericName?: string; // Added generic name for smart search
    dosage: string;
    frequency: number;
    category: 'Conservative' | 'Pre-operative' | 'Operative' | 'Post-operative';
}

interface TreatmentTemplate {
    id: string;
    name: string;
    category: 'Conservative' | 'Pre-operative' | 'Operative' | 'Post-operative';
    diet: string;
    medications: Medication[];
    note: string;
}

interface RequestedDrug {
    id: string;
    name: string;
    type: string;
    strength: string;
    genericName: string;
    requestedBy: string;
    date: string;
    status: 'Pending' | 'Fulfilled';
}

// Sequential Order Block
interface ClinicalOrderBlock {
    id: string;
    date: string;
    time: string;
    category: 'Conservative' | 'Pre-operative' | 'Operative' | 'Post-operative';
    diet: string;
    medications: Medication[];
    note: string;
}

interface AdmissionRecord {
    admission_id: string;
    admission_date: string;
    patient_id: string;
    patient_name: string;
    doctor_id: string;
    doctor_name: string;
    referrer_id: string;
    referrer_name: string;
    indication: string;
    service_name: string;
    service_category: string;
    contract_type: 'Contact' | 'Non-Contact';
    contract_amount: number;
    clinical_orders: ClinicalOrderBlock[]; 
    doctor_rounds: TreatmentLog[];
    nurse_chart: TreatmentLog[];
    discharge_date?: string;
    discharge_note?: string;
    bed_no?: string;
}

const emptyAdmission: AdmissionRecord = {
    admission_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    patient_id: '',
    patient_name: '',
    doctor_id: '',
    doctor_name: '',
    referrer_id: '',
    referrer_name: '',
    indication: '',
    service_name: '',
    service_category: 'Conservative treatment',
    contract_type: 'Non-Contact',
    contract_amount: 0,
    clinical_orders: [],
    doctor_rounds: [],
    nurse_chart: [],
    bed_no: '' 
};

export interface Indication {
    id: string;
    name: string;
}

export interface ServiceItemDef {
    id: string;
    name: string;
}

// --- INDOOR INVOICE TYPES ---
interface ServiceItem {
  id: number;
  service_type: string;
  service_provider: string;
  service_charge: number;
  quantity: number;
  line_total: number;
  discount: number;
  payable_amount: number;
  note: string;
  isClinicFund?: boolean; // New checkbox field
}

export interface IndoorInvoice {
  daily_id: string;
  monthly_id: string;
  yearly_id: string;
  invoice_date: string;
  admission_id: string; 
  patient_id: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name?: string;
  referrar_id?: string;
  referrar_name?: string;
  indication: string;
  serviceCategory: string;
  subCategory?: string; // Mandatory for Service Taken
  ot_details?: string;   // Persistent OT Details for this invoice
  services: string[]; 
  contact_bill: string;
  items: ServiceItem[];
  total_bill: number;
  total_discount: number;
  referrer_commission: number;
  payable_bill: number;
  paid_amount: number;
  due_bill: number;
  bill_pay_status: boolean;
  bill_by: string;
  bill_paid_by: string;
  notes: string;
  payment_method: string;
  bill_created_by: string;
  special_commission: number;
  commission_paid: number;
  last_modified?: string;
  special_discount_percent?: number;
  special_discount_amount?: number;
  net_payable?: number;
  admission_date?: string;
  discharge_date?: string;
  status?: string; 
  return_date?: string; // New: added for refund accounting
}

const emptyIndoorInvoice: IndoorInvoice = {
  daily_id: '',
  monthly_id: '',
  yearly_id: '',
  invoice_date: new Date().toISOString().split('T')[0],
  admission_id: '',
  patient_id: '',
  patient_name: '',
  doctor_id: '',
  doctor_name: '',
  referrar_id: '',
  referrar_name: '',
  indication: '',
  serviceCategory: 'Conservative treatment',
  subCategory: '',
  ot_details: '',
  services: [],
  contact_bill: '',
  items: [],
  total_bill: 0,
  total_discount: 0,
  referrer_commission: 0,
  payable_bill: 0,
  paid_amount: 0,
  due_bill: 0,
  bill_pay_status: false,
  bill_by: '',
  bill_paid_by: '',
  notes: '',
  payment_method: 'Cash',
  bill_created_by: '',
  special_commission: 0,
  commission_paid: 0,
  special_discount_percent: 0,
  special_discount_amount: 0,
  net_payable: 0,
  admission_date: '',
  discharge_date: '',
  status: 'Posted'
};

interface ClinicDueCollection {
  collection_id: string;
  invoice_id: string; 
  patient_name: string;
  collection_date: string;
  amount_collected: number;
  collected_by?: string;
}

interface ClinicCertificate {
    id: string;
    type: 'discharge' | 'birth' | 'death' | 'referral';
    admissionId: string;
    patientName: string;
    date: string;
    time: string;
    details: any; // Dynamic fields
    note: string;
    issuedBy: string;
    createdDate: string;
}

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const drugTypes = ['Tab', 'Cap', 'Inj', 'Inf', 'Syp', 'Susp', 'Suppository', 'Inhaler', 'Nebulizer', 'Catheter', 'Drop', 'Ointment', 'Cream', 'Gel'];
const drugFrequencies = [
    { label: '6 Hourly (1+1+1+1)', value: 6 },
    { label: '8 Hourly (1+1+1)', value: 8 },
    { label: '12 Hourly (1+0+1)', value: 12 },
    { label: '24 Hourly (1+0+0)', value: 24 },
    { label: 'Stat (Once)', value: 0 },
];
const dietOptions = ['NPO TFO', 'Liquid', 'Liquid and semisolid', 'Regular'];

const serviceCategoriesList = ["Conservative treatment", "Operation", "NVD and D&C", "O2 and nebulizer", "Plaster and Bandage", "Dressing", "Others"];

const serviceTypesList = [
    'Admission Fee', 'Doctor round fee', 'Doctor prescription fee', 'Bed rent', 'Service Charge',
    'Obstetrician/ Midwife', 'Anaesthetist', 'Assistant_1', 'Assistant_2', 'Medicine', 'Stuff_cost', 'Surgeon', 'Discharge writing fee',
    'OT Charge', '02(Oxygen)', 'Nebulization', 'Doctor food', 'Doctor donation', 'Vehicle rent', 'Dressing', 'Maintenance fee', 'Other'
];
const doctorServiceTypes = [
    "Doctor round fee", "Doctor prescription fee", "Obstetrician/ Midwife", "Surgeon", "Anaesthetist", "Assistant_1", "Assistant_2"
];

const clinicFundServiceTypes = ['Admission Fee', 'OT Charge', '02(Oxygen)', 'Nebulization', 'Dressing', 'Bed rent', 'Service Charge', 'Maintenance fee'];

const getFrequencyText = (freq: number) => {
    switch(freq) {
        case 6: return "1+1+1+1";
        case 8: return "1+1+1";
        case 12: return "1+0+1";
        case 24: return "1+0+0";
        case 0: return "Stat";
        default: return `${freq} Hourly`;
    }
};

// --- GENERIC MANAGER ---
const GenericManagerPage: React.FC<{
    title: string;
    placeholder: string;
    items: {id: string, name: string}[];
    setItems: React.Dispatch<React.SetStateAction<any[]>>;
    onClose: () => void;
    onSaveAndSelect: (id: string, name: string) => void;
}> = ({ title, placeholder, items, setItems, onClose, onSaveAndSelect }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); }, []);
    
    const handleSave = () => {
        if (!name.trim()) return;
        const newItem = { id: Date.now().toString(), name: name.trim() };
        setItems([...items, newItem]);
        onSaveAndSelect(newItem.id, newItem.name);
    };
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-[#1f2937] p-6 rounded-lg w-full max-w-md border border-gray-600 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                <input ref={inputRef} type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-[#374151] border border-gray-600 rounded text-white mb-6 focus:ring-2 focus:ring-blue-500" placeholder={placeholder}/>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
};

// --- CERTIFICATE MODAL ENGINE ---
const CertificateModal: React.FC<{
    type: 'discharge' | 'birth' | 'death' | 'referral';
    admissions: AdmissionRecord[];
    patients: Patient[];
    doctors: Doctor[];
    onClose: () => void;
}> = ({ type, admissions, patients, doctors, onClose }) => {
    const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
    const [selectedAdmissionId, setSelectedAdmissionId] = useState('');
    const [savedCerts, setSavedCerts] = useState<ClinicCertificate[]>(() => JSON.parse(localStorage.getItem(`ncd_certs_${type}`) || '[]'));
    
    // Form State
    const [certData, setCertData] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        details: {},
        note: '',
        issuedBy: ''
    });

    const selectedAdmission = admissions.find(a => a.admission_id === selectedAdmissionId);
    const selectedPatient = selectedAdmission ? patients.find(p => p.pt_id === selectedAdmission.patient_id) : null;

    useEffect(() => {
        if(selectedAdmission) {
            // Pre-fill defaults based on type
            if(type === 'birth') {
                setCertData((prev: any) => ({...prev, details: { ...prev.details, sex: selectedPatient?.gender === 'Female' ? 'Female' : 'Male', weight: '3.0kg', deliveryType: 'Normal' }}));
            } else if(type === 'death') {
                setCertData((prev: any) => ({...prev, details: { ...prev.details, cause: 'Cardiac Arrest', certBy: selectedAdmission.doctor_name }}));
            } else if(type === 'referral') {
                setCertData((prev: any) => ({...prev, details: { ...prev.details, refTo: 'Sirajgonj Sadar Hospital', reason: 'Advanced Management' }}));
            }
        }
    }, [selectedAdmissionId, type, selectedPatient]);

    const handleSave = () => {
        if(!selectedAdmissionId) return alert("প্রথমে পেশেন্ট সিলেক্ট করুন");
        const newCert: ClinicCertificate = {
            id: `CERT-${Date.now()}`,
            type,
            admissionId: selectedAdmissionId,
            patientName: selectedPatient?.pt_name || '',
            date: certData.date,
            time: certData.time,
            details: certData.details,
            note: certData.note,
            issuedBy: certData.issuedBy,
            createdDate: new Date().toISOString()
        };
        const updated = [newCert, ...savedCerts];
        setSavedCerts(updated);
        localStorage.setItem(`ncd_certs_${type}`, JSON.stringify(updated));
        alert("সার্টিফিকেট সফলভাবে সেভ করা হয়েছে!");
    };

    const deleteCert = (id: string) => {
        if(confirm("মুছে ফেলতে চান?")) {
            const updated = savedCerts.filter(c => c.id !== id);
            setSavedCerts(updated);
            localStorage.setItem(`ncd_certs_${type}`, JSON.stringify(updated));
        }
    };

    const handlePrint = (cert: any = null) => {
        const data = cert || {
            ...certData,
            patientName: selectedPatient?.pt_name,
            ptAge: selectedPatient?.ageY,
            ptSex: selectedPatient?.gender,
            ptId: selectedPatient?.pt_id,
            admId: selectedAdmission?.admission_id,
            admDate: selectedAdmission?.admission_date,
            consultant: selectedAdmission?.doctor_name,
            address: selectedPatient?.address,
            mobile: selectedPatient?.mobile
        };

        if(!data.patientName) return alert("প্রিন্ট করার মতো কোনো ডাটা নেই।");

        const win = window.open('', '_blank');
        if (!win) return;

        const title = type === 'birth' ? 'BIRTH CERTIFICATE' : type === 'death' ? 'DEATH CERTIFICATE' : type === 'discharge' ? 'DISCHARGE CERTIFICATE' : 'REFERRAL SLIP';

        const html = `
            <html>
                <head>
                    <title>${title} - ${data.patientName}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4; margin: 0; }
                        body { background: white; padding: 20mm; font-family: 'Times New Roman', serif; }
                        .pad-container { border: 2px solid #000; padding: 15mm; min-height: 260mm; position: relative; }
                        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 5mm; margin-bottom: 8mm; }
                        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80pt; color: rgba(0,0,0,0.03); font-weight: bold; pointer-events: none; white-space: nowrap; }
                    </style>
                </head>
                <body>
                    <div class="pad-container">
                        <div class="watermark">NCD CLINIC</div>
                        <div class="header">
                            <h1 class="text-4xl font-black uppercase text-blue-900">Niramoy Clinic & Diagnostic</h1>
                            <p class="text-sm font-bold">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                            <p class="text-[10px] uppercase font-bold text-slate-500 mt-1">Govt. Reg No: ${CLINIC_REGISTRATION}</p>
                        </div>

                        <div class="text-center mb-10">
                            <h2 class="inline-block border-2 border-black px-10 py-2 text-xl font-black uppercase tracking-widest bg-gray-50">${title}</h2>
                        </div>

                        <div class="space-y-6 text-lg">
                            <div class="grid grid-cols-2 gap-y-4">
                                <div><b>Patient Name:</b> ${data.patientName}</div>
                                <div><b>Patient ID:</b> ${data.ptId || data.patient_id || 'N/A'}</div>
                                <div><b>Age/Sex:</b> ${data.ptAge || '...'}Y / ${data.ptSex || '...'}</div>
                                <div><b>Admission ID:</b> ${data.admId || data.admissionId}</div>
                                <div><b>Admission Date:</b> ${data.admDate || '...'}</div>
                                <div><b>Mobile:</b> ${data.mobile || '...'}</div>
                            </div>
                            
                            <div class="border-t-2 border-black pt-6">
                                ${type === 'birth' ? `
                                    <p>This is to certify that a <b>${data.details.sex}</b> baby was born to the above patient on <b>${data.date}</b> at <b>${data.time}</b>.</p>
                                    <p class="mt-4"><b>Baby Weight:</b> ${data.details.weight}</p>
                                    <p><b>Delivery Mode:</b> ${data.details.deliveryType}</p>
                                ` : type === 'death' ? `
                                    <p>This is to certify that the above mentioned patient expired on <b>${data.date}</b> at <b>${data.time}</b> while under clinical management.</p>
                                    <p class="mt-4"><b>Cause of Death:</b> ${data.details.cause}</p>
                                    <p><b>Certified By:</b> ${data.details.certBy}</p>
                                ` : type === 'referral' ? `
                                    <p>The patient is being referred to <b>${data.details.refTo}</b> for further management.</p>
                                    <p class="mt-4"><b>Reason for Referral:</b> ${data.details.reason}</p>
                                ` : ''}
                            </div>

                            ${data.note ? `
                                <div class="mt-8">
                                    <h4 class="font-bold underline uppercase text-sm mb-2">Clinical Notes:</h4>
                                    <p class="italic text-base whitespace-pre-wrap">${data.note}</p>
                                </div>
                            ` : ''}
                        </div>

                        <div class="absolute bottom-20 left-15 right-15 flex justify-between px-10 w-full" style="left:0">
                            <div class="text-center">
                                <div class="w-40 border-t border-black mb-1"></div>
                                <p class="text-xs font-bold">Nursing Officer</p>
                            </div>
                            <div class="text-center">
                                <div class="w-60 border-t border-black mb-1"></div>
                                <p class="text-xs font-bold">Authorized Medical Officer</p>
                            </div>
                        </div>
                    </div>
                    <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 700); };</script>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
    };

    const inputClass = "w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:ring-1 focus:ring-blue-500 outline-none";
    const labelClass = "text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block";

    return (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><FileTextIcon className="w-6 h-6 text-white" /></div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{type.replace('_', ' ')} Records System</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">NCD Management Console</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
                        <button onClick={() => setActiveTab('generate')} className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>New Entry</button>
                        <button onClick={() => setActiveTab('saved')} className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all ${activeTab === 'saved' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>Saved Records ({savedCerts.length})</button>
                        <button onClick={onClose} className="ml-4 p-2 bg-rose-900/30 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all">&times;</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'generate' ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-inner">
                                <div>
                                    <label className={labelClass}>Select Target Admission</label>
                                    <select value={selectedAdmissionId} onChange={e=>setSelectedAdmissionId(e.target.value)} className={inputClass}>
                                        <option value="">-- Select Patient --</option>
                                        {admissions.map(a => <option key={a.admission_id} value={a.admission_id}>{a.patient_name} ({a.admission_id})</option>)}
                                    </select>
                                </div>
                                {selectedAdmissionId && (
                                    <div className="grid grid-cols-2 gap-4 animate-scale-in">
                                        <div><label className={labelClass}>Event Date</label><input type="date" value={certData.date} onChange={e=>setCertData({...certData, date: e.target.value})} className={inputClass} /></div>
                                        <div><label className={labelClass}>Event Time</label><input type="time" value={certData.time} onChange={e=>setCertData({...certData, time: e.target.value})} className={inputClass} /></div>
                                        
                                        {type === 'birth' && (
                                            <>
                                                <div><label className={labelClass}>Baby Sex</label><select value={certData.details.sex} onChange={e=>setCertData({...certData, details: {...certData.details, sex: e.target.value}})} className={inputClass}><option>Male</option><option>Female</option></select></div>
                                                <div><label className={labelClass}>Baby Weight</label><input value={certData.details.weight} onChange={e=>setCertData({...certData, details: {...certData.details, weight: e.target.value}})} className={inputClass} placeholder="e.g. 3.2kg" /></div>
                                                <div className="col-span-2"><label className={labelClass}>Delivery Mode</label><select value={certData.details.deliveryType} onChange={e=>setCertData({...certData, details: {...certData.details, deliveryType: e.target.value}})} className={inputClass}><option>Normal</option><option>LUCS / C-Section</option><option>Forceps</option></select></div>
                                            </>
                                        )}

                                        {type === 'death' && (
                                            <>
                                                <div className="col-span-2"><label className={labelClass}>Cause of Death</label><input value={certData.details.cause} onChange={e=>setCertData({...certData, details: {...certData.details, cause: e.target.value}})} className={inputClass} placeholder="e.g. Multi-organ failure" /></div>
                                                <div className="col-span-2"><label className={labelClass}>Certified By</label><input value={certData.details.certBy} onChange={e=>setCertData({...certData, details: {...certData.details, certBy: e.target.value}})} className={inputClass} /></div>
                                            </>
                                        )}

                                        <div className="col-span-2">
                                            <label className={labelClass}>Additional Notes / Remarks</label>
                                            <textarea value={certData.note} onChange={e=>setCertData({...certData, note: e.target.value})} className={`${inputClass} h-32 resize-none`} placeholder="Type any specific details or medical notes here..." />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {selectedAdmissionId && (
                                <div className="flex gap-4">
                                    <button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl text-white font-black uppercase text-xs shadow-xl transition-all flex items-center justify-center gap-2"><SaveIcon size={18}/> Save to Records</button>
                                    <button onClick={() => handlePrint()} className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-white font-black uppercase text-xs shadow-xl transition-all flex items-center justify-center gap-2"><PrinterIcon size={18}/> Save & Print Now</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            {savedCerts.map(cert => (
                                <div key={cert.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex justify-between items-center group hover:border-blue-500/50 transition-all shadow-xl">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-500 text-xs shadow-inner uppercase">{cert.date.split('-')[2]}<br/>{monthOptions[parseInt(cert.date.split('-')[1])-1].name.substring(0,3)}</div>
                                        <div>
                                            <h4 className="font-black text-white uppercase text-lg leading-none">{cert.patientName}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">ID: {cert.admissionId} | Issued: {new Date(cert.createdDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handlePrint(cert)} className="p-3 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg"><PrinterIcon size={18}/></button>
                                        <button onClick={() => deleteCert(cert.id)} className="p-3 bg-rose-600/20 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-lg"><TrashIcon size={18}/></button>
                                    </div>
                                </div>
                            ))}
                            {savedCerts.length === 0 && (
                                <div className="py-32 text-center opacity-10 flex flex-col items-center">
                                    <FileTextIcon size={120} />
                                    <p className="text-4xl font-black uppercase tracking-[0.3em] mt-6">No Records</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DischargeRxMasterModal: React.FC<{
    admissions: AdmissionRecord[];
    patients: Patient[];
    doctors: Doctor[];
    onClose: () => void;
}> = ({ admissions, patients, doctors, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filtered = useMemo(() => admissions.filter(a => 
        a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.admission_id.toLowerCase().includes(searchTerm.toLowerCase())
    ), [admissions, searchTerm]);

    const handlePrintFullSummary = (adm: AdmissionRecord) => {
        const win = window.open('', '_blank');
        if (!win) return;
        const styles = `
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: sans-serif; padding: 0; color: #000; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
                .pt-info { border: 1px solid #000; padding: 10px; margin-bottom: 20px; font-size: 13px; border-radius: 5px; }
                .section-title { background: #eee; padding: 5px 10px; font-weight: bold; margin-top: 20px; border-left: 5px solid #1e40af; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                th, td { border: 1px solid #999; padding: 6px; text-align: left; }
                th { background: #f0f0f0; }
            </style>
        `;
        const html = `
            <html><head>${styles}</head><body>
                <div class="header"><h1>Niramoy Clinic & Diagnostic</h1><p>Patient Treatment Summary / Discharge Master</p></div>
                <div class="pt-info">
                    <b>Patient:</b> ${adm.patient_name} | <b>ID:</b> ${adm.admission_id} | <b>Bed:</b> ${adm.bed_no || 'N/A'}<br>
                    <b>Doctor:</b> ${adm.doctor_name} | <b>Adm. Date:</b> ${adm.admission_date}<br>
                    <b>Status:</b> ${adm.discharge_date ? `Discharged on ${adm.discharge_date}` : 'Admitted'}
                </div>
                <div class="section-title">Clinical Orders (Prescribed)</div>
                <table>
                    <thead><tr><th>Time</th><th>Category</th><th>Details</th></tr></thead>
                    <tbody>${adm.clinical_orders.map(o=>`<tr><td>${o.date} ${o.time}</td><td>${o.category}</td><td>${o.medications.map(m=>`• ${m.type} ${m.name} (${m.dosage})`).join('<br>')}</td></tr>`).join('')}</tbody>
                </table>
                <div class="section-title">Doctor Round Notes</div>
                <table>
                    <thead><tr><th>Time</th><th>Note</th><th>Doctor</th></tr></thead>
                    <tbody>${adm.doctor_rounds.map(l=>`<tr><td>${l.time}</td><td>${l.note}</td><td>${l.by}</td></tr>`).join('')}</tbody>
                </table>
                <div class="section-title">Nurse Medication Chart</div>
                <table>
                    <thead><tr><th>Time</th><th>Activity/Medication</th><th>Nurse</th></tr></thead>
                    <tbody>${adm.nurse_chart.map(l=>`<tr><td>${l.time}</td><td>${l.note}</td><td>${l.by}</td></tr>`).join('')}</tbody>
                </table>
            </body></html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 700);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-600 p-2 rounded-xl shadow-lg"><ClipboardIcon className="w-6 h-6 text-white" /></div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Discharge & Rx Master</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inpatient Records Management</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-rose-900/30 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-lg">&times;</button>
                </div>
                
                <div className="p-6 bg-slate-900/50 border-b border-slate-800">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by Patient Name or Admission ID..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-inner font-bold"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map(adm => (
                            <div key={adm.admission_id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/50 transition-all flex justify-between items-center group shadow-xl">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-emerald-500 text-sm shadow-inner uppercase border border-slate-700">{adm.admission_id.split('-').pop()}</div>
                                    <div>
                                        <h4 className="font-black text-white uppercase text-lg leading-tight group-hover:text-emerald-400 transition-colors">{adm.patient_name}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Adm: {adm.admission_date} | Bed: {adm.bed_no || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePrintFullSummary(adm)} className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-inner hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"><PrinterIcon size={14}/> Full Record</button>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-40 text-center opacity-10 flex flex-col items-center">
                                <Activity size={120} />
                                <p className="text-4xl font-black uppercase tracking-[0.3em] mt-6">No Records Found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 1. Admission & Treatment
const AdmissionAndTreatmentPage: React.FC<{
    admissions: AdmissionRecord[];
    setAdmissions: React.Dispatch<React.SetStateAction<AdmissionRecord[]>>;
    patients: Patient[];
    doctors: Doctor[];
    referrars: Referrar[];
    employees: Employee[];
    medicines: Medicine[];
    setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
    indications: Indication[];
    setIndications: React.Dispatch<React.SetStateAction<Indication[]>>;
    services: ServiceItemDef[];
    setServices: React.Dispatch<React.SetStateAction<ServiceItemDef[]>>;
    setSuccessMessage: (msg: string) => void;
    setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
    setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
    setReferrars: React.Dispatch<React.SetStateAction<Referrar[]>>;
    drugDemands: RequestedDrug[];
    setDrugDemands: React.Dispatch<React.SetStateAction<RequestedDrug[]>>;
    admissionData: AdmissionRecord;
    setAdmissionData: React.Dispatch<React.SetStateAction<AdmissionRecord>>;
}> = ({ admissions, setAdmissions, patients, doctors, referrars, employees, medicines, setMedicines, indications, setIndications, services, setServices, setSuccessMessage, setPatients, setDoctors, setReferrars, drugDemands, setDrugDemands, admissionData, setAdmissionData }) => {
    
    const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(null);
    const [pageMode, setPageMode] = useState<'admission' | 'treatment'>('admission'); 
    const [activeSubTab, setActiveSubTab] = useState<'orders' | 'rounds' | 'nurse' | 'demands'>('orders');
    const [searchTerm, setSearchTerm] = useState('');

    const [currentOrder, setCurrentOrder] = useState<Partial<ClinicalOrderBlock>>({
        category: 'Conservative', diet: 'Regular', medications: [], note: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    const [editingOrderBlockId, setEditingOrderBlockId] = useState<string | null>(null);

    // Templates
    const [templates, setTemplates] = useState<TreatmentTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    const [newMedication, setNewMedication] = useState< Medication>({ id: 0, type: 'Tab', name: '', dosage: '', frequency: 8, category: 'Conservative' });
    const [selectedDrugId, setSelectedDrugId] = useState<string>('');

    const [showDrugDemandModal, setShowDrugDemandModal] = useState(false);
    const [newDrugEntry, setNewDrugEntry] = useState({ name: '', generic: '', type: 'Tab', strength: '' });

    const [roundTime, setRoundTime] = useState('');
    const [roundDoctor, setRoundDoctor] = useState('');
    const [newRoundNote, setNewRoundNote] = useState('');

    const [performingNurse, setPerformingNurse] = useState('');
    const [newNurseNote, setNewNurseNote] = useState('');
    
    // Tracks source selection for each med being administered in the Nurse Chart
    const [medicationSources, setMedicationSources] = useState<{[key: string]: 'Clinic' | 'Outside'}>({});
    
    const [showIndicationManager, setShowIndicationManager] = useState(false);
    const [showServiceManager, setShowServiceManager] = useState(false);
    const [showNewPatientForm, setShowNewPatientForm] = useState(false);
    const [showNewDoctorForm, setShowNewDoctorForm] = useState(false);
    const [showNewReferrarForm, setShowNewReferrarForm] = useState(false);

    useEffect(() => {
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 5);
        setRoundTime(timeStr);
        if(!currentOrder.time) setCurrentOrder((prev: any) => ({...prev, time: timeStr}));
        if(admissionData.doctor_name && !roundDoctor) setRoundDoctor(admissionData.doctor_name);
    }, [admissionData.doctor_name, currentOrder.time, roundDoctor]);

    const handleGetNewId = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const count = admissions.filter(a => a.admission_id.startsWith(`ADM-${year}-${month}-${day}`)).length + 1;
        const newId = `ADM-${year}-${month}-${day}-${String(count).padStart(3, '0')}`;
        setAdmissionData({ ...emptyAdmission, admission_id: newId, admission_date: `${year}-${month}-${day}` });
        setSelectedAdmissionId(null);
    };

    // SYNC FUNCTION: Propagates current admission record changes to the global admissions list
    const syncAdmissionToGlobal = (record: AdmissionRecord) => {
        setAdmissions((prev: AdmissionRecord[]) => {
            const idx = prev.findIndex((a: AdmissionRecord) => a.admission_id === record.admission_id);
            if(idx >= 0) { 
                const newArr = [...prev]; 
                newArr[idx] = record; 
                return newArr; 
            }
            return [...prev, record];
        });
    };

    const handleSaveAdmission = () => {
        if (!admissionData.admission_id) {
            alert("Please click 'Add New' to generate an Admission ID first.");
            return;
        }
        if (!admissionData.patient_id) {
            alert("Please select a Patient.");
            return;
        }
        syncAdmissionToGlobal(admissionData);
        setSuccessMessage("Admission data saved successfully!");
        setSelectedAdmissionId(admissionData.admission_id);
    };

    // --- PRINT FUNCTIONS ---

    const handlePrintAdmissionList = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const styles = `
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.4; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #1e40af; text-transform: uppercase; }
                .header p { margin: 2px 0; font-weight: bold; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background: #f3f4f6; font-weight: bold; text-transform: uppercase; }
                .report-title { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin-bottom: 10px; }
            </style>
        `;
        const html = `
            <html><head>${styles}</head><body>
                <div class="header">
                    <h1>Niramoy Clinic & Diagnostic</h1>
                    <p>Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                </div>
                <div class="report-title">Active Admitted Patients List</div>
                <table>
                    <thead><tr><th>ID</th><th>Date</th><th>Patient Name</th><th>Bed</th><th>Gender/Age</th><th>Doctor</th></tr></thead>
                    <tbody>
                        ${admissions.filter(a => !a.discharge_date).map(a => `
                            <tr>
                                <td>${a.admission_id}</td>
                                <td>${a.admission_date}</td>
                                <td><b>${a.patient_name}</b></td>
                                <td style="color: #b45309">${a.bed_no || 'N/A'}</td>
                                <td>${patients.find(p=>p.pt_id===a.patient_id)?.gender}, ${patients.find(p=>p.pt_id===a.patient_id)?.ageY}Y</td>
                                <td>${a.doctor_name}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body></html>
        `;
        win.document.write(html); win.document.close(); win.print();
    };

    const handlePrintTreatmentRecord = () => {
        if (!admissionData.admission_id) return alert("Select a patient first");
        const win = window.open('', '_blank');
        if (!win) return;
        const styles = `
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: sans-serif; padding: 0; color: #000; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
                .pt-info { border: 1px solid #000; padding: 10px; margin-bottom: 20px; font-size: 13px; border-radius: 5px; }
                .section-title { background: #eee; padding: 5px 10px; font-weight: bold; margin-top: 20px; border-left: 5px solid #1e40af; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                th, td { border: 1px solid #999; padding: 6px; text-align: left; }
                th { background: #f0f0f0; }
            </style>
        `;
        const html = `
            <html><head>${styles}</head><body>
                <div class="header"><h1>Niramoy Clinic & Diagnostic</h1><p>Patient Treatment Summary</p></div>
                <div class="pt-info">
                    <b>Patient:</b> ${admissionData.patient_name} | <b>ID:</b> ${admissionData.admission_id} | <b>Bed:</b> ${admissionData.bed_no || 'N/A'}<br>
                    <b>Doctor:</b> ${admissionData.doctor_name} | <b>Adm. Date:</b> ${admissionData.admission_date}
                </div>
                <div class="section-title">Clinical Orders (Prescribed)</div>
                <table>
                    <thead><tr><th>Time</th><th>Category</th><th>Details</th></tr></thead>
                    <tbody>${admissionData.clinical_orders.map(o=>`<tr><td>${o.date} ${o.time}</td><td>${o.category}</td><td>${o.medications.map(m=>`• ${m.type} ${m.name} (${m.dosage})`).join('<br>')}</td></tr>`).join('')}</tbody>
                </table>
                <div class="section-title">Nurse Medication Chart</div>
                <table>
                    <thead><tr><th>Time</th><th>Activity/Medication</th><th>Nurse</th></tr></thead>
                    <tbody>${admissionData.nurse_chart.map(l=>`<tr><td>${l.time}</td><td>${l.note}</td><td>${l.by}</td></tr>`).join('')}</tbody>
                </table>
            </body></html>
        `;
        win.document.write(html); win.document.close(); win.print();
    };

    const handleSelectPatientForTreatment = (admission: AdmissionRecord) => {
        setAdmissionData(admission);
        setSelectedAdmissionId(admission.admission_id);
        setPageMode('treatment');
    };

    const handleEditAdmissionInfo = (admission: AdmissionRecord) => {
        setAdmissionData(admission);
        setSelectedAdmissionId(admission.admission_id);
        setPageMode('admission');
        window.scrollTo(0, 0);
    };

    const handleMedicineSelect = (id: string, name: string) => {
        setSelectedDrugId(id);
        const drug = medicines.find(m => m.id === id);
        if (drug) {
            setNewMedication(prev => ({ 
                ...prev, 
                name: `${drug.tradeName} (${drug.genericName})`, 
                genericName: drug.genericName, 
                type: drug.formulation, 
                dosage: drug.strength,
                inventoryId: drug.id
            }));
        }
    };

    const addMedicationToDraft = () => {
        if (!newMedication.name) return;
        const med = { ...newMedication, id: Date.now(), category: currentOrder.category as any };
        setCurrentOrder(prev => ({ ...prev, medications: [...(prev.medications || []), med] }));
        setNewMedication({ id: 0, type: 'Tab', name: '', dosage: '', frequency: 8, category: currentOrder.category as any });
        setSelectedDrugId('');
    };

    const handleSaveOrderBlock = () => {
        if (!admissionData.admission_id) return alert("পেশেন্ট সিলেক্ট করুন");
        const block: ClinicalOrderBlock = {
            id: editingOrderBlockId || `OB-${Date.now()}`,
            date: currentOrder.date || new Date().toISOString().split('T')[0],
            time: currentOrder.time || new Date().toTimeString().slice(0, 5),
            category: currentOrder.category as any,
            diet: currentOrder.diet || 'Regular',
            medications: currentOrder.medications || [],
            note: currentOrder.note || ''
        };

        const updatedOrders = editingOrderBlockId 
            ? admissionData.clinical_orders.map(o => o.id === editingOrderBlockId ? block : o)
            : [block, ...admissionData.clinical_orders];

        const updatedAdm = { ...admissionData, clinical_orders: updatedOrders };
        setAdmissionData(updatedAdm);
        syncAdmissionToGlobal(updatedAdm);
        
        setCurrentOrder({
            category: 'Conservative', diet: 'Regular', medications: [], note: '',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5)
        });
        setEditingOrderBlockId(null);
        setSuccessMessage("Clinical order block saved!");
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg">
                <div className="flex gap-2">
                    <button onClick={() => setPageMode('admission')} className={`px-6 py-2 rounded-lg font-bold text-sm uppercase transition-all ${pageMode === 'admission' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Patient Admission</button>
                    <button onClick={() => setPageMode('treatment')} className={`px-6 py-2 rounded-lg font-bold text-sm uppercase transition-all ${pageMode === 'treatment' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Clinical Management</button>
                </div>
                {pageMode === 'treatment' && admissionData.admission_id && (
                    <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-emerald-500/30">
                        <Activity className="text-emerald-400 animate-pulse" size={18}/>
                        <span className="text-white font-black uppercase text-xs">{admissionData.patient_name} <span className="text-emerald-500 ml-2">({admissionData.admission_id})</span></span>
                    </div>
                )}
            </div>

            {pageMode === 'admission' ? (
                <div className="animate-fade-in space-y-8">
                    <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><ClinicIcon className="text-blue-400"/> New Patient Admission</h3>
                            <div className="flex gap-3">
                                <button onClick={handleGetNewId} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase transition-all">Add New</button>
                                <button onClick={handleSaveAdmission} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-2 rounded-xl font-black text-xs uppercase shadow-xl transition-all">Save Admission</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                             <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Adm ID</label><input value={admissionData.admission_id} disabled className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-blue-400 font-mono font-bold shadow-inner"/></div>
                             <div><SearchableSelect label="Select Patient" theme="dark" options={patients.map(p=>({id: p.pt_id, name: p.pt_name, details: `${p.gender}, ${p.ageY}Y`}))} value={admissionData.patient_id} onChange={(id, name)=>setAdmissionData({...admissionData, patient_id: id, patient_name: name})} onAddNew={()=>setShowNewPatientForm(true)} /></div>
                             <div><SearchableSelect label="Consultant / MO" theme="dark" options={doctors.map(d=>({id: d.doctor_id, name: d.doctor_name, details: d.degree}))} value={admissionData.doctor_id} onChange={(id, name)=>setAdmissionData({...admissionData, doctor_id: id, doctor_name: name})} onAddNew={()=>setShowNewDoctorForm(true)} /></div>
                             <div><SearchableSelect label="Referrer / Agent" theme="dark" options={referrars.map(r=>({id: r.ref_id, name: r.ref_name, details: r.ref_degrees}))} value={admissionData.referrer_id} onChange={(id, name)=>setAdmissionData({...admissionData, referrer_id: id, referrer_name: name})} onAddNew={()=>setShowNewReferrarForm(true)} /></div>
                             
                             <div><SearchableSelect label="Disease / Indication" theme="dark" options={indications.map(i=>({id: i.name, name: i.name}))} value={admissionData.indication} onChange={(id, name)=>setAdmissionData({...admissionData, indication: name})} onAddNew={()=>setShowIndicationManager(true)} /></div>
                             <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Bed No / Ward</label><input value={admissionData.bed_no || ''} onChange={e=>setAdmissionData({...admissionData, bed_no: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold" placeholder="e.g. Bed-01"/></div>
                             <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Contract Bill (৳)</label><input type="number" value={admissionData.contract_amount} onChange={e=>setAdmissionData({...admissionData, contract_amount: parseFloat(e.target.value)||0})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-black text-lg" onFocus={e=>e.target.select()}/></div>
                             <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Adm. Date</label><input type="date" value={admissionData.admission_date} onChange={e=>setAdmissionData({...admissionData, admission_date: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"/></div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Activity className="text-emerald-400"/> Current Admitted Patients</h3>
                            <button onClick={handlePrintAdmissionList} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-2"><PrinterIcon size={14}/> Print Active List</button>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-700">
                             <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-900 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-700">
                                    <tr><th className="p-5">Adm ID</th><th className="p-5">Patient Name</th><th className="p-5">Doctor</th><th className="p-5">Bed</th><th className="p-5">Indication</th><th className="p-5 text-center">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {admissions.filter(a => !a.discharge_date).map(adm => (
                                        <tr key={adm.admission_id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="p-5 font-mono text-xs text-blue-400 font-bold">{adm.admission_id}</td>
                                            <td className="p-5 font-black text-white uppercase">{adm.patient_name}</td>
                                            <td className="p-5 font-bold text-slate-300">{adm.doctor_name}</td>
                                            <td className="p-5 font-black text-amber-500">{adm.bed_no || 'N/A'}</td>
                                            <td className="p-5 text-slate-400 font-medium italic">{adm.indication}</td>
                                            <td className="p-5 text-center flex gap-2 justify-center">
                                                <button onClick={()=>handleSelectPatientForTreatment(adm)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-lg transition-all">Treatment</button>
                                                <button onClick={()=>handleEditAdmissionInfo(adm)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-lg transition-all">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {admissions.filter(a=>!a.discharge_date).length === 0 && <tr><td colSpan={6} className="p-20 text-center text-slate-600 italic font-black uppercase opacity-20 text-xl tracking-[0.2em]">No Active Inpatients</td></tr>}
                                </tbody>
                             </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in space-y-6">
                    <p className="text-slate-400 italic">Treatment management interface active for: {admissionData.patient_name}</p>
                    {/* Simplified management UI since content was truncated */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                             <h4 className="text-sm font-black text-white uppercase mb-4 border-b border-slate-700 pb-2">Clinical Order Draft</h4>
                             <div className="space-y-4">
                                <SearchableSelect label="Select Medicine" theme="dark" options={medicines.map(m=>({id: m.id, name: m.tradeName, details: m.genericName}))} value={selectedDrugId} onChange={handleMedicineSelect} />
                                <button onClick={addMedicationToDraft} className="w-full py-2 bg-emerald-600 rounded-xl font-bold">Add to List</button>
                                <div className="mt-4 p-4 bg-slate-900 rounded-xl min-h-[100px]">
                                    {currentOrder.medications?.map(m => (
                                        <div key={m.id} className="text-xs text-white flex justify-between items-center py-1 border-b border-slate-800">
                                            <span>{m.name}</span>
                                            <button onClick={() => setCurrentOrder(prev => ({...prev, medications: prev.medications?.filter(x => x.id !== m.id)}))} className="text-red-500 font-bold">×</button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleSaveOrderBlock} className="w-full py-4 bg-blue-600 rounded-2xl font-black uppercase text-xs shadow-xl">Post Full Order Block</button>
                             </div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                            <h4 className="text-sm font-black text-white uppercase mb-4 border-b border-slate-700 pb-2">Active Orders</h4>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {admissionData.clinical_orders.map(o => (
                                    <div key={o.id} className="p-4 bg-slate-900 rounded-xl border border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] text-blue-400 font-black">{o.date} {o.time}</span>
                                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{o.category}</span>
                                        </div>
                                        {o.medications.map(m => <div key={m.id} className="text-xs text-slate-200 ml-2">• {m.name}</div>)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 2. Indoor Invoice
const IndoorInvoicePage: React.FC<{ 
    admissions: AdmissionRecord[];
    doctors: Doctor[];
    referrars: Referrar[];
    employees: Employee[];
    indoorInvoices: IndoorInvoice[];
    setIndoorInvoices: React.Dispatch<React.SetStateAction<IndoorInvoice[]>>;
    setSuccessMessage: (msg: string) => void;
    medicines: Medicine[];
    setAdmissions: React.Dispatch<React.SetStateAction<AdmissionRecord[]>>;
    detailedExpenses: Record<string, ExpenseItem[]>;
}> = ({ admissions, doctors, referrars, employees, indoorInvoices, setIndoorInvoices, setSuccessMessage, medicines, setAdmissions, detailedExpenses }) => {
    const [formData, setFormData] = useState<IndoorInvoice>(emptyIndoorInvoice);
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRecord | null>(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [applyPC, setApplyPC] = useState(false); 
    const [subCategories, setSubCategories] = useState<{id: string, name: string}[]>(() => JSON.parse(localStorage.getItem('ncd_clinic_subcategories') || '[]'));
    const [showSubCategoryManager, setShowSubCategoryManager] = useState(false);
    
    // Persistent OT Details Library for Suggestions
    const [otDetailsLibrary, setOtDetailsLibrary] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('ncd_ot_details_library') || '{}'));

    useEffect(() => {
        localStorage.setItem('ncd_clinic_subcategories', JSON.stringify(subCategories));
    }, [subCategories]);

    useEffect(() => {
        localStorage.setItem('ncd_ot_details_library', JSON.stringify(otDetailsLibrary));
    }, [otDetailsLibrary]);

    const activeEmployees = useMemo(() => employees.filter(e => e.status === 'Active'), [employees]);

    // Calculate Stats - Updated with Return logic and Hospital Net Balance formula
    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentMonthStr = todayStr.substring(0, 7);
        const currentYearStr = now.getFullYear().toString();

        const calculateStatsForPeriod = (period: string, type: 'day' | 'month' | 'year') => {
            let totalBill = 0;
            let hospitalNet = 0;

            indoorInvoices.forEach(inv => {
                const isMatch = type === 'day' ? inv.invoice_date === period 
                              : type === 'month' ? inv.invoice_date.startsWith(period)
                              : inv.invoice_date.startsWith(period);

                if (isMatch && inv.status !== 'Cancelled') {
                    // Logic: Gain = Paid - NonFundedItems - PC
                    const nonFundedCost = inv.items
                        .filter(it => !it.isClinicFund)
                        .reduce((s, it) => s + it.payable_amount, 0);
                    
                    const pcAmount = inv.commission_paid || 0;
                    
                    if (inv.status !== 'Returned') {
                        totalBill += inv.total_bill;
                        hospitalNet += (inv.paid_amount - nonFundedCost - pcAmount);
                    }
                }
                
                // Subtract returned cash from today's/month's balance if returned in this period
                if (inv.status === 'Returned') {
                    const isReturnMatch = type === 'day' ? inv.return_date === period 
                                        : type === 'month' ? inv.return_date?.startsWith(period)
                                        : inv.return_date?.startsWith(period);
                    
                    if (isReturnMatch) {
                        const nonFundedCost = inv.items
                            .filter(it => !it.isClinicFund)
                            .reduce((s, it) => s + it.payable_amount, 0);
                        const pcAmount = inv.commission_paid || 0;
                        hospitalNet -= (inv.paid_amount - nonFundedCost - pcAmount);
                    }
                }
            });

            return { totalBill, hospitalNet };
        };

        const today = calculateStatsForPeriod(todayStr, 'day');
        const month = calculateStatsForPeriod(currentMonthStr, 'month');
        const year = calculateStatsForPeriod(currentYearStr, 'year');
        const totalDue = indoorInvoices.filter(i => i.status !== 'Returned' && i.status !== 'Cancelled').reduce((s, i) => s + i.due_bill, 0);

        return { today, month, year, totalDue };
    }, [indoorInvoices]);

    // FILTERED SUB-CATEGORIES BASED ON SELECTED MAIN CATEGORY
    const filteredSubCategories = useMemo(() => {
        if (formData.serviceCategory === 'Operation') {
            return [
                { id: 'lscs', name: 'LSCS_OT' },
                { id: 'gb', name: 'GB_OT' },
                { id: 'others_ot', name: 'Others_OT' }
            ];
        }
        if (formData.serviceCategory === 'NVD and D&C') {
            return [
                { id: 'nvd', name: 'NVD' },
                { id: 'dc', name: 'D&C' }
            ];
        }
        return subCategories;
    }, [formData.serviceCategory, subCategories]);

    const calculateTotals = (items: ServiceItem[], _discountAmt: number, paidAmt: number, specialDiscount: number) => {
        const newItems = items.map(item => ({ 
            ...item, 
            line_total: (item.service_charge || 0) * (item.quantity || 0), 
            payable_amount: ((item.service_charge || 0) * (item.quantity || 0)) - (item.discount || 0) 
        }));
        
        const total_bill = newItems.reduce((sum, item) => sum + item.line_total, 0);
        // FIX: Sum row discounts into total_discount
        const total_row_discount = newItems.reduce((sum, item) => sum + (item.discount || 0), 0);
        const payable_bill = total_bill - total_row_discount;
        const netPayable = payable_bill - (specialDiscount || 0);
        const due_bill = netPayable - (paidAmt || 0);
        
        return { items: newItems, total_bill, total_discount: total_row_discount, payable_bill, due_bill, net_payable: netPayable };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? parseFloat(value) || 0 : value;
        
        if (name === 'paid_amount' || name === 'special_discount_amount') {
            const paid = name === 'paid_amount' ? val as number : formData.paid_amount;
            const special = name === 'special_discount_amount' ? val as number : formData.special_discount_amount || 0;
            const totals = calculateTotals(formData.items, 0, paid, special);
            setFormData(prev => ({ ...prev, [name]: val, ...totals }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleGenerateId = () => {
        if (!selectedAdmission) return alert("Select Patient first.");
        const todayStr = new Date().toISOString().split('T')[0];
        const count = indoorInvoices.filter(i => i.invoice_date === todayStr).length + 1;
        const newId = `CLIN-${todayStr}-${String(count).padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, daily_id: newId, invoice_date: todayStr, admission_id: selectedAdmission.admission_id, patient_id: selectedAdmission.patient_id, patient_name: selectedAdmission.patient_name, status: 'Posted' }));
    };

    const handleServiceChange = (id: number, field: keyof ServiceItem, value: any) => {
        let updatedItems = formData.items.map(item => item.id === id ? { ...item, [field]: value } : item);
        
        if (field === 'service_type' && (value === 'Medicine' || value === 'medicine') && formData.admission_id) {
            const latestAdm = admissions.find(a => a.admission_id === formData.admission_id);
            if (latestAdm && latestAdm.nurse_chart) {
                let totalMedicineCost = 0;
                let supplyCount = 0;
                latestAdm.nurse_chart.forEach(log => {
                    if (log.supplySrc === 'Clinic') {
                        supplyCount++;
                        if (log.actualInventoryId) {
                            const inventoryItem = medicines.find(m => m.id === log.actualInventoryId);
                            if (inventoryItem) totalMedicineCost += inventoryItem.unitPriceSell;
                        }
                    }
                });
                const medicineItemIndex = updatedItems.findIndex(i => i.id === id);
                if (medicineItemIndex !== -1) {
                    updatedItems[medicineItemIndex].service_charge = totalMedicineCost;
                    updatedItems[medicineItemIndex].quantity = 1; 
                    updatedItems[medicineItemIndex].note = `Nurse Chart Analysis: ${supplyCount} Items Billed`;
                }
            }
        }

        if (field === 'service_type') {
            const isClinicFund = clinicFundServiceTypes.some(type => value.toLowerCase().includes(type.toLowerCase()));
            const rowIdx = updatedItems.findIndex(it => it.id === id);
            if (rowIdx !== -1) updatedItems[rowIdx].isClinicFund = isClinicFund;
        }

        const totals = calculateTotals(updatedItems, 0, formData.paid_amount, formData.special_discount_amount || 0);
        setFormData(prev => ({ ...prev, ...totals }));
    };

    const handleAddServiceItem = () => {
        const newItem: ServiceItem = { id: Date.now(), service_type: '', service_provider: '', service_charge: 0, quantity: 1, line_total: 0, discount: 0, payable_amount: 0, note: '', isClinicFund: false };
        const updatedItems = [...formData.items, newItem];
        const totals = calculateTotals(updatedItems, 0, formData.paid_amount, formData.special_discount_amount || 0);
        setFormData(prev => ({ ...prev, ...totals }));
    };
    
    const handleRemoveServiceItem = (id: number) => {
        const updatedItems = formData.items.filter(i => i.id !== id);
        const totals = calculateTotals(updatedItems, 0, formData.paid_amount, formData.special_discount_amount || 0);
        setFormData(prev => ({ ...prev, ...totals }));
    };

    const handleSaveInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.daily_id) return alert("Generate ID first");
        if (!formData.subCategory) {
            alert("সাব-ক্যাটাগরি লিস্ট (Sub_Category) এন্ট্রি করা বাধ্যতামূলক।");
            return;
        }

        if (formData.admission_id) {
            setAdmissions((prev: AdmissionRecord[]) => prev.map((adm: AdmissionRecord) => {
                if (adm.admission_id === formData.admission_id) {
                    const hasDischargeDate = !!formData.discharge_date;
                    return { 
                        ...adm, 
                        discharge_date: formData.discharge_date || undefined, 
                        bed_no: hasDischargeDate ? '' : (adm.bed_no || 'RE-ASSIGNED') 
                    };
                }
                return adm;
            }));
        }

        setIndoorInvoices((prev: IndoorInvoice[]) => {
            const idx = prev.findIndex((inv: IndoorInvoice) => inv.daily_id === formData.daily_id);
            if (idx >= 0) { const newArr = [...prev]; newArr[idx] = formData; return newArr; }
            return [...prev, formData];
        });
        setSuccessMessage("Indoor Invoice Saved!");
        setFormData(emptyIndoorInvoice);
        setSelectedAdmission(null);
    };

    const handleReturnInvoice = (inv: IndoorInvoice) => {
        if (inv.status === 'Returned') return alert("Already returned.");
        if (window.confirm(`আপনি কি এই ইনভয়েসের (${inv.daily_id}) টাকা রিটার্ন করতে চান? এটি আজকের ক্যাশ বক্স থেকে বাদ যাবে।`)) {
            const todayStr = new Date().toISOString().split('T')[0];
            setIndoorInvoices(prev => prev.map(item => item.daily_id === inv.daily_id ? { ...item, status: 'Returned', return_date: todayStr } : item));
            setSuccessMessage("Invoice Returned Successfully.");
        }
    };

    const handlePrintInvoice = (inv: IndoorInvoice) => {
        const win = window.open('', '_blank');
        if (!win) return;
        const styles = `
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: sans-serif; color: #333; line-height: 1.4; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 28px; color: #1e40af; }
                .inv-title { font-size: 18px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; text-align: center; }
                .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                th { background: #f3f4f6; font-weight: bold; }
                .total-section { margin-top: 20px; text-align: right; }
                .total-row { display: flex; justify-content: flex-end; gap: 50px; margin-bottom: 5px; font-weight: bold; }
                .signature-area { margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; }
            </style>
        `;
        const html = `
            <html><head>${styles}</head><body>
                <div class="header">
                    <h1>Niramoy Clinic & Diagnostic</h1>
                    <p>Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                    <p style="font-size: 10px; opacity: 0.7;">Govt. Reg No: ${CLINIC_REGISTRATION}</p>
                </div>
                <div class="inv-title">INPATIENT BILL / INVOICE ${inv.status === 'Returned' ? '(RETURNED)' : ''}</div>
                <div class="grid-info">
                    <div>
                        <b>Patient Name:</b> ${inv.patient_name}<br>
                        <b>Patient ID:</b> ${inv.patient_id}<br>
                        <b>Admission ID:</b> ${inv.admission_id}
                    </div>
                    <div style="text-align: right;">
                        <b>Invoice No:</b> ${inv.daily_id}<br>
                        <b>Billing Date:</b> ${inv.invoice_date}<br>
                        <b>Consultant:</b> ${inv.doctor_name || 'N/A'}
                    </div>
                </div>
                <table>
                    <thead><tr><th>Service Type</th><th>Provider</th><th>Charge</th><th>Qty</th><th>Total</th></tr></thead>
                    <tbody>
                        ${inv.items.map(it => `
                            <tr>
                                <td>${it.service_type}</td>
                                <td>${it.service_provider}</td>
                                <td>${it.service_charge.toFixed(2)}</td>
                                <td>${it.quantity}</td>
                                <td>${it.payable_amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total-section">
                    <div class="total-row"><span>Gross Total:</span> <span>৳${inv.total_bill.toFixed(2)}</span></div>
                    <div class="total-row"><span>Discount:</span> <span>৳${(inv.total_discount + (inv.special_discount_amount || 0)).toFixed(2)}</span></div>
                    <div class="total-row" style="font-size: 18px; color: #1e40af"><span>Net Payable:</span> <span>৳${(inv.net_payable || inv.payable_bill).toFixed(2)}</span></div>
                    <div class="total-row" style="color: green"><span>Paid Amount:</span> <span>৳${inv.paid_amount.toFixed(2)}</span></div>
                    <div class="total-row" style="color: red"><span>Due Balance:</span> <span>৳${inv.due_bill.toFixed(2)}</span></div>
                </div>
                ${inv.status === 'Returned' ? '<div style="color: red; text-align: center; border: 2px solid red; padding: 10px; margin-top: 20px; font-weight: bold; font-size: 16px;">RETURNED / REFUNDED</div>' : ''}
                <div class="signature-area">
                    <div style="border-top: 1px solid #000; width: 150px; text-align: center;">Accountant</div>
                    <div style="border-top: 1px solid #000; width: 150px; text-align: center;">Authorized Sign</div>
                </div>
            </body></html>
        `;
        win.document.write(html); win.document.close(); win.print();
    };

    const handleLoadInvoice = (inv: IndoorInvoice) => {
        setFormData(inv);
        setSelectedInvoiceId(inv.daily_id);
        const adm = admissions.find(a => a.admission_id === inv.admission_id);
        if (adm) setSelectedAdmission(adm);
    };

    const handleSaveAsTemplate = () => {
        if (!formData.subCategory) return alert("প্রথমে সাব-ক্যাটাগরি সিলেক্ট করুন।");
        if (!formData.ot_details) return alert("ডিটেইলস টেক্সটবক্সে কিছু লিখুন।");
        setOtDetailsLibrary(prev => ({ ...prev, [formData.subCategory!]: formData.ot_details || '' }));
        setSuccessMessage(`"${formData.subCategory}" এর ডিটেইলস লাইব্রেরিতে সেভ করা হয়েছে।`);
    };

    const handleLoadTemplate = () => {
        if (formData.subCategory && otDetailsLibrary[formData.subCategory]) {
            setFormData(prev => ({ ...prev, ot_details: otDetailsLibrary[prev.subCategory!] }));
        }
    };

    const commonInputClasses = "w-full p-2 bg-[#374151] border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500";

    const SummaryCard = ({ title, bill, net, color }: any) => (
        <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center shadow-lg transition-transform hover:scale-105">
            <h4 className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">{title}</h4>
            <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-500 text-[11px] font-bold">
                    <span>Total Bill:</span>
                    <span>৳{bill.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${color} text-lg font-black border-t border-slate-700 pt-1`}>
                    <span className="text-[10px] uppercase">Hospital Net:</span>
                    <span>৳{net.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <SummaryCard title="Today Hospital Cash" bill={stats.today.totalBill} net={stats.today.hospitalNet} color="text-green-400" />
                <SummaryCard title="Monthly Hospital Cash" bill={stats.month.totalBill} net={stats.month.hospitalNet} color="text-blue-400" />
                <SummaryCard title="Yearly Hospital Cash" bill={stats.year.totalBill} net={stats.year.hospitalNet} color="text-purple-400" />
                <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center shadow-lg flex flex-col justify-center">
                    <h4 className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Total Outstanding Due</h4>
                    <p className="text-2xl font-black text-rose-500">৳{stats.totalDue.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-[#20293a] p-6 rounded border border-[#374151]">
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Indoor Invoice</h3>
                <div className="flex gap-4 mb-6">
                    <select className="w-1/3 p-2 bg-[#2d2d55] border border-gray-600 rounded text-white" onChange={e => { const adm = admissions.find(a => a.admission_id === e.target.value); setSelectedAdmission(adm || null); if(adm) setFormData({...emptyIndoorInvoice, admission_id: adm.admission_id, patient_id: adm.patient_id, patient_name: adm.patient_name, admission_date: adm.admission_date, status: 'Posted'}); }} value={selectedAdmission?.admission_id || ''}> <option value="">Select Patient...</option>{admissions.map(a => <option key={a.admission_id} value={a.admission_id}>{a.patient_name} ({a.admission_id})</option>)} </select>
                    <button onClick={handleGenerateId} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold shadow transition-all">Generate ID</button>
                </div>
                {formData.daily_id && (
                    <form onSubmit={handleSaveInvoice} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#1f2937] p-4 rounded-xl border border-gray-600">
                            <div><label className="block text-xs text-gray-400">Invoice ID</label><input type="text" value={formData.daily_id} disabled className="w-full p-2 bg-[#1a202c] border border-gray-600 rounded text-gray-300"/></div>
                            <div><label className="block text-xs text-gray-400">Admission Date</label><input type="date" name="admission_date" value={formData.admission_date} onChange={handleInputChange} className="w-full p-2 bg-[#374151] border border-gray-600 rounded text-white"/></div>
                            <div><label className="block text-xs text-gray-400">Discharge Date</label><input type="date" name="discharge_date" value={formData.discharge_date} onChange={handleInputChange} className="w-full p-2 bg-[#374151] border border-gray-600 rounded text-white"/></div>
                            <div className="flex flex-col justify-center items-center bg-slate-800 rounded border border-slate-600 p-2">
                                <label className="block text-xs text-gray-400 mb-1">PC (Apply?)</label>
                                <div className="flex gap-2 items-center">
                                    <button type="button" onClick={() => setApplyPC(true)} className={`px-3 py-1 rounded text-xs font-bold ${applyPC ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-300'}`}>YES</button>
                                    <button type="button" onClick={() => { setApplyPC(false); setFormData(prev => ({ ...prev, special_commission: 0 })); }} className={`px-3 py-1 rounded text-xs font-bold ${!applyPC ? 'bg-red-600 text-white' : 'bg-slate-600 text-gray-300'}`}>NO</button>
                                    {applyPC && <input type="number" value={formData.special_commission} onChange={e => setFormData(prev => ({...prev, special_commission: parseFloat(e.target.value) || 0}))} className="w-20 p-1 bg-[#374151] border border-gray-600 rounded text-white text-xs" placeholder="Amount"/>}
                                </div>
                            </div>
                            <div><label className="block text-xs text-gray-400">Category</label><select name="serviceCategory" value={formData.serviceCategory} onChange={handleInputChange} className={commonInputClasses}>{serviceCategoriesList.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div>
                                <SearchableSelect 
                                    theme="dark" 
                                    label="Sub_Category" 
                                    options={filteredSubCategories.map(s => ({id: s.id, name: s.name}))} 
                                    value={filteredSubCategories.find(s => s.name === formData.subCategory)?.id || ''} 
                                    onChange={(_id, name) => setFormData(prev => ({...prev, subCategory: name}))} 
                                    onAddNew={() => setShowSubCategoryManager(true)}
                                    required={true}
                                    inputHeightClass="h-[38px] bg-[#374151] border-gray-600"
                                />
                            </div>
                            <div className="col-span-2"><label className="block text-xs text-gray-400">Referrer</label><select name="referrar_id" value={formData.referrar_id} onChange={(e) => { const ref = referrars.find(r => r.ref_id === e.target.value); setFormData({...formData, referrar_id: ref?.ref_id, referrar_name: ref?.ref_name}); }} className={commonInputClasses}><option value="">Select...</option>{referrars.map(r => <option key={r.ref_id} value={r.ref_id}>{r.ref_name}</option>)}</select></div>
                            
                            <div className="col-span-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileTextIcon size={14} /> OT Details & Clinical Notes
                                    </label>
                                    <div className="flex gap-2">
                                        {formData.subCategory && otDetailsLibrary[formData.subCategory] && (
                                            <button 
                                                type="button" 
                                                onClick={handleLoadTemplate}
                                                className="bg-amber-600/20 text-amber-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-amber-500/30 hover:bg-amber-600 hover:text-white transition-all animate-pulse"
                                            >
                                                Load Saved Template
                                            </button>
                                        )}
                                        <button 
                                            type="button" 
                                            onClick={handleSaveAsTemplate}
                                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-blue-500 transition-all flex items-center gap-2"
                                            title="Save current details as default for this category"
                                        >
                                            <SaveIcon size={12}/> Save as Default
                                        </button>
                                    </div>
                                </div>
                                <textarea 
                                    name="ot_details"
                                    value={formData.ot_details || ''}
                                    onChange={handleInputChange}
                                    className="w-full h-20 bg-[#111827] border border-slate-700 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none shadow-inner"
                                    placeholder="Enter OT report details, operation notes..."
                                />
                            </div>
                        </div>

                        <div className="bg-[#1f2937] p-4 rounded border border-gray-600">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-bold text-sky-300">Services</h4>
                                <button type="button" onClick={handleAddServiceItem} className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-500 font-bold shadow">+ Add Service Row</button>
                            </div>
                            <table className="w-full text-sm text-left text-gray-300 mb-2">
                                <thead className="bg-[#111827]"><tr><th className="p-2">Type</th><th className="p-2">Provider</th><th className="p-2">Charge</th><th className="p-2">Qty</th><th className="p-2">Disc</th><th className="p-2">Payable</th><th className="p-2 text-center">A/C</th><th className="p-2">Note</th><th className="p-2">X</th></tr></thead>
                                <tbody>{formData.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-1">
                                            <input list={`service_type_${item.id}`} value={item.service_type} onChange={e=>handleServiceChange(item.id,'service_type',e.target.value)} className="w-full bg-[#374151] text-white p-1 rounded h-8 text-xs" />
                                            <datalist id={`service_type_${item.id}`}>{serviceTypesList.map(t=><option key={t} value={t}/>)}</datalist>
                                        </td>
                                        <td className="p-1">
                                            <input list={`service_provider_${item.id}`} value={item.service_provider} onChange={e=>handleServiceChange(item.id,'service_provider',e.target.value)} className="w-full bg-[#374151] text-white p-1 rounded h-8 text-xs" />
                                            <datalist id={`service_provider_${item.id}`}>
                                                {item.service_type === 'Assistant_2' 
                                                    ? [...doctors.map(d => ({id: d.doctor_id, name: d.doctor_name})), ...activeEmployees.map(e => ({id: e.emp_id, name: e.emp_name}))].map(obj => <option key={obj.id} value={obj.name}/>)
                                                    : doctorServiceTypes.includes(item.service_type) 
                                                        ? doctors.map(d=><option key={d.doctor_id} value={d.doctor_name}/>) 
                                                        : activeEmployees.map(e=><option key={e.emp_id} value={e.emp_name}/>)
                                                }
                                            </datalist>
                                        </td>
                                        <td className="p-1"><input type="number" value={item.service_charge} onChange={e=>handleServiceChange(item.id,'service_charge',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-[#374151] text-white p-1 rounded text-right h-8"/></td>
                                        <td className="p-1"><input type="number" value={item.quantity} onChange={e=>handleServiceChange(item.id,'quantity',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-[#374151] text-white p-1 rounded text-right h-8"/></td>
                                        <td className="p-1"><input type="number" value={item.discount} onChange={e=>handleServiceChange(item.id,'discount',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-[#374151] text-white p-1 rounded text-right h-8"/></td>
                                        <td className="p-1 font-bold text-sky-300 text-right">{item.payable_amount.toFixed(2)}</td>
                                        <td className="p-1 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={item.isClinicFund} 
                                                onChange={e => {
                                                    const updated = formData.items.map(it => it.id === item.id ? { ...it, isClinicFund: e.target.checked } : it);
                                                    setFormData(prev => ({ ...prev, items: updated }));
                                                }}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                                            />
                                        </td>
                                        <td className="p-1"><input type="text" value={item.note} onChange={e=>handleServiceChange(item.id,'note',e.target.value)} className="w-full bg-[#374151] text-white p-1 rounded h-8 text-xs"/></td>
                                        <td className="p-1 text-center"><button type="button" onClick={()=>handleRemoveServiceItem(item.id)} className="text-red-500 font-bold hover:text-red-400">x</button></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        <div className="grid grid-cols-2 gap-6 bg-[#1f2937] p-4 rounded border border-gray-600">
                            <div className="space-y-2">
                                <div><label className="text-xs text-gray-400">Created By</label><select name="bill_created_by" value={formData.bill_created_by} onChange={handleInputChange} className="w-full bg-[#374151] border border-gray-600 rounded p-1 text-white"><option value="">Select</option>{activeEmployees.map(e => <option key={e.emp_id} value={e.emp_name}>{e.emp_name}</option>)}</select></div>
                                <div><label className="text-xs text-gray-400">Method</label><select name="payment_method" value={formData.payment_method} onChange={handleInputChange} className="w-full bg-[#374151] border border-gray-600 rounded p-1 text-white"><option>Cash</option><option>Card</option></select></div>
                            </div>
                            <div className="text-right space-y-2 text-sm font-medium">
                                <div className="flex justify-between items-center text-gray-300"><span>Total Bill:</span> <span className="font-bold text-white">{formData.total_bill.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center text-gray-300"><span>Total Discount:</span> <span className="font-bold text-white">{formData.total_discount.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center text-yellow-300"><span>Special Discount:</span> <input type="number" name="special_discount_amount" value={formData.special_discount_amount} onChange={handleInputChange} onFocus={e=>e.target.select()} className="bg-[#374151] text-white w-24 p-1 text-right font-bold border border-gray-600 rounded"/></div>
                                <div className="flex justify-between items-center text-blue-300 text-lg border-t border-gray-600 pt-1 mt-1"><span>Net Payable:</span> <span className="font-bold">{formData.net_payable ? formData.net_payable.toFixed(2) : '0.00'}</span></div>
                                <div className="flex justify-between items-center text-green-400"><span>Paid:</span> <input type="number" name="paid_amount" value={formData.paid_amount} onChange={handleInputChange} onFocus={e=>e.target.select()} className="bg-[#374151] text-white w-24 p-1 text-right font-bold border border-gray-600 rounded"/></div>
                                <div className="flex justify-between items-center text-red-400 font-bold text-lg"><span>Due:</span> <span>{formData.due_bill.toFixed(2)}</span></div>
                            </div>
                        </div>
                        <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">Save Invoice</button>
                    </form>
                )}

                {showSubCategoryManager && (
                    <GenericManagerPage 
                        title="Manage Sub_Categories" 
                        placeholder="Enter Sub_Category Name" 
                        items={subCategories} 
                        setItems={setSubCategories} 
                        onClose={() => setShowSubCategoryManager(false)} 
                        onSaveAndSelect={(_id, name) => {
                            setFormData(prev => ({...prev, subCategory: name}));
                            setShowSubCategoryManager(false);
                        }} 
                    />
                )}
                
                <div className="mt-8">
                    <h3 className="text-gray-400 font-bold mb-2">Saved Invoices</h3>
                    <div className="max-h-60 overflow-y-auto bg-[#111827] rounded border border-gray-700">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="bg-[#1f2937] text-gray-400 sticky top-0"><tr><th className="p-2">ID</th><th className="p-2">Date</th><th className="p-2">Patient</th><th className="p-2 text-right">Total</th><th className="p-2 text-right">Paid</th><th className="p-2 text-right">Due</th><th className="p-2 text-center">Action</th></tr></thead>
                            <tbody className="divide-y divide-gray-700">
                                {indoorInvoices.map(inv => (
                                    <tr key={inv.daily_id} onClick={() => handleLoadInvoice(inv)} className={`cursor-pointer hover:bg-gray-700 ${selectedInvoiceId === inv.daily_id ? 'bg-blue-900/30' : ''} ${inv.status === 'Returned' ? 'opacity-50 line-through' : ''}`}>
                                        <td className="p-2 font-mono text-xs">{inv.daily_id}</td><td className="p-2">{inv.invoice_date}</td><td className="p-2">{inv.patient_name}</td><td className="p-2 text-right">{inv.total_bill.toFixed(2)}</td><td className="p-2 text-right text-green-400">{inv.paid_amount.toFixed(2)}</td><td className="p-2 text-right text-red-400">{inv.due_bill.toFixed(2)}</td><td className="p-2 text-center space-x-2">
                                            <button onClick={(e) => { e.stopPropagation(); handlePrintInvoice(inv); }} className="text-sky-400 hover:text-white text-xs font-bold underline">Print</button>
                                            {inv.status !== 'Returned' && <button onClick={(e) => { e.stopPropagation(); handleReturnInvoice(inv); }} className="text-rose-400 hover:text-rose-600 text-xs font-bold underline">Return</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Clinic Due Collection
const ClinicDueCollectionPage: React.FC<{
    indoorInvoices: IndoorInvoice[];
    setIndoorInvoices: React.Dispatch<React.SetStateAction<IndoorInvoice[]>>;
    clinicDueCollections: ClinicDueCollection[];
    setClinicDueCollections: React.Dispatch<React.SetStateAction<ClinicDueCollection[]>>;
    employees: Employee[];
    setSuccessMessage: (msg: string) => void;
}> = ({ indoorInvoices, setIndoorInvoices, clinicDueCollections, setClinicDueCollections, employees, setSuccessMessage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<IndoorInvoice | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const dueInvoices = indoorInvoices.filter(inv => inv.status !== 'Returned' && inv.due_bill > 0.5 && inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const handlePrintReceipt = (invoice: IndoorInvoice, paidAmount: number) => {
        const win = window.open('', '_blank');
        if (!win) return;
        const styles = `<style>@page{size:A5 landscape; margin:10mm} body{font-family:sans-serif; text-align:center} .box{border:2px solid #000; padding:15px; border-radius:10px} .h1{font-size:20px; font-weight:bold; margin:0} table{width:100%; margin-top:10px; border-collapse:collapse} td{padding:5px; text-align:left}</style>`;
        const html = `<html><head>${styles}</head><body><div class="box">
            <div class="h1">Niramoy Clinic & Diagnostic</div>
            <p>Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
            <hr>
            <h3>PAYMENT RECEIPT (DUE RECOVERY)</h3>
            <table>
                <tr><td><b>Patient Name:</b> ${invoice.patient_name}</td><td><b>Date:</b> ${new Date().toLocaleDateString()}</td></tr>
                <tr><td><b>Invoice ID:</b> ${invoice.daily_id}</td><td><b>Receipt No:</b> REC-${Date.now().toString().slice(-5)}</td></tr>
                <tr><td><b>Amount Collected:</b></td><td style="font-size:18px; font-weight:bold">৳${paidAmount.toFixed(2)}</td></tr>
                <tr><td><b>Remaining Due:</b></td><td>৳${(invoice.due_bill - paidAmount).toFixed(2)}</td></tr>
            </table>
            <div style="margin-top:30px; text-align:right"><b>Authorized Sign</b><br>..........................</div>
        </div></body></html>`;
        win.document.write(html); win.document.close(); win.print();
    };

    const handleCollect = () => {
        if (!selectedInvoice || amount <= 0) return;
        const newCollection: ClinicDueCollection = { collection_id: Date.now().toString(), invoice_id: selectedInvoice.daily_id, patient_name: selectedInvoice.patient_name, collection_date: new Date().toISOString().split('T')[0], amount_collected: amount };
        const updatedInvoice = { ...selectedInvoice, paid_amount: selectedInvoice.paid_amount + amount, due_bill: selectedInvoice.due_bill - amount };
        setClinicDueCollections((prev: ClinicDueCollection[]) => [...prev, newCollection]);
        setIndoorInvoices((prev: IndoorInvoice[]) => prev.map((inv: IndoorInvoice) => inv.daily_id === updatedInvoice.daily_id ? updatedInvoice : inv));
        setSuccessMessage("Collected!");
        handlePrintReceipt(selectedInvoice, amount);
        setSelectedInvoice(null);
    };
    return (
        <div className="bg-[#20293a] p-6 rounded border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Due Collection</h3>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full p-2 bg-[#374151] border border-gray-600 rounded text-white mb-4"/>
            <table className="w-full text-sm text-left text-gray-300"><thead><tr><th className="p-2">ID</th><th className="p-2">Patient</th><th className="p-2">Due</th><th className="p-2">Action</th></tr></thead><tbody>{dueInvoices.map(inv => <tr key={inv.daily_id}><td className="p-2">{inv.daily_id}</td><td className="p-2">{inv.patient_name}</td><td className="p-2">{inv.due_bill}</td><td className="p-2"><button onClick={()=>{setSelectedInvoice(inv); setAmount(0);}} className="bg-green-600 px-2 py-1 rounded text-white">Collect</button></td></tr>)}</tbody></table>
            {selectedInvoice && ( <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50"><div className="bg-[#1f2937] p-6 rounded border border-gray-600 w-full max-w-sm shadow-2xl"><h3 className="text-white text-lg font-bold mb-4 border-b border-gray-600 pb-2">Collect Payment</h3><div className="mb-4 text-sm text-gray-300 space-y-1"><div>Patient: <span className="text-white font-bold">{selectedInvoice.patient_name}</span></div><div className="flex justify-between items-center bg-gray-800 p-2 rounded"><span>Current Due:</span> <span className="text-red-400 font-bold">{selectedInvoice.due_bill.toFixed(2)}</span></div></div><div className="mb-4"><label className="text-xs text-gray-400 block mb-1">Payment Amount</label><input type="number" value={amount} onChange={e=>setAmount(parseFloat(e.target.value))} className="w-full p-2 bg-[#374151] text-white border border-gray-600 rounded focus:ring-2 focus:ring-green-500" placeholder="Enter Amount"/></div><div className="mb-6 flex justify-between items-center text-sm font-bold border-t border-gray-700 pt-2"><span>Remaining Due:</span><span className={(selectedInvoice.due_bill - amount) > 0 ? "text-red-400" : "text-green-400"}>{(selectedInvoice.due_bill - amount).toFixed(2)}</span></div><div className="flex justify-end gap-2"><button onClick={()=>setSelectedInvoice(null)} className="text-gray-300 hover:text-white px-4 py-2">Cancel</button><button onClick={handleCollect} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-500">Confirm & Print</button></div></div></div> )}
        </div>
    );
};

// 4. Report Summary
const ReportSummaryPage: React.FC<{ 
    admissions: AdmissionRecord[]; 
    doctors: Doctor[]; 
    patients: Patient[]; 
    onOpenRxMaster: () => void;
}> = ({ admissions, doctors, patients, onOpenRxMaster }) => {
    const totalAdmissions = admissions.length;
    const activeAdmissions = admissions.filter(a => !a.discharge_date).length;
    const discharged = totalAdmissions - activeAdmissions;
    const [activeCertType, setActiveCertType] = useState<'discharge' | 'birth' | 'death' | 'referral' | null>(null);
    const doctorStats = doctors.map(doc => ({ name: doc.doctor_name, count: admissions.filter(a => a.doctor_id === doc.doctor_id).length })).filter(d => d.count > 0);
    const CertificateCard = ({ title, icon, color, onClick }: any) => (<div onClick={onClick} className={`bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-${color}-500 transition-all cursor-pointer group flex flex-col items-center justify-center h-32`}><div className={`p-3 rounded-full bg-${color}-900/50 text-${color}-400 mb-2 group-hover:scale-110 transition-transform`}>{icon}</div><span className="text-gray-300 font-bold text-sm text-center group-hover:text-white">{title}</span></div>);
    return (
        <div className="bg-[#1f2937] p-6 rounded border border-[#374151]">
            <h3 className="text-xl font-bold text-white mb-6">Report Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><div className="bg-slate-800 p-4 rounded text-center border border-slate-600"><h4 className="text-gray-400 text-sm uppercase">Total Admissions</h4><p className="text-3xl font-bold text-white">{totalAdmissions}</p></div><div className="bg-slate-800 p-4 rounded text-center border border-slate-600"><h4 className="text-gray-400 text-sm uppercase">Active Patients</h4><p className="text-3xl font-bold text-green-400">{activeAdmissions}</p></div><div className="bg-slate-800 p-4 rounded text-center border border-slate-600"><h4 className="text-gray-400 text-sm uppercase">Discharged</h4><p className="text-3xl font-bold text-blue-400">{discharged}</p></div></div>
            <h4 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Certificates & Templates</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <CertificateCard title="Discharge / Rx Master" icon={<ClipboardIcon className="w-6 h-6"/>} color="emerald" onClick={onOpenRxMaster} />
                <CertificateCard title="Discharge Certificate" icon={<ClipboardIcon className="w-6 h-6"/>} color="blue" onClick={() => setActiveCertType('discharge')} />
                <CertificateCard title="Baby Note / Birth Cert" icon={<FileTextIcon className="w-6 h-6"/>} color="pink" onClick={() => setActiveCertType('birth')} />
                <CertificateCard title="Death Certificate" icon={<FileTextIcon className="w-6 h-6"/>} color="red" onClick={() => setActiveCertType('death')} />
                <CertificateCard title="Referral Reports" icon={<UserPlusIcon className="w-6 h-6"/>} color="purple" onClick={() => setActiveCertType('referral')} />
            </div>
            <h4 className="text-lg font-bold text-white mb-4">Admissions by Doctor</h4>
            <div className="bg-[#111827] rounded border border-gray-700 overflow-hidden"><table className="w-full text-sm text-left text-gray-300"><thead className="bg-[#1f2937] text-gray-400"><tr><th className="p-3">Doctor Name</th><th className="p-3 text-right">Patient Count</th></tr></thead><tbody>{doctorStats.map((stat, idx) => (<tr key={idx} className="border-b border-gray-800"><td className="p-3">{stat.name}</td><td className="p-3 text-right font-bold text-white">{stat.count}</td></tr>))}{doctorStats.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-gray-500">No data available.</td></tr>}</tbody></table></div>
            {activeCertType && (<CertificateModal type={activeCertType} admissions={admissions} patients={patients} doctors={doctors} onClose={() => setActiveCertType(null)} />)}
        </div>
    );
};

// 5. Bed Management
const BedManagementPage: React.FC<{ admissions: AdmissionRecord[]; }> = ({ admissions }) => {
    const wards = [{ id: 'male_ward', name: 'Male Ward', beds: Array.from({length: 5}, (_, i) => `M-${String(i+1).padStart(2, '0')}`) }, { id: 'female_ward', name: 'Female Ward', beds: Array.from({length: 5}, (_, i) => `F-${String(i+1).padStart(2, '0')}`) }, { id: 'cabin', name: 'Cabins', beds: ['CAB-101', 'CAB-102', 'CAB-103', 'CAB-104', 'VIP-01'] }];
    const getBedStatus = (bedId: string) => admissions.find(a => a.bed_no === bedId && !a.discharge_date);

    const handlePrintBedMap = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const styles = `<style>@page{size:A4; margin:15mm} body{font-family:sans-serif} .header{text-align:center; border-bottom:2px solid #000; padding-bottom:10px} .ward{margin-top:20px; border:1px solid #ccc; border-radius:10px; padding:15px} .grid{display:grid; grid-template-columns:repeat(4,1fr); gap:10px} .bed{border:1px solid #000; padding:10px; font-size:10px} .occupied{background:#fecaca}</style>`;
        const html = `<html><head>${styles}</head><body>
            <div class="header"><h1>Niramoy Clinic & Diagnostic</h1><p>Inpatient Bed Occupancy Map - ${new Date().toLocaleDateString()}</p></div>
            ${wards.map(w => `
                <div class="ward">
                    <h3>${w.name}</h3>
                    <div class="grid">
                        ${w.beds.map(b => {
                            const adm = getBedStatus(b);
                            return `<div class="bed ${adm ? 'occupied' : ''}"><b>Bed: ${b}</b><br>${adm ? `Patient: ${adm.patient_name}<br>Dr: ${adm.doctor_name}` : 'AVAILABLE'}</div>`;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </body></html>`;
        win.document.write(html); win.document.close(); win.print();
    };

    return (
        <div className="bg-[#1f2937] p-6 rounded border border-[#374151]">
            <div className="flex justify-between items-center mb-6 border-gray-700 pb-2 border-b">
                <h3 className="text-xl font-bold text-white">Bed Management Status</h3>
                <button onClick={handlePrintBedMap} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2"><FileTextIcon className="w-4 h-4"/> Print Bed Map</button>
            </div>
            <div className="space-y-8">{wards.map(ward => (<div key={ward.id}><h4 className="text-lg font-semibold text-gray-300 mb-3 ml-1 border-l-4 border-blue-500 pl-2">{ward.name}</h4><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{ward.beds.map(bedId => { const admission = getBedStatus(bedId); const isOccupied = !!admission; return (<div key={bedId} className={`relative p-4 rounded-lg border-2 transition-all duration-200 flex flex-col justify-between h-28 ${isOccupied ? 'bg-red-900/20 border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-emerald-900/20 border-emerald-500/50 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-emerald-900/30'}`}><div className="flex justify-between items-start"><span className={`text-sm font-bold ${isOccupied ? 'text-red-400' : 'text-emerald-400'}`}>{bedId}</span>{isOccupied ? <UserPlusIcon className="w-4 h-4 text-red-400"/> : <Armchair className="w-4 h-4 text-emerald-400"/>}</div>{isOccupied ? (<div className="mt-2"><div className="text-xs text-white font-bold truncate" title={admission.patient_name}>{admission.patient_name}</div><div className="text-[10px] text-gray-400 truncate">ID: {admission.admission_id}</div></div>) : (<div className="mt-auto text-center"><span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">Available</span></div>)}</div>); })}</div></div>))}</div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
interface ClinicPageProps {
    onBack: () => void;
    patients: Patient[];
    setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
    doctors: Doctor[];
    setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
    referrars: Referrar[];
    setReferrars: React.Dispatch<React.SetStateAction<Referrar[]>>;
    employees: Employee[];
    medicines: Medicine[];
    setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
    admissions: AdmissionRecord[];
    setAdmissions: React.Dispatch<React.SetStateAction<AdmissionRecord[]>>;
    indoorInvoices: IndoorInvoice[];
    setIndoorInvoices: React.Dispatch<React.SetStateAction<IndoorInvoice[]>>;
    detailedExpenses: Record<string, ExpenseItem[]>;
}

const ClinicPage: React.FC<ClinicPageProps> = ({ 
    onBack, patients, setPatients, doctors, setDoctors, referrars, setReferrars, employees, medicines, setMedicines, admissions, setAdmissions, indoorInvoices, setIndoorInvoices, detailedExpenses 
}) => {
    const [activeTab, setActiveTab] = useState<'admission' | 'invoice' | 'due_collection' | 'report_summary' | 'bed_status' | 'patient_info'>('admission');
    const [clinicDueCollections, setClinicDueCollections] = useState<ClinicDueCollection[]>([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [drugDemands, setDrugDemands] = useState<RequestedDrug[]>([]);
    const [admissionFormData, setAdmissionFormData] = useState<AdmissionRecord>(emptyAdmission);
    const [indications, setIndications] = useState<Indication[]>([{ id: '1', name: 'Lower Abdominal Pain' }, { id: '2', name: 'Fever' }]);
    const [services, setServices] = useState<ServiceItemDef[]>([{ id: '1', name: 'C-Section' }, { id: '2', name: 'Appendicectomy' }]);
    
    // State for Discharge/Rx Master Modal
    const [showRxMaster, setShowRxMaster] = useState(false);

    useEffect(() => { if(successMessage) { const t = setTimeout(() => setSuccessMessage(''), 3000); return () => clearTimeout(t); } }, [successMessage]);

    return (
        <div className="bg-[#111827] min-h-screen text-gray-200 flex flex-col">
            <div className="bg-[#1f2937] border-b border-gray-700 shadow-lg z-10 sticky top-0">
                <div className="max-w-[1600px] mx-auto px-6 py-4 w-full"> 
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button onClick={onBack} className="p-2 bg-[#374151] rounded-full hover:bg-[#4b5563] transition-colors"><BackIcon className="w-5 h-5 text-gray-300" /></button>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Niramoy Clinic & Diagnostic</h1>
                                    <p className="text-xs text-gray-400 mt-1">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-[#111827] px-4 py-2 rounded-lg border border-gray-700">
                                <ClinicIcon className="w-6 h-6 text-emerald-400"/>
                                <div className="flex flex-col items-end">
                                    <h2 className="text-xl font-bold text-emerald-100 font-bengali leading-none">ক্লিনিক ডিপার্টমেন্ট</h2>
                                    <p className="text-[10px] font-bold text-slate-500 font-bengali tracking-tight mt-1">গভমেন্ট লাইসেন্স: HSM76710</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex bg-[#374151] rounded-lg p-1 overflow-x-auto w-full scrollbar-hide">
                            <button onClick={() => setActiveTab('admission')} className={`flex-1 min-w-[150px] px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'admission' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Admission & Treatment</button>
                            <button onClick={() => setActiveTab('patient_info')} className={`flex-1 min-w-[150px] px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'patient_info' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Patient Info</button>
                            <button onClick={() => setActiveTab('bed_status')} className={`flex-1 min-w-[150px] px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'bed_status' ? 'bg-teal-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Bed Status</button>
                            <button onClick={() => setActiveTab('invoice')} className={`flex-1 min-w-[150px] px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'invoice' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Indoor Invoice</button>
                            <button onClick={() => setActiveTab('due_collection')} className={`flex-1 min-w-[150px] px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'due_collection' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Due Collection</button>
                            <button onClick={() => setActiveTab('report_summary')} className={`flex-1 min-w-[150px] px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'report_summary' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Report Summary</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-[1600px] mx-auto p-6 w-full">
                    {successMessage && <div className="fixed top-20 right-5 bg-green-600 text-white px-6 py-3 rounded shadow-xl z-50 animate-bounce">{successMessage}</div>}
                    
                    <div className={activeTab === 'admission' ? 'block' : 'hidden'}>
                        <AdmissionAndTreatmentPage admissions={admissions} setAdmissions={setAdmissions} patients={patients} setPatients={setPatients} doctors={doctors} setDoctors={setDoctors} referrars={referrars} setReferrars={setReferrars} employees={employees} medicines={medicines} setMedicines={setMedicines} indications={indications} setIndications={setIndications} services={services} setServices={setServices} setSuccessMessage={setSuccessMessage} drugDemands={drugDemands} setDrugDemands={setDrugDemands} admissionData={admissionFormData} setAdmissionData={setAdmissionFormData} />
                    </div>

                    <div className={activeTab === 'patient_info' ? 'block' : 'hidden'}>
                        <div className="bg-[#1f2937] p-6 rounded-lg border border-[#374151]">
                            <PatientInfoPage patients={patients} setPatients={setPatients} isEmbedded={false} />
                        </div>
                    </div>

                    <div className={activeTab === 'bed_status' ? 'block' : 'hidden'}>
                        <BedManagementPage admissions={admissions} />
                    </div>

                    <div className={activeTab === 'invoice' ? 'block' : 'hidden'}>
                        <IndoorInvoicePage admissions={admissions} doctors={doctors} referrars={referrars} employees={employees} indoorInvoices={indoorInvoices} setIndoorInvoices={setIndoorInvoices} setSuccessMessage={setSuccessMessage} medicines={medicines} setAdmissions={setAdmissions} detailedExpenses={detailedExpenses} />
                    </div>

                    <div className={activeTab === 'due_collection' ? 'block' : 'hidden'}>
                        <ClinicDueCollectionPage indoorInvoices={indoorInvoices} setIndoorInvoices={setIndoorInvoices} clinicDueCollections={clinicDueCollections} setClinicDueCollections={setClinicDueCollections} employees={employees} setSuccessMessage={setSuccessMessage} />
                    </div>

                    <div className={activeTab === 'report_summary' ? 'block' : 'hidden'}>
                        <ReportSummaryPage admissions={admissions} doctors={doctors} patients={patients} onOpenRxMaster={() => setShowRxMaster(true)} />
                    </div>
                </div>
            </div>
            {showRxMaster && <DischargeRxMasterModal admissions={admissions} patients={patients} doctors={doctors} onClose={() => setShowRxMaster(false)} />}
        </div>
    );
};

export default ClinicPage;