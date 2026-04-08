
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Patient, Doctor, Employee, Medicine, Referrar, MedicineItem, ExpenseItem, InternalLabOrder } from './DiagnosticData';
import SearchableSelect from './SearchableSelect';
import PatientInfoPage from './PatientInfoPage';
import DoctorInfoPage from './DoctorInfoPage';
import ReferrerInfoPage from './ReferrerInfoPage';
import { BackIcon, ClinicIcon, StethoscopeIcon, ClipboardIcon, FileTextIcon, SettingsIcon, UserPlusIcon, Armchair, Activity, SaveIcon, MoneyIcon, TrashIcon, PrinterIcon, EyeIcon, SearchIcon, PlusIcon, RefreshIcon, Database as DatabaseIcon, Plus, Save, Trash2, Loader2, Trash2Icon } from './Icons';

// Fixed Clinic Config
const CLINIC_REGISTRATION = 'HSM76710';

// Clinic Expense Categories for net balance calculation
const clinicExpenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Clinic development', 
    'House rent', 'Stationery', 'Food/Refreshment', 
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
    lab_investigations: InternalLabOrder[];
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
    lab_investigations: [],
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
  patient_mobile?: string;
  patient_address?: string;
  patient_dob?: string;
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
  created_at?: string;
  edit_history?: any[];
}

const emptyIndoorInvoice: IndoorInvoice = {
  daily_id: '',
  monthly_id: '',
  yearly_id: '',
  invoice_date: new Date().toISOString().split('T')[0],
  admission_id: '',
  patient_id: '',
  patient_name: '',
  patient_mobile: '',
  patient_address: '',
  patient_dob: '',
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
  status: 'Posted',
  created_at: '',
  edit_history: []
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
    "Doctor round fee", "Doctor prescription fee", "Obstetrician/ Midwife", "Surgeon", "Anaesthetist", "Assistant_1", "Assistant_2", "Discharge writing fee"
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
    extraFields?: any;
}> = ({ title, placeholder, items, setItems, onClose, onSaveAndSelect, extraFields }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); }, []);
    
    const handleSave = () => {
        if (!name.trim()) return;
        const newItem = { id: new Date().getTime().toString(), name: name.trim(), ...extraFields };
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
    const [savedCerts, setSavedCerts] = useState<ClinicCertificate[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(`ncd_certs_${type}`) || '[]');
        } catch (e) {
            console.error("Error parsing saved certs", e);
            return [];
        }
    });
    
    // Form State
    const [certData, setCertData] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        details: {},
        note: '',
        issuedBy: ''
    });

    const selectedAdmission = (Array.isArray(admissions) ? admissions : []).find(a => a && a.admission_id === selectedAdmissionId);
    const selectedPatient = selectedAdmission ? patients.find(p => p.pt_id === selectedAdmission.patient_id) : null;

    useEffect(() => {
        if(selectedAdmission) {
            const timer = setTimeout(() => {
                // Pre-fill defaults based on type
                if(type === 'birth') {
                    setCertData((prev: any) => ({...prev, details: { ...prev.details, sex: selectedPatient?.gender === 'Female' ? 'Female' : 'Male', weight: '3.0kg', deliveryType: 'Normal' }}));
                } else if(type === 'death') {
                    setCertData((prev: any) => ({...prev, details: { ...prev.details, cause: 'Cardiac Arrest', certBy: selectedAdmission.doctor_name }}));
                } else if(type === 'referral') {
                    setCertData((prev: any) => ({...prev, details: { ...prev.details, refTo: 'Sirajgonj Sadar Hospital', reason: 'Advanced Management' }}));
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [selectedAdmissionId, type, selectedPatient, selectedAdmission]);

    const handleSave = () => {
        if(!selectedAdmissionId) return alert("প্রথমে পেশেন্ট সিলেক্ট করুন");
        const newCert: ClinicCertificate = {
            id: `CERT-${new Date().getTime()}`,
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

    const inputClass = "w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 font-bold text-sm focus:ring-1 focus:ring-blue-500 outline-none";
    const labelClass = "text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block";

    return (
        <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><FileTextIcon className="w-6 h-6 text-white" /></div>
                        <div>
                            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{type.replace('_', ' ')} Records System</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">NCD Management Console</p>
                        </div>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                        <button onClick={() => setActiveTab('generate')} className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-blue-600'}`}>New Entry</button>
                        <button onClick={() => setActiveTab('saved')} className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all ${activeTab === 'saved' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-emerald-600'}`}>Saved Records ({savedCerts.length})</button>
                        <button onClick={onClose} className="ml-4 p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">&times;</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                    {activeTab === 'generate' ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-6 shadow-inner">
                                <div>
                                    <label className={labelClass}>Select Target Admission</label>
                                    <select value={selectedAdmissionId} onChange={e=>setSelectedAdmissionId(e.target.value)} className={inputClass}>
                                        <option value="">-- Select Patient --</option>
                                        {(Array.isArray(admissions) ? admissions : []).map(a => a && <option key={a.admission_id} value={a.admission_id}>{a.patient_name} ({a.admission_id})</option>)}
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
                            {(Array.isArray(savedCerts) ? savedCerts : []).map(cert => cert && (
                                <div key={cert.id} className="bg-white p-6 rounded-3xl border border-gray-200 flex justify-between items-center group hover:border-blue-500/50 transition-all shadow-sm">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 text-xs shadow-inner uppercase">
                                            {cert.date?.split('-')[2] || ''}
                                            <br/>
                                            {cert.date?.split('-')[1] ? monthOptions[parseInt(cert.date.split('-')[1]) - 1]?.name?.substring(0, 3) : ''}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-800 uppercase text-lg leading-none">{cert.patientName}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">ID: {cert.admissionId} | Issued: {new Date(cert.createdDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handlePrint(cert)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><PrinterIcon size={18}/></button>
                                        <button onClick={() => deleteCert(cert.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><TrashIcon size={18}/></button>
                                    </div>
                                </div>
                            ))}
                            {(Array.isArray(savedCerts) ? savedCerts : []).length === 0 && (
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
    const [now] = useState(() => Date.now());
    const [searchTerm, setSearchTerm] = useState('');
    
    const filtered = useMemo(() => {
        const safeAdmissions = Array.isArray(admissions) ? admissions : [];
        return safeAdmissions.filter(a => a && (
            (a.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (a.admission_id || '').toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }, [admissions, searchTerm]);

    const handlePrintFullSummary = (adm: AdmissionRecord) => {
        if (!adm) return;
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
                    <b>Patient:</b> ${adm.patient_name || ''} | <b>ID:</b> ${adm.admission_id || ''} | <b>Bed:</b> ${adm.bed_no || 'N/A'}<br>
                    <b>Doctor:</b> ${adm.doctor_name || ''} | <b>Adm. Date:</b> ${adm.admission_date || ''}<br>
                    <b>Status:</b> ${adm.discharge_date ? `Discharged on ${adm.discharge_date}` : 'Admitted'}
                </div>
                <div class="section-title">Clinical Orders (Prescribed)</div>
                <table>
                    <thead><tr><th>Time</th><th>Category</th><th>Details</th></tr></thead>
                    <tbody>${(Array.isArray(adm.clinical_orders) ? adm.clinical_orders : []).map(o=> o && `<tr><td>${o.date || ''} ${o.time || ''}</td><td>${o.category || ''}</td><td>${(Array.isArray(o.medications) ? o.medications : []).map(m=> m && `• ${m.type || ''} ${m.name || ''} (${m.dosage || ''})`).join('<br>')}</td></tr>`).join('')}</tbody>
                </table>
                <div class="section-title">Doctor Round Notes</div>
                <table>
                    <thead><tr><th>Time</th><th>Note</th><th>Doctor</th></tr></thead>
                    <tbody>${(Array.isArray(adm.doctor_rounds) ? adm.doctor_rounds : []).map(l=> l && `<tr><td>${l.time || ''}</td><td>${l.note || ''}</td><td>${l.by || ''}</td></tr>`).join('')}</tbody>
                </table>
                <div class="section-title">Nurse Medication Chart</div>
                <table>
                    <thead><tr><th>Time</th><th>Activity/Medication</th><th>Nurse</th></tr></thead>
                    <tbody>${(Array.isArray(adm.nurse_chart) ? adm.nurse_chart : []).map(l=> l && `<tr><td>${l.time || ''}</td><td>${l.note || ''}</td><td>${l.by || ''}</td></tr>`).join('')}</tbody>
                </table>
            </body></html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 700);
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-600 p-2 rounded-xl shadow-lg"><ClipboardIcon className="w-6 h-6 text-white" /></div>
                        <div>
                            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Discharge & Rx Master</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Inpatient Records Management</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">&times;</button>
                </div>
                
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by Patient Name or Admission ID..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-4 py-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm font-bold"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map(adm => (
                            <div key={adm.admission_id} className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-emerald-500/50 transition-all flex justify-between items-center group shadow-sm">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-emerald-600 text-sm shadow-inner uppercase border border-gray-200">
                                        {adm.admission_id ? (adm.admission_id.split('-').pop() || '') : ''}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 uppercase text-lg leading-tight group-hover:text-emerald-600 transition-colors">{adm.patient_name}</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adm: {adm.admission_date} | Bed: {adm.bed_no || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePrintFullSummary(adm)} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-sm hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"><PrinterIcon size={14}/> Full Record</button>
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

    const filteredAdmissions = useMemo(() => {
        const safeAdmissions = Array.isArray(admissions) ? admissions : [];
        return safeAdmissions.filter(a => a && !a.discharge_date && (
            (a.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.admission_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.bed_no && a.bed_no.toLowerCase().includes(searchTerm.toLowerCase()))
        ));
    }, [admissions, searchTerm]);

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

    const handleGetNewId = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const safeAdmissions = Array.isArray(admissions) ? admissions : [];
        const count = safeAdmissions.filter(a => a && a.admission_id && a.admission_id.startsWith(`ADM-${year}-${month}-${day}`)).length + 1;
        const newId = `ADM-${year}-${month}-${day}-${String(count).padStart(3, '0')}`;
        setAdmissionData({ ...emptyAdmission, admission_id: newId, admission_date: `${year}-${month}-${day}` });
        setSelectedAdmissionId(null);
    };

    // SYNC FUNCTION: Propagates current admission record changes to the global admissions list
    const syncAdmissionToGlobal = (record: AdmissionRecord) => {
        setAdmissions((prev: AdmissionRecord[]) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const idx = safePrev.findIndex((a: AdmissionRecord) => a.admission_id === record.admission_id);
            if(idx >= 0) { 
                const newArr = [...safePrev]; 
                newArr[idx] = record; 
                return newArr; 
            }
            return [...safePrev, record];
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
                        ${(Array.isArray(admissions) ? admissions : []).filter(a => a && !a.discharge_date).map(a => {
                            const safePatients = Array.isArray(patients) ? patients : [];
                            const p = safePatients.find(pt => pt && pt.pt_id === a.patient_id);
                            return `
                            <tr>
                                <td>${a.admission_id || ''}</td>
                                <td>${a.admission_date || ''}</td>
                                <td><b>${a.patient_name || ''}</b></td>
                                <td style="color: #b45309">${a.bed_no || 'N/A'}</td>
                                <td>${p?.gender || ''}, ${p?.ageY || ''}Y</td>
                                <td>${a.doctor_name || ''}</td>
                            </tr>
                        `}).join('')}
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
                    <tbody>${(Array.isArray(admissionData.clinical_orders) ? admissionData.clinical_orders : []).map(o=> o && `<tr><td>${o.date || ''} ${o.time || ''}</td><td>${o.category || ''}</td><td>${(Array.isArray(o.medications) ? o.medications : []).map(m=> m && `• ${m.type || ''} ${m.name || ''} (${m.dosage || ''})`).join('<br>')}</td></tr>`).join('')}</tbody>
                </table>
                <div class="section-title">Nurse Medication Chart</div>
                <table>
                    <thead><tr><th>Time</th><th>Activity/Medication</th><th>Nurse</th></tr></thead>
                    <tbody>${(Array.isArray(admissionData.nurse_chart) ? admissionData.nurse_chart : []).map(l=> l && `<tr><td>${l.time || ''}</td><td>${l.note || ''}</td><td>${l.by || ''}</td></tr>`).join('')}</tbody>
                </table>
            </body></html>
        `;
        win.document.write(html); win.document.close(); win.print();
    };

    const handleSelectPatientForTreatment = (admission: AdmissionRecord) => {
        setAdmissionData(admission);
        setSelectedAdmissionId(admission.admission_id);
        setPageMode('treatment');
        
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 5);
        setRoundTime(timeStr);
        setRoundDoctor(admission.doctor_name || '');
        setCurrentOrder((prev: any) => ({...prev, time: timeStr}));
    };

    const handleEditAdmissionInfo = (admission: AdmissionRecord) => {
        setAdmissionData(admission);
        setSelectedAdmissionId(admission.admission_id);
        setPageMode('admission');
        window.scrollTo(0, 0);
    };

    const handleMedicineSelect = (id: string, name: string) => {
        setSelectedDrugId(id);
        const safeMedicines = Array.isArray(medicines) ? medicines : [];
        const drug = safeMedicines.find(m => m && m.id === id);
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

    const removeMedicationFromDraft = (id: number) => {
        setCurrentOrder(prev => ({ ...prev, medications: (Array.isArray(prev.medications) ? prev.medications : []).filter(m => m && m.id !== id) }));
    };

    const handleEditOrder = (block: ClinicalOrderBlock) => {
        setEditingOrderBlockId(block.id);
        setCurrentOrder({
            date: block.date,
            time: block.time,
            category: block.category,
            diet: block.diet,
            medications: block.medications,
            note: block.note
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveOrderBlock = () => {
        if (!currentOrder.date || !currentOrder.time) return alert("Date/Time required");
        if (!admissionData.admission_id) return alert("পেশেন্ট সিলেক্ট করুন");

        let updatedOrders = Array.isArray(admissionData.clinical_orders) ? [...admissionData.clinical_orders] : [];
        if (editingOrderBlockId) {
            updatedOrders = updatedOrders.map(order => order && order.id === editingOrderBlockId ? { ...order, ...currentOrder as ClinicalOrderBlock } : order);
        } else {
            const newBlock: ClinicalOrderBlock = { id: Date.now().toString(), ...currentOrder as ClinicalOrderBlock };
            updatedOrders = [newBlock, ...updatedOrders];
        }
        
        const updatedAdmission = { ...admissionData, clinical_orders: updatedOrders };
        setAdmissionData(updatedAdmission);
        syncAdmissionToGlobal(updatedAdmission); 
        
        setSuccessMessage(editingOrderBlockId ? "Order updated!" : "New order added!");
        setCurrentOrder({ category: 'Conservative', diet: 'Regular', medications: [], note: '', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) });
        setEditingOrderBlockId(null);
    };

    const handleSaveTemplate = () => {
        if (!newTemplateName) return alert("Enter template name");
        const newTemplate: TreatmentTemplate = {
            id: Date.now().toString(),
            name: newTemplateName,
            category: currentOrder.category as any,
            diet: currentOrder.diet || '',
            medications: currentOrder.medications || [],
            note: currentOrder.note || ''
        };
        setTemplates([...templates, newTemplate]);
        setNewTemplateName('');
        setShowTemplateModal(false);
        setSuccessMessage("Template Saved!");
    };

    const handleLoadTemplate = (t: TreatmentTemplate) => {
        const safeMeds = Array.isArray(t.medications) ? t.medications : [];
        const medsWithNewIds = safeMeds.map(m => ({
            ...m,
            id: Date.now() + Math.random() 
        }));

        setCurrentOrder(prev => ({
            ...prev,
            category: t.category,
            diet: t.diet,
            medications: medsWithNewIds,
            note: t.note
        }));
        setShowTemplateModal(false);
    };

    const handleSaveNewDrugEntry = () => {
        if(!newDrugEntry.name) return alert("Please enter drug name");
        
        setNewMedication(prev => ({
            ...prev,
            name: `${newDrugEntry.name} (${newDrugEntry.generic})`,
            genericName: newDrugEntry.generic,
            type: newDrugEntry.type,
            dosage: newDrugEntry.strength,
            inventoryId: undefined 
        }));

        const demand: RequestedDrug = {
            id: Date.now().toString(), name: newDrugEntry.name, type: newDrugEntry.type,
            strength: newDrugEntry.strength, genericName: newDrugEntry.generic,
            requestedBy: admissionData.doctor_name || 'Doctor', date: new Date().toISOString().split('T')[0], status: 'Pending'
        };
        setDrugDemands((prev: RequestedDrug[]) => [demand, ...prev]);

        setSuccessMessage("New drug added for prescription!");
        setShowDrugDemandModal(false);
        setNewDrugEntry({ name: '', generic: '', type: 'Tab', strength: '' });
    };

    const activeNurses = useMemo(() => {
        const safeEmployees = Array.isArray(employees) ? employees : [];
        return safeEmployees.filter(e => e && e.status === 'Active');
    }, [employees]);
    const commonInputClass = "w-full p-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:ring-1 focus:ring-blue-500";

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center shadow-2xl backdrop-blur-sm">
                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button onClick={() => setPageMode('admission')} className={`px-6 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${pageMode === 'admission' ? 'bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg shadow-blue-900/40 border border-blue-400/30' : 'text-slate-500 hover:text-blue-400 hover:bg-slate-900/50'}`}>Patient Admission</button>
                    <button onClick={() => setPageMode('treatment')} className={`px-6 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${pageMode === 'treatment' ? 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/30' : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-900/50'}`}>Clinical Management</button>
                </div>
                {pageMode === 'treatment' && admissionData.admission_id && (
                    <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-emerald-500/30 shadow-inner">
                        <Activity className="text-emerald-400 animate-pulse drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" size={18}/>
                        <span className="text-slate-300 font-black uppercase text-xs tracking-tighter">{admissionData.patient_name} <span className="text-emerald-400 ml-2 font-mono">({admissionData.admission_id})</span></span>
                    </div>
                )}
            </div>

            {pageMode === 'admission' ? (
                <div className="animate-fade-in space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><ClinicIcon className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"/> New Patient Admission</h3>
                            <div className="flex gap-3">
                                <button onClick={handleGetNewId} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-slate-700">Add New</button>
                                <button onClick={handleSaveAdmission} className="bg-gradient-to-br from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white px-10 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/40 transition-all border border-blue-400/30">Save Admission</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                             <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Adm ID</label><input value={admissionData.admission_id} disabled className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-blue-400 font-mono font-black shadow-inner outline-none"/></div>
                             <div><SearchableSelect label="Select Patient" theme="dark" options={(Array.isArray(patients) ? patients : []).filter(p => p).map(p=>({id: p.pt_id, name: p.pt_name, details: `${p.gender}, ${p.ageY}Y | Addr: ${p.address || 'N/A'}`}))} value={admissionData.patient_id} onChange={(id, name)=>setAdmissionData({...admissionData, patient_id: id, patient_name: name})} onAddNew={()=>setShowNewPatientForm(true)} /></div>
                             <div><SearchableSelect label="Consultant / MO" theme="dark" options={(Array.isArray(doctors) ? doctors : []).filter(d => d).map(d=>({id: d.doctor_id, name: d.doctor_name, details: d.degree}))} value={admissionData.doctor_id} onChange={(id, name)=>setAdmissionData({...admissionData, doctor_id: id, doctor_name: name})} onAddNew={()=>setShowNewDoctorForm(true)} /></div>
                             <div><SearchableSelect label="Referrer / Agent" theme="dark" options={(Array.isArray(referrars) ? referrars : []).filter(r => r).map(r=>({id: r.ref_id, name: r.ref_name, details: r.ref_degrees}))} value={admissionData.referrer_id} onChange={(id, name)=>setAdmissionData({...admissionData, referrer_id: id, referrer_name: name})} onAddNew={()=>setShowNewReferrarForm(true)} /></div>
                             
                             <div><SearchableSelect label="Disease / Indication" theme="dark" options={(Array.isArray(indications) ? indications : []).filter(i => i).map(i=>({id: i.id, name: i.name}))} value={(Array.isArray(indications) ? indications : []).find(i => i && i.name === admissionData.indication)?.id || ''} onChange={(_id, name)=>setAdmissionData({...admissionData, indication: name})} onAddNew={()=>setShowIndicationManager(true)} /></div>
                             <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Bed No / Ward</label>
                                <select 
                                    value={admissionData.bed_no || ''} 
                                    onChange={e=>setAdmissionData({...admissionData, bed_no: e.target.value})} 
                                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    <option value="" className="bg-slate-900">Select Bed...</option>
                                    <optgroup label="Male Ward" className="bg-slate-900 text-slate-400 font-bold">
                                        {Array.from({length: 5}, (_, i) => `M-${String(i+1).padStart(2, '0')}`).map(b => {
                                            const isOccupied = (Array.isArray(admissions) ? admissions : []).some(a => a && a.bed_no === b && !a.discharge_date);
                                            return <option key={b} value={b} disabled={isOccupied} className={`bg-slate-900 ${isOccupied ? 'text-rose-500' : 'text-slate-200'}`}>{b} {isOccupied ? '(OCCUPIED)' : ''}</option>;
                                        })}
                                    </optgroup>
                                    <optgroup label="Female Ward" className="bg-slate-900 text-slate-400 font-bold">
                                        {Array.from({length: 5}, (_, i) => `F-${String(i+1).padStart(2, '0')}`).map(b => {
                                            const isOccupied = (Array.isArray(admissions) ? admissions : []).some(a => a && a.bed_no === b && !a.discharge_date);
                                            return <option key={b} value={b} disabled={isOccupied} className={`bg-slate-900 ${isOccupied ? 'text-rose-500' : 'text-slate-200'}`}>{b} {isOccupied ? '(OCCUPIED)' : ''}</option>;
                                        })}
                                    </optgroup>
                                    <optgroup label="Cabins" className="bg-slate-900 text-slate-400 font-bold">
                                        {['CAB-101', 'CAB-102', 'CAB-103', 'CAB-104', 'VIP-01'].map(b => {
                                            const isOccupied = (Array.isArray(admissions) ? admissions : []).some(a => a && a.bed_no === b && !a.discharge_date);
                                            return <option key={b} value={b} disabled={isOccupied} className={`bg-slate-900 ${isOccupied ? 'text-rose-500' : 'text-slate-200'}`}>{b} {isOccupied ? '(OCCUPIED)' : ''}</option>;
                                        })}
                                    </optgroup>
                                </select>
                             </div>
                             <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Contract Bill (৳)</label><input type="number" value={admissionData.contract_amount} onChange={e=>setAdmissionData({...admissionData, contract_amount: parseFloat(e.target.value)||0})} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-black text-lg shadow-inner outline-none focus:ring-2 focus:ring-emerald-500 transition-all" onFocus={e=>e.target.select()}/></div>
                             <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Adm. Date</label><input type="date" value={admissionData.admission_date} onChange={e=>setAdmissionData({...admissionData, admission_date: e.target.value})} className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all"/></div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Activity className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"/> Current Admitted Patients</h3>
                            <div className="flex flex-1 max-w-md w-full relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search by Name, ID or Bed..." 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button onClick={handlePrintAdmissionList} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-700"><PrinterIcon size={14}/> Print Active List</button>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-inner bg-slate-950/50">
                             <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-950 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">
                                    <tr><th className="p-5 w-12 text-center">SL</th><th className="p-5">Adm ID</th><th className="p-5">Patient Name</th><th className="p-5">Doctor</th><th className="p-5">Bed</th><th className="p-5">Indication</th><th className="p-5 text-center">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {(Array.isArray(filteredAdmissions) ? filteredAdmissions : []).map((adm, index) => (
                                        <tr key={adm.admission_id} className="hover:bg-blue-900/20 transition-colors group">
                                            <td className="p-5 text-center text-slate-600 font-mono text-xs">{index + 1}</td>
                                            <td className="p-5 font-mono text-xs text-blue-400 font-black">{adm.admission_id}</td>
                                            <td className="p-5 font-black text-slate-200 uppercase tracking-tight group-hover:text-white transition-colors">{adm.patient_name}</td>
                                            <td className="p-5 font-bold text-slate-400">{adm.doctor_name}</td>
                                            <td className="p-5 font-black text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">{adm.bed_no || 'N/A'}</td>
                                            <td className="p-5 text-slate-500 font-medium italic">{adm.indication}</td>
                                            <td className="p-5 text-center flex gap-2 justify-center">
                                                <button onClick={()=>handleSelectPatientForTreatment(adm)} className="bg-gradient-to-br from-emerald-600 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/40 transition-all border border-emerald-400/30">Treatment</button>
                                                <button onClick={()=>handleEditAdmissionInfo(adm)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg transition-all border border-slate-700">Edit</button>
                                                <button onClick={()=>{
                                                    if(confirm(`Are you sure you want to CANCEL admission for ${adm.patient_name}? This will free the bed.`)) {
                                                        setAdmissions(prev => prev.filter(a => a.admission_id !== adm.admission_id));
                                                        setSuccessMessage("Admission cancelled successfully.");
                                                    }
                                                }} className="bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg transition-all border border-rose-500/30">Cancel</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(Array.isArray(filteredAdmissions) ? filteredAdmissions : []).length === 0 && <tr><td colSpan={7} className="p-20 text-center text-slate-700 italic font-black uppercase opacity-20 text-xl tracking-[0.3em]">{searchTerm ? "No Matching Patients" : "No Active Inpatients"}</td></tr>}
                                </tbody>
                             </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-900 p-5 rounded-2xl border border-blue-500/30 shadow-2xl mb-6 flex justify-between items-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            {admissionData.admission_id ? ( 
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Treating: <span className="text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{admissionData.patient_name}</span></h2>
                                    <p className="text-[10px] font-bold text-blue-100/70 uppercase tracking-[0.2em] mt-1">ID: <span className="font-mono text-white">{admissionData.admission_id}</span> | Dr: <span className="text-white">{admissionData.doctor_name}</span> | Bed: <span className="text-amber-400 font-black">{admissionData.bed_no || 'N/A'}</span></p>
                                </div> 
                            ) : ( 
                                <div className="text-cyan-200 font-black uppercase text-sm tracking-widest animate-pulse">Please select a patient from the Admission Section list first.</div> 
                            )}
                        </div>
                        {admissionData.admission_id && ( 
                            <div className="flex gap-4 items-center relative z-10">
                                <button onClick={handlePrintTreatmentRecord} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all border border-white/20 backdrop-blur-sm"><FileTextIcon className="w-5 h-5"/> Print Full Chart</button>
                                <div className="text-right border-l border-white/20 pl-4">
                                    <span className="block text-[9px] text-blue-200 uppercase font-black tracking-widest mb-1">Status</span>
                                    <span className="inline-block px-3 py-1 bg-emerald-500/80 text-white text-[10px] rounded-lg font-black uppercase tracking-tighter border border-emerald-400/30 shadow-lg shadow-emerald-900/40">Admitted</span>
                                </div> 
                            </div>
                        )}
                    </div>
                    {admissionData.admission_id && (
                        <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                            <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-8 overflow-x-auto scrollbar-hide">
                                {['orders', 'rounds', 'nurse', 'demands'].map(t => ( 
                                    <button 
                                        key={t} 
                                        onClick={() => setActiveSubTab(t as any)} 
                                        className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${activeSubTab === t ? 'bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg shadow-blue-900/40 border border-blue-400/30' : 'text-slate-500 hover:text-blue-400 hover:bg-slate-900/50'}`}
                                    > 
                                        {t === 'orders' ? 'Doctor Orders' : t === 'rounds' ? 'Doctor Round' : t === 'demands' ? 'Drug Demands' : 'Nurse Chart'} 
                                    </button> 
                                ))}
                            </div>
                            {activeSubTab === 'orders' && (
                                <div className="space-y-6">
                                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
                                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{editingOrderBlockId ? "Edit Treatment / Order" : "Add Treatment / Order"}</h4>
                                            <div className="flex gap-3">
                                                <button onClick={() => setShowTemplateModal(true)} className="text-[10px] bg-blue-600 px-4 py-2 rounded-xl text-white hover:bg-blue-500 font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 transition-all border border-blue-400/30">Templates</button>
                                                {editingOrderBlockId && <button onClick={() => { setEditingOrderBlockId(null); setCurrentOrder({ category: 'Conservative', diet: 'Regular', medications: [], note: '', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) }); }} className="text-[10px] text-rose-400 hover:text-rose-300 font-black uppercase tracking-widest transition-colors">Cancel Edit</button>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            <div><label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Date</label><input type="date" value={currentOrder.date} onChange={e=>setCurrentOrder({...currentOrder, date: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/></div>
                                            <div><label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Time</label><input type="time" value={currentOrder.time} onChange={e=>setCurrentOrder({...currentOrder, time: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/></div>
                                            <div><label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Category</label><select value={currentOrder.category} onChange={e=>setCurrentOrder({...currentOrder, category: e.target.value as any})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"><option value="Conservative" className="bg-slate-900">Conservative</option><option value="Pre-operative" className="bg-slate-900">Pre-operative</option><option value="Operative" className="bg-slate-900">Operative</option><option value="Post-operative" className="bg-slate-900">Post-operative</option></select></div>
                                            <div><label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-1 block tracking-widest">Diet</label><select value={currentOrder.diet} onChange={e=>setCurrentOrder({...currentOrder, diet: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all">{(Array.isArray(dietOptions) ? dietOptions : []).map(d=><option key={d} value={d} className="bg-slate-900">{d}</option>)}</select></div>
                                        </div>
                                        <div className="bg-slate-900 p-6 rounded-2xl mb-6 border border-slate-800 shadow-lg">
                                            <div className="flex flex-col md:flex-row gap-3 items-end">
                                                <div className="flex-1 relative w-full">
                                                    <SearchableSelect theme="dark" label="" options={(Array.isArray(medicines) ? medicines : []).map(m => m && ({ id: m.id, name: `${m.tradeName} (${m.genericName})` }))} value={selectedDrugId} onChange={handleMedicineSelect} placeholder="Search Drug..." inputHeightClass="h-12 bg-slate-950 border-slate-800" />
                                                    <button onClick={() => setShowDrugDemandModal(true)} className="absolute right-1.5 top-2.5 h-7 w-7 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-black flex items-center justify-center text-sm z-20 shadow-lg transition-all">+</button>
                                                </div>
                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <select value={newMedication.type} onChange={e=>setNewMedication({...newMedication, type:e.target.value})} className="h-12 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-[11px] font-black uppercase px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all">{(Array.isArray(drugTypes) ? drugTypes : []).map(t=><option key={t} value={t} className="bg-slate-900">{t}</option>)}</select>
                                                    <input value={newMedication.dosage} onChange={e=>setNewMedication({...newMedication, dosage:e.target.value})} placeholder="Dose" className="h-12 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-bold px-4 w-24 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"/>
                                                    <select value={newMedication.frequency} onChange={e=>setNewMedication({...newMedication, frequency:Number(e.target.value)})} className="h-12 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-[11px] font-black uppercase px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all">{(Array.isArray(drugFrequencies) ? drugFrequencies : []).map(f=> f && <option key={f.value} value={f.value} className="bg-slate-900">{f.label}</option>)}</select>
                                                    <button onClick={addMedicationToDraft} className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-xl font-black hover:from-blue-500 hover:to-indigo-700 shadow-lg shadow-blue-900/40 transition-all border border-blue-400/30">+</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-6 min-h-[100px] shadow-inner">
                                            {(Array.isArray(currentOrder.medications) ? currentOrder.medications : []).map((m, i) => m && (
                                                <div key={m.id} className="flex justify-between items-center text-sm text-slate-300 border-b border-slate-800/50 pb-3 mb-3 last:border-0 last:mb-0 group">
                                                    <span className="font-medium">
                                                        <span className="text-slate-600 font-mono text-xs mr-3">{String(i+1).padStart(2, '0')}.</span>
                                                        <b className="text-blue-400 uppercase tracking-tight">{m.type} {m.name}</b> 
                                                        <span className="text-slate-500 mx-2">({m.dosage})</span> 
                                                        <span className="mx-2 text-slate-700">---</span> 
                                                        <span className="text-amber-500 font-black text-[10px] uppercase tracking-widest">{getFrequencyText(m.frequency)}</span>
                                                    </span>
                                                    <button onClick={()=>removeMedicationFromDraft(m.id)} className="text-rose-500/50 hover:text-rose-400 p-2 transition-all opacity-0 group-hover:opacity-100"><TrashIcon size={16}/></button>
                                                </div>
                                            ))}
                                            {(!currentOrder.medications || currentOrder.medications.length === 0) && <p className="text-center text-slate-600 text-[10px] py-8 font-black uppercase tracking-[0.3em] opacity-40 italic">No medications added to draft yet...</p>}
                                        </div>
                                        <div className="mb-6"><textarea value={currentOrder.note} onChange={e=>setCurrentOrder({...currentOrder, note:e.target.value})} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-sm font-medium h-24 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700" placeholder="Add clinical notes or special instructions here..."/></div>
                                        <button onClick={handleSaveOrderBlock} className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all duration-300 border ${editingOrderBlockId ? 'bg-gradient-to-br from-amber-500 to-orange-700 text-white border-amber-400/30 shadow-amber-900/40' : 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-emerald-400/30 shadow-emerald-900/40'}`}>{editingOrderBlockId ? "Update Clinical Order" : "Save Clinical Order"}</button>
                                    </div>
                                    <div className="space-y-6">
                                        {(Array.isArray(admissionData.clinical_orders) ? admissionData.clinical_orders : []).map(block => (
                                            <div key={block.id} className={`bg-slate-900 border ${editingOrderBlockId === block.id ? 'border-amber-500 ring-4 ring-amber-500/20' : 'border-slate-800'} rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-500 hover:border-slate-700`}>
                                                <div className="bg-slate-950 p-4 flex justify-between items-center border-b border-slate-800">
                                                    <div className="flex gap-4 items-center">
                                                        <span className="text-blue-400 font-black font-mono text-xs tracking-tighter bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-500/20">{block.date} {block.time}</span>
                                                        <span className="text-[9px] bg-indigo-900/40 px-3 py-1 rounded-full text-indigo-300 font-black uppercase tracking-widest border border-indigo-500/20">{block.category}</span>
                                                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-900/20 px-3 py-1 rounded-lg border border-emerald-500/20">Diet: {block.diet}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEditOrder(block)} className="text-amber-400 text-[9px] font-black uppercase tracking-widest hover:text-amber-300 px-4 py-1.5 bg-amber-900/30 rounded-lg transition-all border border-amber-500/20">EDIT</button>
                                                        <button onClick={()=>{if(confirm("Delete?")) setAdmissionData((prev: AdmissionRecord)=>({...prev, clinical_orders: (Array.isArray(prev.clinical_orders) ? prev.clinical_orders : []).filter((o: ClinicalOrderBlock)=>o.id!==block.id)}))}} className="text-rose-400 text-[9px] font-black uppercase tracking-widest hover:text-rose-300 px-4 py-1.5 bg-rose-900/30 rounded-lg transition-all border border-rose-500/20">DEL</button>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    {(Array.isArray(block.medications) ? block.medications : []).map((m, i) => m && (
                                                        <div key={i} className="text-sm text-slate-300 flex items-center mb-3 last:mb-0 group">
                                                            <span className="w-8 text-slate-600 font-mono font-bold text-xs">{String(i+1).padStart(2, '0')}.</span>
                                                            <span className="font-black text-blue-400 uppercase tracking-tight group-hover:text-blue-300 transition-colors">{m.type} {m.name}</span>
                                                            <span className="text-slate-500 ml-3 text-xs font-bold">({m.dosage})</span>
                                                            <span className="mx-4 text-slate-800">|</span>
                                                            <span className="text-amber-500 font-black text-[9px] uppercase tracking-[0.2em] bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/10">{getFrequencyText(m.frequency)}</span>
                                                        </div>
                                                    ))}
                                                    {block.note && (
                                                        <div className="mt-5 pt-5 border-t border-slate-800/50 text-sm text-slate-400 italic leading-relaxed">
                                                            <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest mr-3 not-italic bg-slate-950 px-2 py-0.5 rounded border border-slate-800">NOTE:</span>
                                                            {block.note}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(Array.isArray(admissionData.clinical_orders) ? admissionData.clinical_orders : []).length === 0 && (
                                            <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-950/30">
                                                <p className="text-slate-700 font-black uppercase tracking-[0.4em] text-lg opacity-30">No Treatment Orders Yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {activeSubTab === 'rounds' && (
                                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
                                    <div className="flex flex-col md:flex-row gap-3 mb-8 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
                                        <div className="flex gap-2 flex-1">
                                            <input type="time" value={roundTime} onChange={e=>setRoundTime(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl text-slate-200 p-3 w-32 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                                            <div className="relative flex-1">
                                                <input list="doctor_list_round" type="text" value={roundDoctor} onChange={e=>setRoundDoctor(e.target.value)} placeholder="Doctor Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl text-slate-200 p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                                                <datalist id="doctor_list_round">{(Array.isArray(doctors) ? doctors : []).map(d=>d && <option key={d.doctor_id} value={d.doctor_name}/>)}</datalist>
                                            </div>
                                        </div>
                                        <input type="text" value={newRoundNote} onChange={e=>setNewRoundNote(e.target.value)} placeholder="Enter Round Note..." className="flex-[2] bg-slate-950 border border-slate-800 rounded-xl text-slate-200 p-3 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"/>
                                        <button onClick={()=>{if(!newRoundNote)return; const updated = {...admissionData, doctor_rounds:[...(Array.isArray(admissionData.doctor_rounds) ? admissionData.doctor_rounds : []), {id:Date.now(), date:new Date().toISOString().split('T')[0], time:roundTime, note:newRoundNote, by:roundDoctor}]}; setAdmissionData(updated); syncAdmissionToGlobal(updated); setNewRoundNote('');}} className="bg-gradient-to-br from-teal-600 to-emerald-800 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/40 border border-emerald-400/30 hover:from-teal-500 hover:to-emerald-700 transition-all">Add Round</button>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto bg-slate-950 rounded-2xl border border-slate-800 shadow-inner custom-scrollbar">
                                        <table className="w-full text-sm text-left text-slate-300 border-collapse">
                                            <thead className="bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Time</th>
                                                    <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Note</th>
                                                    <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">By</th>
                                                    <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50">
                                                {(Array.isArray(admissionData.doctor_rounds) ? admissionData.doctor_rounds : []).map(r=>r && (
                                                    <tr key={r.id} className="hover:bg-slate-900/50 transition-colors group">
                                                        <td className="p-4 font-mono text-xs text-blue-400 font-bold">{r.time}</td>
                                                        <td className="p-4 text-xs font-medium text-slate-300">{r.note}</td>
                                                        <td className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-wider bg-slate-900/30 rounded-lg inline-block my-2 mx-4">{r.by}</td>
                                                        <td className="p-4 text-right">
                                                            <button onClick={()=>{const updated = {...admissionData, doctor_rounds:(Array.isArray(admissionData.doctor_rounds) ? admissionData.doctor_rounds : []).filter(round=>round.id!==r.id)}; setAdmissionData(updated); syncAdmissionToGlobal(updated);}} className="text-rose-500/50 hover:text-rose-400 p-2 transition-all opacity-0 group-hover:opacity-100"><TrashIcon size={16}/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(Array.isArray(admissionData.doctor_rounds) ? admissionData.doctor_rounds : []).length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-12 text-center text-slate-700 font-black uppercase tracking-[0.3em] text-xs opacity-30">No doctor rounds recorded</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            
                            {activeSubTab === 'nurse' && (
                                <div className="space-y-8">
                                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
                                        <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg mb-8">
                                            <div className="w-full md:w-96">
                                                <SearchableSelect theme="dark" label="Select Performing Nurse (Logged)" options={(Array.isArray(activeNurses) ? activeNurses : []).map(nurse => nurse && ({ id: nurse.emp_name, name: nurse.emp_name, details: nurse.job_position }))} value={performingNurse} onChange={(_id, name) => setPerformingNurse(name)} onAddNew={() => {}} placeholder="Search Nurse..." inputHeightClass="h-12 bg-slate-950 border-slate-800" />
                                            </div>
                                            <div className="flex-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest italic opacity-50">
                                                * Please ensure the correct nurse is selected before logging medications.
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-400 mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                                            Scheduled Medications
                                        </h4>
                                        <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-2xl bg-slate-950/50">
                                            <table className="w-full text-sm text-left text-slate-300 border-collapse">
                                                <thead className="bg-slate-900 text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">
                                                    <tr>
                                                        <th className="p-5 border-b border-slate-800">Drug Details</th>
                                                        <th className="p-5 border-b border-slate-800">Frequency</th>
                                                        <th className="p-5 border-b border-slate-800">Category</th>
                                                        <th className="p-5 border-b border-slate-800">Last Given</th>
                                                        <th className="p-5 border-b border-slate-800">Next Dose Due</th>
                                                        <th className="p-5 border-b border-slate-800 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {(Array.isArray(admissionData.clinical_orders) ? admissionData.clinical_orders : []).flatMap(o => o && Array.isArray(o.medications) ? o.medications : []).map((med, idx) => {
                                                        if (!med) return null;
                                                        const logs = (Array.isArray(admissionData.nurse_chart) ? admissionData.nurse_chart : []).filter(l => l && l.medicationId === med.id).sort((a, b) => b.id - a.id);
                                                        const lastLog = logs[0];
                                                        let statusText = 'Not Started';
                                                        let nextTimeText = 'Start Now';
                                                        let lastGivenText = 'Never';
                                                        let lastGivenSrc = '';
                                                        let nextColorClass = 'text-rose-600 font-black';
                                                        let lastColorClass = 'text-gray-400';
 
                                                        const safeMedicines = Array.isArray(medicines) ? medicines : [];
                                                        const substituteMed = safeMedicines.find(m => 
                                                            m && med.genericName && m.genericName && 
                                                            m.genericName.toLowerCase() === med.genericName.toLowerCase() && 
                                                            m.stock > 0
                                                        );
                                                        
                                                        const autoSrc = substituteMed ? 'Clinic' : 'Outside';
                                                        const currentSrc = medicationSources[med.id] || autoSrc;
 
                                                        if (lastLog) {
                                                            lastGivenText = lastLog.time;
                                                            lastGivenSrc = lastLog.supplySrc === 'Outside' ? '(Outside)' : '(Clinic)';
                                                            lastColorClass = 'text-gray-600';
                                                            if (med.frequency === 0) {
                                                                statusText = 'Completed';
                                                                nextTimeText = '-';
                                                                nextColorClass = 'text-emerald-600';
                                                            } else {
                                                                const lastTimeMs = lastLog.id; 
                                                                const nextTimeMs = lastTimeMs + (med.frequency * 60 * 60 * 1000);
                                                                const nextDate = new Date(nextTimeMs);
                                                                const isOverdue = now > nextTimeMs;
                                                                nextTimeText = `Next: ${nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                                statusText = isOverdue ? 'On Schedule' : 'On Schedule';
                                                                nextColorClass = isOverdue ? 'text-rose-600 font-black' : 'text-emerald-600 font-bold';
                                                            }
                                                        }
 
                                                        return (
                                                            <tr key={`${med.id}-${idx}`} className="hover:bg-slate-900/80 transition-all group border-b border-slate-800/50">
                                                                <td className="p-5">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-blue-400 uppercase tracking-tight text-xs">{med.type}. {med.name}</span>
                                                                        <span className="text-[10px] text-slate-500 font-bold mt-1">Dose: {med.dosage}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-5">
                                                                    <span className="text-amber-500 font-black text-[9px] uppercase tracking-widest bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/10">
                                                                        {getFrequencyText(med.frequency)}
                                                                    </span>
                                                                </td>
                                                                <td className="p-5">
                                                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">{med.category}</span>
                                                                </td>
                                                                <td className="p-5">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${lastColorClass}`}>{statusText} ({lastGivenText})</span>
                                                                        <span className="text-[9px] text-amber-500/80 font-bold">{lastGivenSrc}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-5">
                                                                    <span className={`text-[10px] uppercase tracking-widest ${nextColorClass}`}>{nextTimeText}</span>
                                                                </td>
                                                                <td className="p-5 text-right">
                                                                    <div className="flex flex-col gap-2 items-end">
                                                                        <div className="flex gap-2 items-center">
                                                                            <select 
                                                                                value={currentSrc}
                                                                                onChange={(e) => setMedicationSources(prev => ({...prev, [med.id]: e.target.value as 'Clinic' | 'Outside'}))}
                                                                                className="bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-400 px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                                            >
                                                                                <option value="Clinic" className="bg-slate-900">Clinic Supply</option>
                                                                                <option value="Outside" className="bg-slate-900">Patient/Outside</option>
                                                                            </select>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    if(!performingNurse) return alert("Select Nurse First");
                                                                                    
                                                                                    if (lastLog && (Date.now() - lastLog.id < 120000)) {
                                                                                        if (!confirm("সতর্কতা: এই ঔষধটি মাত্র ২ মিনিট আগে দেওয়া হয়েছে। আপনি কি পুনরায় দিতে চান? (Medicine given < 2 mins ago. Proceed?)")) {
                                                                                            return;
                                                                                        }
                                                                                    }
                                                                
                                                                                    let finalInventoryId = med.inventoryId;
                                                                                    if (currentSrc === 'Clinic') {
                                                                                        if (substituteMed) {
                                                                                            finalInventoryId = substituteMed.id;
                                                                                            const updatedMedicines = (Array.isArray(medicines) ? medicines : []).map(m => m && 
                                                                                                m.id === substituteMed.id 
                                                                                                ? { ...m, stock: m.stock - 1 } 
                                                                                                : m
                                                                                            );
                                                                                            setMedicines(updatedMedicines);
                                                                                        } else {
                                                                                            return alert("Stock unavailable for Clinic Supply. Please switch to Outside.");
                                                                                        }
                                                                                    }
                                                                
                                                                                    const newLog: TreatmentLog = { 
                                                                                        id: Date.now(), 
                                                                                        date: new Date().toISOString().split('T')[0], 
                                                                                        time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), 
                                                                                        note: `Given: ${med.name}`, 
                                                                                        by: performingNurse, 
                                                                                        medicationId: med.id,
                                                                                        supplySrc: currentSrc,
                                                                                        actualInventoryId: finalInventoryId
                                                                                    };
                                                                                    const updated = {...admissionData, nurse_chart: [newLog, ...(Array.isArray(admissionData.nurse_chart) ? admissionData.nurse_chart : [])]};
                                                                                    setAdmissionData(updated);
                                                                                    syncAdmissionToGlobal(updated);
                                                                                }} 
                                                                                className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all border ${performingNurse ? 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-emerald-400/30 shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-700' : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-50'}`}
                                                                            >
                                                                                Give
                                                                            </button>
                                                                        </div>
                                                                        {substituteMed ? (
                                                                            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/10">
                                                                                Available: {substituteMed.tradeName} (Stock: {substituteMed.stock})
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[9px] text-rose-400 font-black uppercase tracking-tighter bg-rose-900/20 px-2 py-0.5 rounded border border-rose-500/10">Out of Stock</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {((Array.isArray(admissionData.clinical_orders) ? admissionData.clinical_orders : []).flatMap(o => o && Array.isArray(o.medications) ? o.medications : [])).length === 0 && <tr><td colSpan={6} className="p-20 text-center text-slate-700 font-black uppercase tracking-[0.4em] text-xs opacity-30">No medications ordered by doctor yet.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
                                        <div className="flex gap-3 mb-6 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
                                            <input 
                                                type="text" 
                                                value={newNurseNote} 
                                                onChange={e => setNewNurseNote(e.target.value)} 
                                                placeholder="Enter Nurse Note..." 
                                                className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner placeholder:text-slate-700"
                                            />
                                            <button 
                                                onClick={() => { 
                                                    if(!performingNurse) return alert("Select Nurse"); 
                                                    const updated = {
                                                        ...admissionData, 
                                                        nurse_chart: [
                                                            { 
                                                                id: Date.now(), 
                                                                date: new Date().toISOString().split('T')[0], 
                                                                time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), 
                                                                note: newNurseNote, 
                                                                by: performingNurse 
                                                            }, 
                                                            ...(Array.isArray(admissionData.nurse_chart) ? admissionData.nurse_chart : [])
                                                        ]
                                                    }; 
                                                    setAdmissionData(updated); 
                                                    syncAdmissionToGlobal(updated); 
                                                    setNewNurseNote('');
                                                }} 
                                                className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-900/40 border border-purple-400/30 hover:from-purple-500 hover:to-indigo-700 transition-all"
                                            >
                                                Log Note
                                            </button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto bg-slate-950 rounded-2xl border border-slate-800 shadow-inner custom-scrollbar">
                                            <table className="w-full text-sm text-left text-slate-300 border-collapse">
                                                <thead className="bg-slate-900 sticky top-0 z-10 backdrop-blur-md">
                                                    <tr>
                                                        <th className="p-4 text-[9px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Time</th>
                                                        <th className="p-4 text-[9px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Activity / Note</th>
                                                        <th className="p-4 text-[9px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Nurse</th>
                                                        <th className="p-4 text-[9px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {(Array.isArray(admissionData.nurse_chart) ? admissionData.nurse_chart : []).map(n=>n && (
                                                        <tr key={n.id} className="hover:bg-slate-900/50 transition-colors group">
                                                            <td className="p-4 font-mono text-[10px] text-blue-400 font-bold">{n.time}</td>
                                                            <td className="p-4 text-xs font-medium text-slate-300">{n.note}</td>
                                                            <td className="p-4">
                                                                <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-500/20">{n.by}</span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <button onClick={() => {if(confirm("Delete log?")) setAdmissionData((prev: AdmissionRecord) => ({...prev, nurse_chart: (Array.isArray(prev.nurse_chart) ? prev.nurse_chart : []).filter(l => l.id !== n.id)}))}} className="text-rose-500/50 hover:text-rose-400 p-2 transition-all opacity-0 group-hover:opacity-100"><TrashIcon size={16}/></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(Array.isArray(admissionData.nurse_chart) ? admissionData.nurse_chart : []).length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="p-12 text-center text-slate-700 font-black uppercase tracking-[0.3em] text-xs opacity-30">No activity logs recorded</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeSubTab === 'demands' && (
                                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
                                    <div className="flex justify-between items-center mb-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
                                        <div className="flex flex-col">
                                            <h4 className="text-xl font-black text-blue-400 uppercase tracking-tighter">Drug Demand List</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Pharmacy Requisition Tracking</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowDrugDemandModal(true)} 
                                            className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/40 border border-blue-400/30 hover:from-blue-500 hover:to-indigo-700 transition-all flex items-center gap-2"
                                        >
                                            <PlusIcon size={16}/> Add New Demand
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-inner bg-slate-950 custom-scrollbar">
                                        <table className="w-full text-sm text-left text-slate-300 border-collapse">
                                            <thead className="bg-slate-900 sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="p-4 text-[9px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Drug</th>
                                                    <th className="p-4 text-[9px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Generic</th>
                                                    <th className="p-4 text-[9px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Req By</th>
                                                    <th className="p-4 text-[9px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50">
                                                {(Array.isArray(drugDemands) ? drugDemands : []).map(req => req && (
                                                    <tr key={req.id} className="hover:bg-slate-900/50 transition-colors group">
                                                        <td className="p-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-200">{req.name}</span>
                                                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter mt-0.5">{req.type} {req.strength}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-xs font-medium text-slate-400 italic">{req.genericName}</td>
                                                        <td className="p-4">
                                                            <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-500/20">{req.requestedBy}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${req.status === 'Pending' ? 'bg-amber-900/20 text-amber-400 border-amber-500/20' : 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20'}`}>
                                                                {req.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(Array.isArray(drugDemands) ? drugDemands : []).length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-20 text-center text-slate-700 font-black uppercase tracking-[0.4em] text-xs opacity-30">No drug demands found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Components for Admission & Treatment */}
            {showIndicationManager && (
                <GenericManagerPage 
                    title="Manage Indication" 
                    placeholder="Enter Indication Name" 
                    items={indications} 
                    setItems={setIndications as any} 
                    onClose={()=>setShowIndicationManager(false)} 
                    onSaveAndSelect={(_id, name)=>{setAdmissionData((prev: AdmissionRecord)=>({...prev, indication:name})); setShowIndicationManager(false);}} 
                />
            )}
            {showServiceManager && (
                <GenericManagerPage 
                    title="Manage Services" 
                    placeholder="Enter Service Name" 
                    items={services} 
                    setItems={setServices as any} 
                    onClose={()=>setShowServiceManager(false)} 
                    onSaveAndSelect={(_id, name)=>{setAdmissionData((prev: AdmissionRecord)=>({...prev, service_name:name})); setShowServiceManager(false);}} 
                />
            )}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                        <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-3">
                            <span className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><LayoutIcon size={24}/></span>
                            Treatment Templates
                        </h3>
                        <div className="flex gap-3 mb-8">
                            <input 
                                value={newTemplateName} 
                                onChange={e=>setNewTemplateName(e.target.value)} 
                                placeholder="New Template Name..." 
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-200 placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            />
                            <button 
                                onClick={handleSaveTemplate} 
                                className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/40 border border-emerald-400/30 hover:from-emerald-500 hover:to-teal-700 transition-all"
                            >
                                Save Current
                            </button>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.3em]">Saved Templates</h4>
                        <div className="max-h-80 overflow-y-auto bg-slate-950 rounded-2xl border border-slate-800 p-2 custom-scrollbar">
                            {(Array.isArray(templates) ? templates : []).map(t => t && (
                                <div key={t.id} className="flex justify-between items-center p-4 hover:bg-slate-900 border-b border-slate-800/50 last:border-0 transition-all rounded-xl mb-1 group">
                                    <div onClick={() => handleLoadTemplate(t)} className="cursor-pointer flex-1">
                                        <div className="font-black text-blue-400 uppercase tracking-tight text-sm group-hover:text-blue-300 transition-colors">{t.name}</div>
                                        <div className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">{t.category} • {(Array.isArray(t.medications) ? t.medications : []).length} Medications</div>
                                    </div>
                                    <button 
                                        onClick={()=>{setTemplates((prev: TreatmentTemplate[])=>(Array.isArray(prev) ? prev : []).filter((x: TreatmentTemplate)=>x.id!==t.id))}} 
                                        className="text-slate-600 hover:text-rose-500 p-2 transition-colors bg-slate-900 rounded-lg border border-slate-800 hover:border-rose-500/30"
                                    >
                                        <Trash2Icon size={16}/>
                                    </button>
                                </div>
                            ))}
                            {(Array.isArray(templates) ? templates : []).length === 0 && (
                                <div className="text-center text-slate-700 p-12 font-black uppercase tracking-[0.3em] text-[10px] opacity-50 italic">No templates saved yet.</div>
                            )}
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button 
                                onClick={()=>setShowTemplateModal(false)} 
                                className="bg-slate-800 hover:bg-slate-750 text-slate-400 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-slate-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showDrugDemandModal && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl w-full max-w-md border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                        <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-3">
                            <span className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><PlusIcon size={24}/></span>
                            New Drug Demand
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1.5 block tracking-widest">Trade Name</label>
                                <input 
                                    value={newDrugEntry.name} 
                                    onChange={e=>setNewDrugEntry({...newDrugEntry, name:e.target.value})} 
                                    className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                                    placeholder="Enter Trade Name..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-black mb-1.5 block tracking-widest">Generic Name</label>
                                <input 
                                    value={newDrugEntry.generic} 
                                    onChange={e=>setNewDrugEntry({...newDrugEntry, generic:e.target.value})} 
                                    className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                                    placeholder="e.g. Paracetamol"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1.5 block tracking-widest">Type</label>
                                    <select 
                                        value={newDrugEntry.type} 
                                        onChange={e=>setNewDrugEntry({...newDrugEntry, type: e.target.value})} 
                                        className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium appearance-none"
                                    >
                                        {drugTypes.map(t=><option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1.5 block tracking-widest">Strength</label>
                                    <input 
                                        value={newDrugEntry.strength} 
                                        onChange={e=>setNewDrugEntry({...newDrugEntry, strength: e.target.value})} 
                                        className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                                        placeholder="500mg"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button 
                                onClick={()=>setShowDrugDemandModal(false)} 
                                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-400 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-slate-700"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveNewDrugEntry} 
                                className="flex-[2] bg-gradient-to-br from-blue-600 to-indigo-800 text-white px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/40 border border-blue-400/30 hover:from-blue-500 hover:to-indigo-700 transition-all"
                            >
                                Add Demand
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showNewPatientForm && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <PatientInfoPage 
                                patients={patients} 
                                setPatients={setPatients} 
                                isEmbedded={true} 
                                onClose={()=>setShowNewPatientForm(false)} 
                                onSaveAndSelect={(id,name)=>{
                                    setAdmissionData((prev: AdmissionRecord)=>({...prev, patient_id:id, patient_name:name})); 
                                    setShowNewPatientForm(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            {showNewDoctorForm && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <DoctorInfoPage 
                                doctors={doctors} 
                                setDoctors={setDoctors} 
                                isEmbedded={true} 
                                onClose={()=>setShowNewDoctorForm(false)} 
                                onSaveAndSelect={(id,name)=>{
                                    setAdmissionData((prev: AdmissionRecord)=>({...prev, doctor_id:id, doctor_name:name})); 
                                    setShowNewDoctorForm(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            {showNewReferrarForm && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"></div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <ReferrerInfoPage 
                                referrars={referrars} 
                                setReferrars={setReferrars} 
                                isEmbedded 
                                onClose={()=>setShowNewReferrarForm(false)} 
                                onSaveAndSelect={(id,name)=>{
                                    setAdmissionData((prev: AdmissionRecord)=>({...prev, referrer_id:id, referrer_name:name})); 
                                    setShowNewReferrarForm(false);
                                }}
                            />
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
    patients: Patient[];
}> = ({ admissions, doctors, referrars, employees, indoorInvoices, setIndoorInvoices, setSuccessMessage, medicines, setAdmissions, detailedExpenses, patients }) => {
    const [formData, setFormData] = useState<IndoorInvoice>(emptyIndoorInvoice);
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRecord | null>(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [applyPC, setApplyPC] = useState(false); 
    const [subCategories, setSubCategories] = useState<{id: string, name: string, mainCategory?: string}[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('ncd_clinic_subcategories') || '[]');
        } catch (e) {
            console.error("Error parsing subcategories", e);
            return [];
        }
    });
    const [showSubCategoryManager, setShowSubCategoryManager] = useState(false);
    
    // Persistent OT Details Library for Suggestions
    const [otDetailsLibrary, setOtDetailsLibrary] = useState<Record<string, string>>(() => {
        try {
            return JSON.parse(localStorage.getItem('ncd_ot_details_library') || '{}');
        } catch (e) {
            console.error("Error parsing OT details library", e);
            return {};
        }
    });
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableDateFilter, setTableDateFilter] = useState('');
    const [tableMonthFilter, setTableMonthFilter] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyInvoice, setHistoryInvoice] = useState<IndoorInvoice | null>(null);
    const [loading, setLoading] = useState(false);

    const filteredInvoices = useMemo(() => {
        const isDueSearch = tableSearchTerm.toLowerCase() === 'due';
        const safeInvoices = Array.isArray(indoorInvoices) ? indoorInvoices : [];
        const safePatients = Array.isArray(patients) ? patients : [];
        
        return safeInvoices.filter(inv => {
            if (!inv) return false;
            if (isDueSearch) {
                return (inv.due_bill || 0) > 0;
            }
            const p = safePatients.find(pt => pt && pt.pt_id === inv.patient_id);
            const matchesSearch = (inv.patient_name || '').toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
                (inv.daily_id || '').toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
                (inv.patient_id || '').toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
                (inv.indication || '').toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
                (p?.mobile || '').includes(tableSearchTerm) ||
                (p?.address || '').toLowerCase().includes(tableSearchTerm.toLowerCase());
            
            const matchesDate = !tableDateFilter || inv.invoice_date === tableDateFilter;
            const matchesMonth = !tableMonthFilter || (typeof inv.invoice_date === 'string' && inv.invoice_date.startsWith(tableMonthFilter));

            return matchesSearch && matchesDate && matchesMonth;
        });
    }, [indoorInvoices, tableSearchTerm, tableDateFilter, tableMonthFilter, patients]);

    const tableTotals = useMemo(() => {
        return filteredInvoices.reduce((acc, inv) => {
            acc.total += (inv.total_bill || 0);
            acc.paid += (inv.paid_amount || 0);
            acc.due += (inv.due_bill || 0);
            
            // Calculate Clinic Net for this invoice
            if (inv.status !== 'Cancelled') {
                const items = Array.isArray(inv.items) ? inv.items : [];
                const nonFundedCost = items
                    .filter(it => it && !it.isClinicFund)
                    .reduce((s, it) => s + (it.payable_amount || 0), 0);
                const pcAmount = (inv.special_commission || 0) + (inv.commission_paid || 0);
                
                if (inv.status === 'Returned') {
                    acc.net -= ((inv.paid_amount || 0) - nonFundedCost - pcAmount);
                } else {
                    acc.net += ((inv.paid_amount || 0) - nonFundedCost - pcAmount);
                }
            }
            
            return acc;
        }, { total: 0, paid: 0, due: 0, net: 0 });
    }, [filteredInvoices]);

    useEffect(() => {
        localStorage.setItem('ncd_clinic_subcategories', JSON.stringify(subCategories));
    }, [subCategories]);

    useEffect(() => {
        localStorage.setItem('ncd_ot_details_library', JSON.stringify(otDetailsLibrary));
    }, [otDetailsLibrary]);

    const activeEmployees = useMemo(() => (Array.isArray(employees) ? employees : []).filter(e => e && e.status === 'Active'), [employees]);

    // Calculate Stats - Updated with Return logic and Hospital Net Balance formula
    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentMonthStr = todayStr.substring(0, 7);
        const currentYearStr = now.getFullYear().toString();

        const calculateStatsForPeriod = (period: string, type: 'day' | 'month' | 'year') => {
            let totalBill = 0;
            let hospitalNet = 0;

            const safeInvoices = Array.isArray(indoorInvoices) ? indoorInvoices : [];
            safeInvoices.forEach(inv => {
                if (!inv) return;
                const dateToUse = inv.invoice_date || inv.admission_date;
                if (!dateToUse || typeof dateToUse !== 'string') return;

                const isMatch = type === 'day' ? dateToUse === period 
                              : type === 'month' ? dateToUse.startsWith(period)
                              : dateToUse.startsWith(period);

                if (isMatch && inv.status !== 'Cancelled') {
                    const items = Array.isArray(inv.items) ? inv.items : [];
                    const nonFundedCost = items
                        .filter(it => it && !it.isClinicFund)
                        .reduce((s, it) => s + (it.payable_amount || 0), 0);
                    
                    const pcAmount = (inv.special_commission || 0) + (inv.commission_paid || 0);
                    
                    if (inv.status !== 'Returned') {
                        totalBill += (inv.total_bill || 0);
                        hospitalNet += ((inv.paid_amount || 0) - nonFundedCost - pcAmount);
                    }
                }
                
                if (inv.status === 'Returned') {
                    const returnDate = inv.return_date;
                    const isReturnMatch = type === 'day' ? returnDate === period 
                                        : type === 'month' ? (typeof returnDate === 'string' && returnDate.startsWith(period))
                                        : (typeof returnDate === 'string' && returnDate.startsWith(period));
                    
                    if (isReturnMatch) {
                        const items = Array.isArray(inv.items) ? inv.items : [];
                        const nonFundedCost = items
                            .filter(it => it && !it.isClinicFund)
                            .reduce((s, it) => s + (it.payable_amount || 0), 0);
                        const pcAmount = (inv.special_commission || 0) + (inv.commission_paid || 0);
                        hospitalNet -= ((inv.paid_amount || 0) - nonFundedCost - pcAmount);
                    }
                }
            });

            return { totalBill, hospitalNet };
        };

        const today = calculateStatsForPeriod(todayStr, 'day');
        const month = calculateStatsForPeriod(currentMonthStr, 'month');
        const year = calculateStatsForPeriod(currentYearStr, 'year');
        const safeInvoices = Array.isArray(indoorInvoices) ? indoorInvoices : [];
        const totalDue = safeInvoices.filter(i => i && i.status !== 'Returned' && i.status !== 'Cancelled').reduce((s, i) => s + (i.due_bill || 0), 0);

        return { today, month, year, totalDue };
    }, [indoorInvoices]);

    // FILTERED SUB-CATEGORIES BASED ON SELECTED MAIN CATEGORY
    const filteredSubCategories = useMemo(() => {
        const safeSubCategories = Array.isArray(subCategories) ? subCategories : [];
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
        return safeSubCategories.filter(s => s && s.mainCategory === formData.serviceCategory);
    }, [formData.serviceCategory, subCategories]);

    const calculateTotals = (items: ServiceItem[], _discountAmt: number, paidAmt: number, specialDiscount: number) => {
        const safeItems = Array.isArray(items) ? items : [];
        const newItems = safeItems.map(item => {
            if (!item) return item;
            return { 
                ...item, 
                line_total: (item.service_charge || 0) * (item.quantity || 0), 
                payable_amount: ((item.service_charge || 0) * (item.quantity || 0)) - (item.discount || 0) 
            };
        }).filter(Boolean);
        
        const total_bill = newItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
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
        if (!selectedAdmission && !formData.patient_id) return alert("প্রথমে পেশেন্ট সিলেক্ট করুন।");
        
        const dateToUse = formData.invoice_date || new Date().toISOString().split('T')[0];
        const safeInvoices = Array.isArray(indoorInvoices) ? indoorInvoices : [];
        const count = safeInvoices.filter(i => i && i.invoice_date === dateToUse).length + 1;
        const newId = `CLIN-${dateToUse}-${String(count).padStart(3, '0')}`;
        
        const safePatients = Array.isArray(patients) ? patients : [];
        const patientIdToFind = selectedAdmission?.patient_id || formData.patient_id;
        const patient = safePatients.find(p => p && p.pt_id === patientIdToFind);

        const newInvoice: IndoorInvoice = {
            ...emptyIndoorInvoice,
            daily_id: newId,
            invoice_date: dateToUse,
            admission_id: selectedAdmission?.admission_id || '',
            patient_id: patient?.pt_id || formData.patient_id || '',
            patient_name: patient?.pt_name || formData.patient_name || '',
            referrar_id: selectedAdmission?.referrer_id || '',
            referrar_name: selectedAdmission?.referrer_name || '',
            doctor_id: selectedAdmission?.doctor_id || '',
            doctor_name: selectedAdmission?.doctor_name || '',
            indication: selectedAdmission?.indication || 'Outdoor Service',
            admission_date: selectedAdmission?.admission_date || '',
            patient_mobile: patient?.mobile || '',
            patient_address: patient?.address || '',
            patient_dob: patient ? `${patient.dobY || ''}-${patient.dobM || ''}-${patient.dobD || ''}` : '',
            status: 'Posted',
            items: [],
            services: [],
            total_bill: 0,
            total_discount: 0,
            paid_amount: 0,
            due_bill: 0,
            net_payable: 0,
            special_discount_amount: 0,
            bill_created_by: 'System',
            subCategory: '',
            edit_history: []
        };
        setFormData(newInvoice);
    };

    const handleNewVisit = () => {
        if (!formData.patient_id) return;
        const dateToUse = formData.invoice_date || new Date().toISOString().split('T')[0];
        const safeInvoices = Array.isArray(indoorInvoices) ? indoorInvoices : [];
        const count = safeInvoices.filter(i => i && i.invoice_date === dateToUse).length + 1;
        const newId = `CLIN-${dateToUse}-${String(count).padStart(3, '0')}`;
        
        setFormData(prev => ({
            ...emptyIndoorInvoice,
            daily_id: newId,
            invoice_date: dateToUse,
            patient_id: prev.patient_id,
            patient_name: prev.patient_name,
            admission_id: prev.admission_id,
            referrar_id: prev.referrar_id,
            referrar_name: prev.referrar_name,
            doctor_id: prev.doctor_id,
            doctor_name: prev.doctor_name,
            status: 'Posted'
        }));
        setSelectedInvoiceId(null);
    };

    const handleServiceChange = (id: number, field: keyof ServiceItem, value: any) => {
        const items = Array.isArray(formData.items) ? formData.items : [];
        const updatedItems = items.map(item => item && item.id === id ? { ...item, [field]: value } : item);
        
        if (field === 'service_type' && (value === 'Medicine' || value === 'medicine') && formData.admission_id) {
            const safeAdmissions = Array.isArray(admissions) ? admissions : [];
            const latestAdm = safeAdmissions.find(a => a.admission_id === formData.admission_id);
            if (latestAdm && Array.isArray(latestAdm.nurse_chart)) {
                let totalMedicineCost = 0;
                let supplyCount = 0;
                latestAdm.nurse_chart.forEach(log => {
                    if (log.supplySrc === 'Clinic') {
                        supplyCount++;
                        if (log.actualInventoryId) {
                            const safeMedicines = Array.isArray(medicines) ? medicines : [];
                            const inventoryItem = safeMedicines.find(m => m.id === log.actualInventoryId);
                            if (inventoryItem) totalMedicineCost += (inventoryItem.unitPriceSell || 0);
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

        const totals = calculateTotals(updatedItems, 0, formData.paid_amount || 0, formData.special_discount_amount || 0);
        setFormData(prev => ({ ...prev, ...totals }));
    };

    const handleAddServiceItem = () => {
        const items = Array.isArray(formData.items) ? formData.items : [];
        const newItem: ServiceItem = { id: Date.now(), service_type: '', service_provider: '', service_charge: 0, quantity: 1, line_total: 0, discount: 0, payable_amount: 0, note: '', isClinicFund: false };
        const updatedItems = [...items, newItem];
        const totals = calculateTotals(updatedItems, 0, formData.paid_amount || 0, formData.special_discount_amount || 0);
        setFormData(prev => ({ ...prev, items: updatedItems, ...totals }));
    };
    
    const handleRemoveServiceItem = (id: number) => {
        const items = Array.isArray(formData.items) ? formData.items : [];
        const updatedItems = items.filter(i => i.id !== id);
        const totals = calculateTotals(updatedItems, 0, formData.paid_amount || 0, formData.special_discount_amount || 0);
        setFormData(prev => ({ ...prev, items: updatedItems, ...totals }));
    };

    const handleSaveInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.daily_id) return alert("Generate ID first");
        if (!formData.subCategory) {
            alert("সাব-ক্যাটাগরি লিস্ট (Sub_Category) এন্ট্রি করা বাধ্যতামূলক।");
            return;
        }

        setLoading(true);
        try {
            if (formData.admission_id) {
                setAdmissions((prev: AdmissionRecord[]) => prev.map((adm: AdmissionRecord) => {
                    if (!adm) return adm;
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
                const safePrev = Array.isArray(prev) ? prev : [];
                if (!formData.daily_id) {
                    console.error("Cannot save invoice: daily_id is missing");
                    return safePrev;
                }
                const idx = safePrev.findIndex((inv: IndoorInvoice) => inv && inv.daily_id === formData.daily_id);
                const now = new Date().toISOString();
                
                if (idx >= 0) { 
                    const existingInvoice = safePrev[idx];
                    // CRITICAL: Exclude edit_history from the snapshot to prevent recursive nesting and crashes
                    const { edit_history: oldHistory, ...invoiceSnapshot } = existingInvoice;
                    
                    const historyEntry = {
                        ...invoiceSnapshot,
                        snapshot_date: now,
                        modified_by: formData.bill_created_by || 'System'
                    };
                    
                    // Limit history to last 5 entries to prevent massive state objects and crashes
                    const updatedHistory = [...(Array.isArray(oldHistory) ? oldHistory : []), historyEntry].slice(-5);
                    
                    const updatedInvoice = {
                        ...formData,
                        last_modified: now,
                        edit_history: updatedHistory
                    };
                    
                    const newArr = [...safePrev]; 
                    newArr[idx] = updatedInvoice; 
                    return newArr; 
                }
                
                const newInvoice = {
                    ...formData,
                    created_at: now,
                    last_modified: now,
                    edit_history: []
                };
                return [...safePrev, newInvoice];
            });
            setSuccessMessage("Indoor Invoice Saved!");
            setFormData(emptyIndoorInvoice);
            setSelectedAdmission(null);
            setSelectedInvoiceId(null);
        } catch (error) {
            console.error("Error saving invoice:", error);
            alert("ইনভয়েস সেভ করার সময় একটি ত্রুটি হয়েছে।");
        } finally {
            setLoading(false);
        }
    };

    const handleReturnInvoice = (inv: IndoorInvoice) => {
        if (inv.status === 'Returned') return alert("Already returned.");
        if (window.confirm(`আপনি কি এই ইনভয়েসটি রিটার্ন করতে চান? কনফার্ম করলে ইনভয়েসটি এডিট করার জন্য লোড হবে।`)) {
            handleLoadInvoice(inv);
            setSuccessMessage("Invoice Loaded for Return/Adjustment.");
        }
    };

    const handleCancelInvoice = (inv: IndoorInvoice) => {
        if (window.confirm(`ভুল এন্ট্রি হলে 'Cancel' করুন। এটি একাউন্টে কোনো প্রভাব ফেলবে না।`)) {
            setIndoorInvoices((prev: IndoorInvoice[]) => (Array.isArray(prev) ? prev : []).map(item => item && item.daily_id === inv.daily_id ? { ...item, status: 'Cancelled' } : item));
            setSuccessMessage("Invoice Cancelled!");
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
                        ${(Array.isArray(inv.items) ? inv.items : []).map(it => it && `
                            <tr>
                                <td>${it.service_type || ''}</td>
                                <td>${it.service_provider || ''}</td>
                                <td>${(it.service_charge || 0).toFixed(2)}</td>
                                <td>${it.quantity || 0}</td>
                                <td>${(it.payable_amount || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total-section">
                    <div class="total-row"><span>Gross Total:</span> <span>৳${Number(inv.total_bill || 0).toFixed(2)}</span></div>
                    <div class="total-row"><span>Discount:</span> <span>৳${(Number(inv.total_discount || 0) + Number(inv.special_discount_amount || 0)).toFixed(2)}</span></div>
                    <div class="total-row" style="font-size: 18px; color: #1e40af"><span>Net Payable:</span> <span>৳${Number(inv.net_payable || 0).toFixed(2)}</span></div>
                    <div class="total-row" style="color: green"><span>Paid Amount:</span> <span>৳${Number(inv.paid_amount || 0).toFixed(2)}</span></div>
                    <div class="total-row" style="color: red"><span>Due Balance:</span> <span>৳${Number(inv.due_bill || 0).toFixed(2)}</span></div>
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
        if (!inv) return;
        const patient = (Array.isArray(patients) ? patients : []).find(p => p && p.pt_id === inv.patient_id);
        const cleanedInv = {
            ...emptyIndoorInvoice,
            ...inv,
            patient_mobile: inv.patient_mobile || patient?.mobile || '',
            patient_address: inv.patient_address || patient?.address || '',
            patient_dob: inv.patient_dob || (patient ? `${patient.dobY}-${patient.dobM}-${patient.dobD}` : ''),
            items: Array.isArray(inv.items) ? inv.items : [],
            edit_history: Array.isArray(inv.edit_history) ? inv.edit_history : [],
            total_bill: Number(inv.total_bill) || 0,
            total_discount: Number(inv.total_discount) || 0,
            paid_amount: Number(inv.paid_amount) || 0,
            due_bill: Number(inv.due_bill) || 0,
            net_payable: Number(inv.net_payable) || 0,
            special_discount_amount: Number(inv.special_discount_amount) || 0
        };
        setFormData(cleanedInv);
        setSelectedInvoiceId(inv.daily_id);
        const adm = (Array.isArray(admissions) ? admissions : []).find(a => a && a.admission_id === inv.admission_id);
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

    const commonInputClasses = "w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 font-medium";

    const SummaryCard = ({ title, bill, net, color }: any) => (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-center shadow-xl shadow-black/40 transition-all hover:scale-105 hover:border-slate-700 group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${color.replace('text-', 'bg-')}`}></div>
            <h4 className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2 group-hover:text-slate-400 transition-colors">{title}</h4>
            <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-500 text-[11px] font-bold">
                    <span>Total Bill:</span>
                    <span className="text-slate-300">৳{bill.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${color} text-xl font-black border-t border-slate-800/50 pt-2`}>
                    <span className="text-[10px] uppercase text-slate-500 tracking-tighter">Hospital Net</span>
                    <span>৳{net.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );

    // --- Helper function for keyword matching ---
    const matchesKeyword = (source: string, words: string[]) => {
        if(!source) return false;
        const lower = source.toLowerCase();
        return words.some(w => lower.includes(w.toLowerCase()));
    };

    // --- Core logic to categorize an invoice (Mapping Category Breakdown) ---
    const categorizeInvoiceData = (inv: IndoorInvoice) => {
        if (!inv || inv.status === 'Cancelled' || inv.status === 'Returned') {
            return { admFee: 0, oxygen: 0, conservative: 0, nvd: 0, dc: 0, lscs_ot: 0, gb_ot: 0, others_ot: 0, dressing: 0, others: 0, pcAmount: 0, clinicNet: 0 };
        }

        const items = Array.isArray(inv.items) ? inv.items : [];
        const incomeItems = items.filter((it: any) => it && it.isClinicFund === true);

        let admFee = 0, oxygen = 0, dressing = 0, conservative = 0, nvd = 0, dc = 0, lscs_ot = 0, gb_ot = 0, others_ot = 0, others = 0;

        incomeItems.forEach((it: any) => {
            const typeLower = (it.service_type || '').toLowerCase();
            const amt = it.payable_amount;
            const subCat = (inv.subCategory || '').toUpperCase();
            const mainCat = inv.serviceCategory;

            // Priority 1: Direct Item Keywords (Admission, O2, Dressing)
            if (matchesKeyword(typeLower, ['admission fee', 'ভর্তি ফি'])) {
                admFee += amt;
            } else if (matchesKeyword(typeLower, ['oxygen', 'o2', 'nebulizer', 'nebulization'])) {
                oxygen += amt;
            } else if (matchesKeyword(typeLower, ['dressing'])) {
                dressing += amt;
            } 
            // Priority 2: Explicit Sub-Category Matching
            else if (subCat === 'LSCS_OT') {
                lscs_ot += amt;
            } else if (subCat === 'GB_OT') {
                gb_ot += amt;
            } else if (subCat === 'NVD') {
                nvd += amt;
            } else if (subCat === 'D&C') {
                dc += amt;
            } 
            // Priority 3: Main Category Fallbacks
            else if (mainCat === 'Operation') {
                others_ot += amt;
            } else if (mainCat === 'Conservative treatment') {
                conservative += amt;
            } 
            // Priority 4: Misc
            else {
                others += amt;
            }
        });

        const totalRevenue = incomeItems.reduce((s, it) => s + it.payable_amount, 0);
        // Deduct PC Amount: Sum of special_commission and commission_paid
        const pcAmount = (inv.special_commission || 0) + (inv.commission_paid || 0);
        // Deduct Special Discounts and PC from the Hospital's Gain
        const clinicNet = totalRevenue - (inv.special_discount_amount || 0) - pcAmount;

        return { admFee, oxygen, conservative, nvd, dc, lscs_ot, gb_ot, others_ot, dressing, others, pcAmount, clinicNet };
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <SummaryCard title="Today Hospital Cash" bill={stats.today.totalBill} net={stats.today.hospitalNet} color="text-emerald-400" />
                <SummaryCard title="Monthly Hospital Cash" bill={stats.month.totalBill} net={stats.month.hospitalNet} color="text-blue-400" />
                <SummaryCard title="Yearly Hospital Cash" bill={stats.year.totalBill} net={stats.year.hospitalNet} color="text-purple-400" />
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center shadow-lg shadow-black/20 flex flex-col justify-center">
                    <h4 className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Total Outstanding Due</h4>
                    <p className="text-2xl font-black text-rose-500">৳{stats.totalDue.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl shadow-black/40">
                <h3 className="text-xl font-black text-white mb-6 border-b border-slate-800 pb-4 uppercase tracking-tighter flex items-center gap-3">
                    <span className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><DatabaseIcon size={24}/></span>
                    Indoor Invoice
                </h3>
                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="w-full md:w-1/4">
                        <label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Admitted Patient</label>
                        <SearchableSelect 
                            label="" 
                            theme="dark" 
                            placeholder="Search Admitted Patient..."
                            options={(Array.isArray(admissions) ? admissions : []).filter(a => a).map(a => {
                                const safePatients = Array.isArray(patients) ? patients : [];
                                const p = safePatients.find(pt => pt && pt.pt_id === a.patient_id);
                                return {
                                    id: a.admission_id || '', 
                                    name: a.patient_name || 'Unknown Patient', 
                                    details: `ID: ${a.patient_id || 'N/A'} | Indication: ${a.indication || 'N/A'} | DOB: ${p?.dobY || ''}-${p?.dobM || ''}-${p?.dobD || ''} | Addr: ${p?.address || ''} | Mob: ${p?.mobile || ''} | Adm: ${a.admission_date || ''}`
                                };
                            })} 
                            value={selectedAdmission?.admission_id || ''} 
                            onChange={(id) => { 
                                const safeAdmissions = Array.isArray(admissions) ? admissions : [];
                                const adm = safeAdmissions.find(a => a && a.admission_id === id); 
                                setSelectedAdmission(adm || null); 
                                if(adm) setFormData({
                                    ...emptyIndoorInvoice, 
                                    admission_id: adm.admission_id || '', 
                                    patient_id: adm.patient_id || '', 
                                    patient_name: adm.patient_name || '', 
                                    admission_date: adm.admission_date || '', 
                                    status: 'Posted'
                                }); 
                            }} 
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Outdoor Patient (Not Admitted)</label>
                        <SearchableSelect 
                            label="" 
                            theme="dark" 
                            placeholder="Search All Patients..."
                            options={(Array.isArray(patients) ? patients : []).filter(p => p).map(p => ({
                                id: p.pt_id || '', 
                                name: p.pt_name || 'Unknown', 
                                details: `ID: ${p.pt_id} | Mob: ${p.mobile || 'N/A'} | Addr: ${p.address || 'N/A'}`
                            }))} 
                            value={formData.patient_id || ''} 
                            onChange={(id) => { 
                                const safePatients = Array.isArray(patients) ? patients : [];
                                const p = safePatients.find(pt => pt && pt.pt_id === id); 
                                if(p) {
                                    setSelectedAdmission(null);
                                    setFormData({
                                        ...emptyIndoorInvoice, 
                                        patient_id: p.pt_id || '', 
                                        patient_name: p.pt_name || '', 
                                        status: 'Posted',
                                        indication: 'Outdoor Service'
                                    });
                                }
                            }} 
                        />
                    </div>
                    <div className="w-full md:w-1/6">
                        <label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Invoice Date</label>
                        <input 
                            type="date" 
                            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                            value={formData.invoice_date || ''} 
                            onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button onClick={handleGenerateId} className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/40 border border-blue-400/30 hover:from-blue-500 hover:to-indigo-700 transition-all h-[46px]">Generate ID</button>
                        {formData.daily_id && (
                            <button 
                                onClick={() => { 
                                    setFormData(emptyIndoorInvoice); 
                                    setSelectedAdmission(null); 
                                    setSelectedInvoiceId(null); 
                                }} 
                                className="bg-slate-800 hover:bg-slate-750 text-slate-400 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-slate-700 h-[46px]"
                            >
                                Clear Form
                            </button>
                        )}
                        {selectedInvoiceId && (
                            <button 
                                onClick={handleNewVisit} 
                                className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/40 border border-emerald-400/30 hover:from-emerald-500 hover:to-teal-700 transition-all h-[46px]"
                            >
                                New Visit
                            </button>
                        )}
                    </div>
                </div>
                {formData.daily_id && (
                    <form onSubmit={handleSaveInvoice} className="space-y-8">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Invoice Details & Timeline</h4>
                            {Array.isArray(formData.edit_history) && formData.edit_history.length > 0 && (
                                <button 
                                    type="button"
                                    onClick={() => { setHistoryInvoice(formData); setShowHistoryModal(true); }}
                                    className="text-[10px] bg-blue-900/30 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-800 hover:bg-blue-800 hover:text-white transition-all font-black uppercase tracking-widest"
                                >
                                    View Edit Logs ({formData.edit_history.length})
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Invoice ID</label><input type="text" value={formData.daily_id} disabled className="w-full p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 font-bold"/></div>
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Invoice Date</label><input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleInputChange} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"/></div>
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Entry Date (System)</label><input type="text" value={formData.created_at ? new Date(formData.created_at).toLocaleString() : 'Not Saved Yet'} disabled className="w-full p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-[10px] font-bold"/></div>
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Admission Date</label><input type="date" name="admission_date" value={formData.admission_date} onChange={handleInputChange} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"/></div>
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Discharge Date</label><input type="date" name="discharge_date" value={formData.discharge_date} onChange={handleInputChange} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"/></div>
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Patient Mobile</label><input type="text" name="patient_mobile" value={formData.patient_mobile || ''} onChange={handleInputChange} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"/></div>
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Patient Address</label><input type="text" name="patient_address" value={formData.patient_address || ''} onChange={handleInputChange} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"/></div>
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Patient DOB</label><input type="text" name="patient_dob" value={formData.patient_dob || ''} onChange={handleInputChange} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" placeholder="YYYY-MM-DD"/></div>
                            <div className="flex flex-col justify-center items-center bg-slate-900 rounded-xl border border-slate-800 p-3">
                                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">PC (Apply?)</label>
                                <div className="flex gap-2 items-center">
                                    <button type="button" onClick={() => setApplyPC(true)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${applyPC ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-slate-800 text-slate-500'}`}>YES</button>
                                    <button type="button" onClick={() => { setApplyPC(false); setFormData(prev => ({ ...prev, special_commission: 0 })); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${!applyPC ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' : 'bg-slate-800 text-slate-500'}`}>NO</button>
                                    {applyPC && <input type="number" value={formData.special_commission} onChange={e => setFormData(prev => ({...prev, special_commission: parseFloat(e.target.value) || 0}))} className="w-24 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Amount"/>}
                                </div>
                            </div>
                            <div><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Category</label><select name="serviceCategory" value={formData.serviceCategory || ''} onChange={handleInputChange} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium">{(Array.isArray(serviceCategoriesList) ? serviceCategoriesList : []).map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}</select></div>
                            <div>
                                <SearchableSelect 
                                    theme="dark" 
                                    label="Sub_Category" 
                                    options={(Array.isArray(filteredSubCategories) ? filteredSubCategories : []).filter(s => s && s.id && s.name).map(s => ({id: s.id, name: s.name}))} 
                                    value={(Array.isArray(filteredSubCategories) ? filteredSubCategories : []).find(s => s && s.name === formData.subCategory)?.id || ''} 
                                    onChange={(_id, name) => setFormData(prev => ({...prev, subCategory: name}))} 
                                    onAddNew={() => setShowSubCategoryManager(true)}
                                    required={true}
                                    inputHeightClass="h-[46px] bg-slate-900 border-slate-800"
                                    allowCustom={true}
                                />
                            </div>
                            <div className="col-span-2"><label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Referrer</label><select name="referrar_id" value={formData.referrar_id || ''} onChange={(e) => { const ref = (Array.isArray(referrars) ? referrars : []).find(r => r && r.ref_id === e.target.value); setFormData({...formData, referrar_id: ref?.ref_id || '', referrar_name: ref?.ref_name || ''}); }} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"><option value="" className="bg-slate-900">Select...</option>{(Array.isArray(referrars) ? referrars : []).map(r => r && <option key={r.ref_id} value={r.ref_id} className="bg-slate-900">{r.ref_name}</option>)}</select></div>
                            
                            <div className="col-span-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <FileTextIcon size={14} /> OT Details & Clinical Notes
                                    </label>
                                    <div className="flex gap-2">
                                        {formData.subCategory && otDetailsLibrary[formData.subCategory] && (
                                            <button 
                                                type="button" 
                                                onClick={handleLoadTemplate}
                                                className="bg-amber-900/30 text-amber-400 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border border-amber-800 hover:bg-amber-800 hover:text-white transition-all tracking-widest"
                                            >
                                                Load Saved Template
                                            </button>
                                        )}
                                        <button 
                                            type="button" 
                                            onClick={handleSaveAsTemplate}
                                            className="bg-blue-900/30 text-blue-400 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border border-blue-800 hover:bg-blue-800 hover:text-white transition-all tracking-widest flex items-center gap-2"
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
                                    className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner placeholder:text-slate-700"
                                    placeholder="Enter OT report details, operation notes..."
                                />
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    <span className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Activity size={20} /></span>
                                    Services & Charges
                                </h4>
                                <div className="flex gap-3">
                                    <div className="w-72">
                                        <SearchableSelect 
                                            label=""
                                            theme="dark"
                                            placeholder="Search Medicine..."
                                            options={(Array.isArray(medicines) ? medicines : []).map(m => ({
                                                id: m.id,
                                                name: m.name,
                                                details: `Price: ৳${m.unitPriceSell} | Generic: ${m.genericName || 'N/A'}`
                                            }))}
                                            value=""
                                            onChange={(id) => {
                                                const safeMedicines = Array.isArray(medicines) ? medicines : [];
                                                const med = safeMedicines.find(m => m && m.id === id);
                                                if (med) {
                                                    const newItem: ServiceItem = { 
                                                        id: Date.now(), 
                                                        service_type: med.name || 'Unknown Medicine', 
                                                        service_provider: 'Medicine Store', 
                                                        service_charge: med.unitPriceSell || 0, 
                                                        quantity: 1, 
                                                        line_total: med.unitPriceSell || 0, 
                                                        discount: 0, 
                                                        payable_amount: med.unitPriceSell || 0, 
                                                        note: `Medicine: ${med.name || ''}`, 
                                                        isClinicFund: false 
                                                    };
                                                    const updatedItems = [...(Array.isArray(formData.items) ? formData.items : []), newItem];
                                                    const totals = calculateTotals(updatedItems, 0, formData.paid_amount || 0, formData.special_discount_amount || 0);
                                                    setFormData(prev => ({ ...prev, items: updatedItems, ...totals }));
                                                }
                                            }}
                                            inputHeightClass="h-11 bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                    <button type="button" onClick={handleAddServiceItem} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-900/40 border border-blue-400/30">
                                        <Plus size={14}/> Add Service
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner bg-slate-950/50">
                                <table className="w-full text-sm text-left text-slate-300">
                                    <thead className="bg-slate-950 text-slate-500 border-b border-slate-800">
                                        <tr>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px]">Type</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px]">Provider</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-right">Charge</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-right">Qty</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-right">Disc</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-right">Payable</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-center">A/C</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px]">Note</th>
                                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-center">X</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {(formData.items || []).map(item => (
                                            <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-2">
                                                    <input list={`service_type_${item.id}`} value={item.service_type} onChange={e=>handleServiceChange(item.id,'service_type',e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg h-9 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                                                    <datalist id={`service_type_${item.id}`}>{(Array.isArray(serviceTypesList) ? serviceTypesList : []).map(t=><option key={t} value={t} className="bg-slate-900"/>)}</datalist>
                                                </td>
                                                <td className="p-2">
                                                    <input list={`service_provider_${item.id}`} value={item.service_provider} onChange={e=>handleServiceChange(item.id,'service_provider',e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg h-9 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                                                    <datalist id={`service_provider_${item.id}`}>
                                                        {item.service_type === 'Assistant_2' 
                                                            ? [
                                                                ...(Array.isArray(doctors) ? doctors : []).filter(d => d && d.doctor_id).map(d => ({id: d.doctor_id, name: d.doctor_name})), 
                                                                ...(Array.isArray(activeEmployees) ? activeEmployees : []).filter(e => e && e.emp_id).map(e => ({id: e.emp_id, name: e.emp_name}))
                                                              ].map(obj => obj && <option key={obj.id} value={obj.name} className="bg-slate-900"/>)
                                                            : (Array.isArray(doctorServiceTypes) ? doctorServiceTypes : []).includes(item.service_type) 
                                                                ? (Array.isArray(doctors) ? doctors : []).filter(d => d && d.doctor_id).map(d=><option key={d.doctor_id} value={d.doctor_name} className="bg-slate-900"/>) 
                                                                : (Array.isArray(activeEmployees) ? activeEmployees : []).filter(e => e && e.emp_id).map(e=><option key={e.emp_id} value={e.emp_name} className="bg-slate-900"/>)
                                                        }
                                                    </datalist>
                                                </td>
                                                <td className="p-2"><input type="number" value={item.service_charge || 0} onChange={e=>handleServiceChange(item.id,'service_charge',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg text-right h-9 focus:ring-2 focus:ring-blue-500 outline-none font-bold"/></td>
                                                <td className="p-2"><input type="number" value={item.quantity || 0} onChange={e=>handleServiceChange(item.id,'quantity',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg text-right h-9 focus:ring-2 focus:ring-blue-500 outline-none font-bold"/></td>
                                                <td className="p-2"><input type="number" value={item.discount || 0} onChange={e=>handleServiceChange(item.id,'discount',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg text-right h-9 focus:ring-2 focus:ring-blue-500 outline-none font-bold"/></td>
                                                <td className="p-2 font-black text-blue-400 text-right">{(item.payable_amount || 0).toFixed(2)}</td>
                                                <td className="p-2 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!item.isClinicFund} 
                                                        onChange={e => {
                                                            const items = Array.isArray(formData.items) ? formData.items : [];
                                                            const updated = items.map(it => it.id === item.id ? { ...it, isClinicFund: e.target.checked } : it);
                                                            const totals = calculateTotals(updated, 0, formData.paid_amount || 0, formData.special_discount_amount || 0);
                                                            setFormData(prev => ({ ...prev, items: updated, ...totals }));
                                                        }}
                                                        className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="p-2"><input type="text" value={item.note || ''} onChange={e=>handleServiceChange(item.id,'note',e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg h-9 text-xs focus:ring-2 focus:ring-blue-500 outline-none"/></td>
                                                <td className="p-2 text-center">
                                                    <button type="button" onClick={()=>handleRemoveServiceItem(item.id)} className="text-rose-500 hover:bg-rose-500/10 transition-all p-2 rounded-lg"><Trash2 size={18}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-inner">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Bill Created By</label>
                                    <select name="bill_created_by" value={formData.bill_created_by} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-lg">
                                        <option value="" className="bg-slate-900">Select Employee</option>
                                        {(Array.isArray(activeEmployees) ? activeEmployees : []).map(e => e && <option key={e.emp_id} value={e.emp_name} className="bg-slate-900">{e.emp_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Payment Method</label>
                                    <select name="payment_method" value={formData.payment_method} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-lg mb-4">
                                        <option className="bg-slate-900">Cash</option>
                                        <option className="bg-slate-900">Card</option>
                                        <option className="bg-slate-900">Bkash</option>
                                        <option className="bg-slate-900">Nagad</option>
                                    </select>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-900/40 border border-blue-400/30 hover:from-blue-500 hover:to-indigo-700 transition-all flex items-center justify-center gap-4"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
                                        Save Final Invoice
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-2">
                                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Total Bill:</span> 
                                    <span className="font-black text-slate-200 text-xl">৳{Number(formData.total_bill || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Total Discount:</span> 
                                    <span className="font-black text-slate-200 text-xl">৳{Number(formData.total_discount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-amber-400 border-b border-slate-800 pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Special Discount:</span> 
                                    <input type="number" name="special_discount_amount" value={formData.special_discount_amount} onChange={handleInputChange} onFocus={e=>e.target.select()} className="bg-slate-950 text-amber-400 w-36 p-2 text-right font-black border border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"/>
                                </div>
                                <div className="flex justify-between items-center text-blue-400 text-2xl font-black border-b-2 border-blue-900/50 pb-2">
                                    <span className="text-xs uppercase tracking-widest">Net Payable:</span> 
                                    <span>৳{Number(formData.net_payable || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-400 border-b border-slate-800 pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Paid Amount:</span> 
                                    <input type="number" name="paid_amount" value={formData.paid_amount} onChange={handleInputChange} onFocus={e=>e.target.select()} className="bg-slate-950 text-emerald-400 w-36 p-2 text-right font-black border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Balance:</span> 
                                    <span className={`text-2xl font-black ${(formData.due_bill || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        ৳{Number(formData.due_bill || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4">
                        </div>
                    </form>
                )}

                {showSubCategoryManager && (
                    <GenericManagerPage 
                        title="Manage Sub_Categories" 
                        placeholder="Enter Sub_Category Name" 
                        items={subCategories} 
                        setItems={setSubCategories} 
                        onClose={() => setShowSubCategoryManager(false)} 
                        extraFields={{ mainCategory: formData.serviceCategory }}
                        onSaveAndSelect={(_id, name) => {
                            setFormData(prev => ({...prev, subCategory: name}));
                            setShowSubCategoryManager(false);
                        }} 
                    />
                )}

                {showHistoryModal && historyInvoice && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4 overflow-y-auto">
                        <div className="bg-white w-full max-w-4xl rounded-2xl border border-gray-200 shadow-2xl p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                    <DatabaseIcon className="text-blue-600" size={20} /> Invoice Edit History: {historyInvoice.daily_id}
                                </h3>
                                <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">&times;</button>
                            </div>
                            
                            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                {historyInvoice.edit_history?.map((snapshot: any, idx: number) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                            <div className="text-xs">
                                                <span className="text-gray-500 font-bold uppercase tracking-tighter">Version {idx + 1} - Captured on: </span>
                                                <span className="text-blue-600 font-black">{new Date(snapshot.snapshot_date).toLocaleString()}</span>
                                                <span className="text-gray-500 ml-4 font-bold uppercase tracking-tighter">By: </span>
                                                <span className="text-emerald-600 font-black">{snapshot.modified_by}</span>
                                            </div>
                                            <button 
                                                onClick={() => handlePrintInvoice(snapshot)}
                                                className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all"
                                            >
                                                Print This Version
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-[11px] text-gray-700">
                                            <div><span className="text-gray-400 font-bold uppercase">Invoice Date:</span> <span className="font-black">{snapshot.invoice_date}</span></div>
                                            <div><span className="text-gray-400 font-bold uppercase">Total Bill:</span> <span className="font-black">৳{Number(snapshot.total_bill || 0).toFixed(2)}</span></div>
                                            <div><span className="text-gray-400 font-bold uppercase">Paid:</span> <span className="font-black">৳{Number(snapshot.paid_amount || 0).toFixed(2)}</span></div>
                                            <div className="col-span-3 bg-white p-2 rounded border border-gray-100">
                                                <span className="text-gray-400 font-bold uppercase block mb-1">Items:</span> 
                                                <div className="flex flex-wrap gap-2">
                                                    {(Array.isArray(snapshot.items) ? snapshot.items : []).map((it: any, i: number) => it && (
                                                        <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 border border-gray-200">
                                                            {it.service_type || 'Unknown'} (৳{Number(it.payable_amount || 0).toFixed(2)})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-inner">
                                    <h4 className="text-emerald-700 font-black text-xs mb-2 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Current Active Version
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4 text-[11px] text-gray-800">
                                        <div><span className="text-emerald-600/50 font-bold uppercase">Invoice Date:</span> <span className="font-black">{historyInvoice.invoice_date}</span></div>
                                        <div><span className="text-emerald-600/50 font-bold uppercase">Total Bill:</span> <span className="font-black">৳{Number(historyInvoice.total_bill || 0).toFixed(2)}</span></div>
                                        <div><span className="text-emerald-600/50 font-bold uppercase">Paid:</span> <span className="font-black">৳{Number(historyInvoice.paid_amount || 0).toFixed(2)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
                        <h3 className="text-gray-500 font-black uppercase text-xs tracking-widest whitespace-nowrap flex items-center gap-2">
                            <DatabaseIcon size={14} className="text-blue-600" /> Master Journal: Saved Indoor Invoices
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <div className="relative w-48">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search Patient or ID..." 
                                    value={tableSearchTerm}
                                    onChange={e => setTableSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-[10px] text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                />
                            </div>
                            <input 
                                type="date" 
                                value={tableDateFilter}
                                onChange={e => setTableDateFilter(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-[10px] text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                            />
                            <input 
                                type="month" 
                                value={tableMonthFilter}
                                onChange={e => setTableMonthFilter(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-[10px] text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="bg-[#fdfcfb] rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-700 border-collapse">
                                <thead className="bg-[#f8f9fa] text-gray-800 sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                        <th className="p-3 text-center w-12 font-black uppercase text-[10px]">SL</th>
                                        <th className="p-3 w-24 font-black uppercase text-[10px]">ID</th>
                                        <th className="p-3 w-28 font-black uppercase text-[10px]">Date</th>
                                        <th className="p-3 font-black uppercase text-[10px]">Patient Details</th>
                                        <th className="p-3 text-right w-32 font-black uppercase text-[10px]">Total</th>
                                        <th className="p-3 text-right w-32 font-black uppercase text-[10px]">Paid</th>
                                        <th className="p-3 text-right w-32 font-black uppercase text-[10px]">Due</th>
                                        <th className="p-3 text-right w-32 font-black uppercase text-[10px] text-blue-700">Clinic Net Balance</th>
                                        <th className="p-3 text-center w-24 font-black uppercase text-[10px]">Status</th>
                                        <th className="p-3 text-center w-40 font-black uppercase text-[10px]">Action</th>
                                    </tr>
                                    <tr className="bg-blue-50/50 text-[10px] border-t border-gray-200">
                                        <th colSpan={4} className="p-2 text-right text-gray-500 font-black uppercase tracking-widest">Filtered Totals:</th>
                                        <th className="p-2 text-right text-blue-800 font-black">৳{tableTotals.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</th>
                                        <th className="p-2 text-right text-emerald-700 font-black">৳{tableTotals.paid.toLocaleString(undefined, {minimumFractionDigits: 2})}</th>
                                        <th className="p-2 text-right text-red-700 font-black">৳{tableTotals.due.toLocaleString(undefined, {minimumFractionDigits: 2})}</th>
                                        <th className="p-2 text-right text-blue-900 font-black">৳{tableTotals.net.toLocaleString(undefined, {minimumFractionDigits: 2})}</th>
                                        <th colSpan={2}></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-[#fdfcfb]">
                                    {filteredInvoices.map((inv, index) => (
                                        <tr key={inv.daily_id} onClick={() => handleLoadInvoice(inv)} className={`cursor-pointer odd:bg-white even:bg-slate-50/50 hover:bg-blue-100/50 transition-all ${selectedInvoiceId === inv.daily_id ? 'bg-blue-100/70 border-l-4 border-blue-600' : ''} ${inv.status === 'Returned' ? 'bg-red-50' : inv.status === 'Cancelled' ? 'opacity-40 grayscale line-through' : ''}`}>
                                            <td className="p-3 text-center text-gray-400 font-mono text-[10px]">{index + 1}</td>
                                            <td className="p-3 font-black text-xs text-blue-600">{inv.daily_id}</td>
                                            <td className="p-3 text-xs font-semibold text-gray-600">{inv.invoice_date}</td>
                                        <td className="p-3">
                                            <div className="font-black uppercase text-gray-900 leading-tight">{inv.patient_name}</div>
                                            <div className="text-[9px] text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                <span className="bg-gray-200 px-1 rounded">ID: {inv.patient_id}</span>
                                                <span className="bg-blue-50 text-blue-600 px-1 rounded">Indication: {inv.indication}</span>
                                                {(() => {
                                                    const safePatients = Array.isArray(patients) ? patients : [];
                                                    const p = safePatients.find(pt => pt && pt.pt_id === inv.patient_id);
                                                    return p ? (
                                                        <>
                                                            <span>Age: {p.ageY}Y {p.ageM}M {p.ageD}D</span>
                                                            <span>Addr: {p.address}</span>
                                                            <span>Mob: {p.mobile}</span>
                                                        </>
                                                    ) : null;
                                                })()}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-bold font-mono">৳{Number(inv.total_bill || 0).toFixed(2)}</td>
                                        <td className="p-3 text-right text-emerald-600 font-black font-mono">৳{Number(inv.paid_amount || 0).toFixed(2)}</td>
                                        <td className="p-3 text-right text-rose-600 font-black font-mono">৳{Number(inv.due_bill || 0).toFixed(2)}</td>
                                        <td className="p-3 text-right text-sky-600 font-bold font-mono">
                                            {(() => {
                                                if (inv.status === 'Cancelled') return '৳0.00';
                                                const items = Array.isArray(inv.items) ? inv.items : [];
                                                const nonFundedCost = items
                                                    .filter(it => it && !it.isClinicFund)
                                                    .reduce((s, it) => s + (it.payable_amount || 0), 0);
                                                const pcAmount = (inv.special_commission || 0) + (inv.commission_paid || 0);
                                                const net = (inv.paid_amount || 0) - nonFundedCost - pcAmount;
                                                return `৳${(inv.status === 'Returned' ? -net : net).toFixed(2)}`;
                                            })()}
                                        </td>
                                        <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${inv.status==='Returned'?'bg-rose-600 text-white':inv.status==='Cancelled'?'bg-slate-700 text-slate-300':'bg-blue-600 text-white'}`}>{inv.status}</span></td>
                                        <td className="p-3 text-center space-x-3" onClick={e=>e.stopPropagation()}>
                                            <button onClick={(e) => { e.stopPropagation(); handlePrintInvoice(inv); }} className="text-sky-600 hover:text-sky-800 text-xs font-bold underline">Print</button>
                                            {inv.status !== 'Returned' && inv.status !== 'Cancelled' && (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); handleReturnInvoice(inv); }} className="text-amber-600 hover:text-amber-800 text-xs font-bold underline">Return</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleCancelInvoice(inv); }} className="text-rose-600 hover:text-rose-800 text-xs font-bold underline">Cancel</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredInvoices.length === 0 && <div className="p-20 text-center text-gray-400 font-black uppercase opacity-20">No Records Found</div>}
                        </div>
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
    const safeInvoices = Array.isArray(indoorInvoices) ? indoorInvoices : [];
    const dueInvoices = safeInvoices.filter(inv => inv && inv.status !== 'Returned' && inv.status !== 'Cancelled' && (inv.due_bill || 0) > 0.5 && (inv.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
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
                <tr><td><b>Amount Collected:</b></td><td style="font-size:18px; font-weight:bold">৳${Number(paidAmount || 0).toFixed(2)}</td></tr>
                <tr><td><b>Remaining Due:</b></td><td>৳${Number((invoice.due_bill || 0) - paidAmount).toFixed(2)}</td></tr>
            </table>
            <div style="margin-top:30px; text-align:right"><b>Authorized Sign</b><br>..........................</div>
        </div></body></html>`;
        win.document.write(html); win.document.close(); win.print();
    };

    const handleCollect = () => {
        if (!selectedInvoice || amount <= 0) return;
        const newCollection: ClinicDueCollection = { 
            collection_id: Date.now().toString(), 
            invoice_id: selectedInvoice.daily_id, 
            patient_name: selectedInvoice.patient_name, 
            collection_date: selectedInvoice.admission_date || new Date().toISOString().split('T')[0], 
            amount_collected: amount 
        };
        const updatedInvoice = { ...selectedInvoice, paid_amount: (selectedInvoice.paid_amount || 0) + amount, due_bill: (selectedInvoice.due_bill || 0) - amount };
        setClinicDueCollections((prev: ClinicDueCollection[]) => [...(Array.isArray(prev) ? prev : []), newCollection]);
        setIndoorInvoices((prev: IndoorInvoice[]) => (Array.isArray(prev) ? prev : []).map((inv: IndoorInvoice) => inv && inv.daily_id === updatedInvoice.daily_id ? updatedInvoice : inv));
        setSuccessMessage("Collected!");
        handlePrintReceipt(selectedInvoice, amount);
        setSelectedInvoice(null);
    };
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DatabaseIcon className="text-amber-600" size={20} /> Due Collection
            </h3>
            <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search Patient Name..." 
                    value={searchTerm} 
                    onChange={e=>setSearchTerm(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <tr>
                            <th className="p-3 font-black uppercase text-[10px]">ID</th>
                            <th className="p-3 font-black uppercase text-[10px]">Patient</th>
                            <th className="p-3 font-black uppercase text-[10px] text-right">Due Amount</th>
                            <th className="p-3 font-black uppercase text-[10px] text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(Array.isArray(dueInvoices) ? dueInvoices : []).map(inv => inv && (
                            <tr key={inv.daily_id} className="hover:bg-amber-50/30 transition-colors">
                                <td className="p-3 font-mono text-xs text-gray-500">{inv.daily_id}</td>
                                <td className="p-3 font-bold text-gray-800">{inv.patient_name}</td>
                                <td className="p-3 text-right text-rose-600 font-black font-mono">৳{(inv.due_bill || 0).toFixed(2)}</td>
                                <td className="p-3 text-center">
                                    <button onClick={()=>{setSelectedInvoice(inv); setAmount(0);}} className="bg-amber-600 px-4 py-1.5 rounded-lg text-white font-bold hover:bg-amber-700 transition-all shadow-sm text-xs uppercase tracking-wider">Collect</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {dueInvoices.length === 0 && <div className="p-10 text-center text-gray-400 font-black uppercase opacity-20">No Due Records</div>}
        </div>
    );
};

const CertificateCard = ({ title, icon, color, onClick }: any) => (
    <div onClick={onClick} className={`bg-white p-4 rounded-xl border border-gray-200 hover:border-${color}-500 transition-all cursor-pointer group flex flex-col items-center justify-center h-32 shadow-sm hover:shadow-md`}>
        <div className={`p-3 rounded-full bg-${color}-50 text-${color}-600 mb-2 group-hover:scale-110 transition-transform`}>{icon}</div>
        <span className="text-gray-700 font-bold text-sm text-center group-hover:text-gray-900">{title}</span>
    </div>
);

// 4. Report Summary
const ReportSummaryPage: React.FC<{ 
    admissions: AdmissionRecord[]; 
    doctors: Doctor[]; 
    patients: Patient[]; 
    onOpenRxMaster: () => void;
}> = ({ admissions, doctors, patients, onOpenRxMaster }) => {
    const safeAdmissions = Array.isArray(admissions) ? admissions : [];
    const totalAdmissions = safeAdmissions.length;
    const activeAdmissions = safeAdmissions.filter(a => a && !a.discharge_date).length;
    const discharged = totalAdmissions - activeAdmissions;
    const [activeCertType, setActiveCertType] = useState<'discharge' | 'birth' | 'death' | 'referral' | null>(null);
    const safeDoctors = Array.isArray(doctors) ? doctors : [];
    const doctorStats = safeDoctors.map(doc => ({ name: doc ? doc.doctor_name : 'Unknown', count: safeAdmissions.filter(a => a && doc && a.doctor_id === doc.doctor_id).length })).filter(d => d.count > 0);
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileTextIcon className="text-purple-600" size={20} /> Report Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200 shadow-inner">
                    <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Admissions</h4>
                    <p className="text-3xl font-black text-gray-900">{totalAdmissions}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100 shadow-inner">
                    <h4 className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Active Patients</h4>
                    <p className="text-3xl font-black text-emerald-700">{activeAdmissions}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100 shadow-inner">
                    <h4 className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-1">Discharged</h4>
                    <p className="text-3xl font-black text-blue-700">{discharged}</p>
                </div>
            </div>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Certificates & Templates</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <CertificateCard title="Discharge / Rx Master" icon={<ClipboardIcon className="w-6 h-6"/>} color="emerald" onClick={onOpenRxMaster} />
                <CertificateCard title="Discharge Certificate" icon={<ClipboardIcon className="w-6 h-6"/>} color="blue" onClick={() => setActiveCertType('discharge')} />
                <CertificateCard title="Baby Note / Birth Cert" icon={<FileTextIcon className="w-6 h-6"/>} color="pink" onClick={() => setActiveCertType('birth')} />
                <CertificateCard title="Death Certificate" icon={<FileTextIcon className="w-6 h-6"/>} color="red" onClick={() => setActiveCertType('death')} />
                <CertificateCard title="Referral Reports" icon={<UserPlusIcon className="w-6 h-6"/>} color="purple" onClick={() => setActiveCertType('referral')} />
            </div>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Admissions by Doctor</h4>
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-inner">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <tr>
                            <th className="p-3 font-black uppercase text-[10px]">Doctor Name</th>
                            <th className="p-3 text-right font-black uppercase text-[10px]">Patient Count</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(Array.isArray(doctorStats) ? doctorStats : []).map((stat, idx) => stat && (
                            <tr key={idx} className="hover:bg-white transition-colors">
                                <td className="p-3 font-semibold text-gray-800">{stat.name}</td>
                                <td className="p-3 text-right font-black text-gray-900">{stat.count}</td>
                            </tr>
                        ))}
                        {doctorStats.length === 0 && <tr><td colSpan={2} className="p-6 text-center text-gray-400 font-bold italic">No data available.</td></tr>}
                    </tbody>
                </table>
            </div>
            {activeCertType && (<CertificateModal type={activeCertType} admissions={admissions} patients={patients} doctors={doctors} onClose={() => setActiveCertType(null)} />)}
        </div>
    );
};

// 5. Bed Management
const BedManagementPage: React.FC<{ admissions: AdmissionRecord[]; setAdmissions: React.Dispatch<React.SetStateAction<AdmissionRecord[]>>; setSuccessMessage: (msg: string) => void; }> = ({ admissions, setAdmissions, setSuccessMessage }) => {
    const wards = [
        { id: 'male_ward', name: 'Male Ward', beds: Array.from({length: 5}, (_, i) => `M-${String(i+1).padStart(2, '0')}`) },
        { id: 'female_ward', name: 'Female Ward', beds: Array.from({length: 5}, (_, i) => `F-${String(i+1).padStart(2, '0')}`) },
        { id: 'cabin', name: 'Cabins', beds: ['CAB-101', 'CAB-102', 'CAB-103', 'CAB-104', 'VIP-01'] }
    ];

    const getBedStatus = (bedId: string) => {
        const safeAdmissions = Array.isArray(admissions) ? admissions : [];
        return safeAdmissions.find(a => a && a.bed_no === bedId && !a.discharge_date);
    };

    const handleFreeBed = (bedId: string) => {
        const admission = getBedStatus(bedId);
        if (!admission) return;
        
        if (window.confirm(`Are you sure you want to manually FREE bed ${bedId}? This will remove the bed assignment from ${admission.patient_name}.`)) {
            setAdmissions(prev => prev.map(adm => {
                if (adm.admission_id === admission.admission_id) {
                    return { ...adm, bed_no: '' };
                }
                return adm;
            }));
            setSuccessMessage(`Bed ${bedId} has been freed.`);
        }
    };

    const handlePrintBedMap = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const styles = `<style>@page{size:A4; margin:15mm} body{font-family:sans-serif} .header{text-align:center; border-bottom:2px solid #000; padding-bottom:10px} .ward{margin-top:20px; border:1px solid #ccc; border-radius:10px; padding:15px} .grid{display:grid; grid-template-columns:repeat(4,1fr); gap:10px} .bed{border:1px solid #000; padding:10px; font-size:10px} .occupied{background:#fecaca}</style>`;
        const html = `<html><head>${styles}</head><body>
            <div class="header"><h1>Niramoy Clinic & Diagnostic</h1><p>Inpatient Bed Occupancy Map - ${new Date().toLocaleDateString()}</p></div>
            ${(Array.isArray(wards) ? wards : []).map(w => w && `
                <div class="ward">
                    <h3>${w.name || ''}</h3>
                    <div class="grid">
                        ${(Array.isArray(w.beds) ? w.beds : []).map(b => {
                            const adm = getBedStatus(b);
                            return `<div class="bed ${adm ? 'occupied' : ''}"><b>Bed: ${b}</b><br>${adm ? `Patient: ${adm.patient_name || ''}<br>Dr: ${adm.doctor_name || ''}` : 'AVAILABLE'}</div>`;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </body></html>`;
        win.document.write(html); win.document.close(); win.print();
    };

    return (
        <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-8 border-slate-800 pb-6 border-b">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Armchair className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" size={28} /> Bed Status Dashboard
                </h3>
                <button onClick={handlePrintBedMap} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-700 shadow-lg">
                    <PrinterIcon size={14}/> Print Bed Map
                </button>
            </div>
            <div className="space-y-12">
                {(Array.isArray(wards) ? wards : []).map(ward => ward && (
                    <div key={ward.id} className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">{ward.name}</h4>
                            <div className="h-px bg-slate-800 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {(Array.isArray(ward.beds) ? ward.beds : []).map(bedId => {
                                const admission = getBedStatus(bedId);
                                const isOccupied = !!admission;
                                return (
                                    <div key={bedId} className={`relative p-5 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between h-44 shadow-2xl overflow-hidden group ${isOccupied ? 'bg-gradient-to-br from-rose-600 to-rose-900 border-rose-500/30 shadow-rose-950/50' : 'bg-gradient-to-br from-emerald-500 to-emerald-800 border-emerald-400/30 shadow-emerald-950/50'}`}>
                                        {/* Glossy Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity"></div>
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
                                        
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black text-white drop-shadow-lg tracking-tighter">{bedId}</span>
                                                <span className="text-[8px] text-white/50 font-black uppercase tracking-widest">{ward.name}</span>
                                            </div>
                                            {isOccupied ? (
                                                <button onClick={() => handleFreeBed(bedId)} className="p-2.5 bg-black/20 hover:bg-rose-500 text-white rounded-2xl transition-all shadow-lg backdrop-blur-md border border-white/10 group-hover:scale-110" title="Free Bed Manually">
                                                    <TrashIcon size={16}/>
                                                </button>
                                            ) : <Armchair className="w-8 h-8 text-white/20 drop-shadow-sm group-hover:text-white/40 transition-colors"/>}
                                        </div>
                                        
                                        {isOccupied ? (
                                            <div className="mt-2 relative z-10">
                                                <div className="text-sm text-white font-black truncate drop-shadow-md mb-0.5" title={admission.patient_name}>{admission.patient_name}</div>
                                                <div className="text-[10px] text-rose-200 font-bold truncate tracking-wider uppercase opacity-80">ID: {admission.admission_id}</div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse"></div>
                                                    <span className="text-[9px] text-white font-black bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-widest">Occupied</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-auto relative z-10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                                                    <span className="text-[9px] text-emerald-100 font-black uppercase tracking-widest opacity-60">Ready for use</span>
                                                </div>
                                                <div className="text-[10px] text-white font-black bg-white/10 px-4 py-1.5 rounded-xl border border-white/10 uppercase tracking-[0.2em] shadow-inner text-center backdrop-blur-sm group-hover:bg-white/20 transition-all">Available</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
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
    const [now] = useState(() => Date.now());
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
        <div className="bg-slate-950 min-h-screen text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30">
            <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-2xl z-10 sticky top-0">
                <div className="max-w-[1600px] mx-auto px-6 py-4 w-full"> 
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all border border-slate-700 hover:border-cyan-500/50 group"><BackIcon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" /></button>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Niramoy Clinic & Diagnostic</h1>
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                                <ClinicIcon className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"/>
                                <div className="flex flex-col items-end">
                                    <h2 className="text-xl font-black text-cyan-50 font-bengali leading-none tracking-tight">ক্লিনিক ডিপার্টমেন্ট</h2>
                                    <p className="text-[9px] font-bold text-cyan-500/70 font-bengali tracking-widest mt-1 uppercase">গভমেন্ট লাইসেন্স: HSM76710</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex bg-slate-900/50 rounded-xl p-1.5 border border-slate-800 overflow-x-auto w-full scrollbar-hide gap-1">
                            <button onClick={() => setActiveTab('admission')} className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'admission' ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/30' : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800/50'}`}>Admission & Treatment</button>
                            <button onClick={() => setActiveTab('patient_info')} className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'patient_info' ? 'bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-lg shadow-cyan-900/40 border border-cyan-400/30' : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50'}`}>Patient Info</button>
                            <button onClick={() => setActiveTab('bed_status')} className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'bed_status' ? 'bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-lg shadow-teal-900/40 border border-teal-400/30' : 'text-slate-500 hover:text-teal-400 hover:bg-slate-800/50'}`}>Bed Status</button>
                            <button onClick={() => setActiveTab('invoice')} className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'invoice' ? 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-lg shadow-blue-900/40 border border-blue-400/30' : 'text-slate-500 hover:text-blue-400 hover:bg-slate-800/50'}`}>Indoor Invoice</button>
                            <button onClick={() => setActiveTab('due_collection')} className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'due_collection' ? 'bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-lg shadow-amber-900/40 border border-amber-400/30' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800/50'}`}>Due Collection</button>
                            <button onClick={() => setActiveTab('report_summary')} className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'report_summary' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-700 text-white shadow-lg shadow-purple-900/40 border border-purple-400/30' : 'text-slate-500 hover:text-purple-400 hover:bg-slate-800/50'}`}>Report Summary</button>
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
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
                            <PatientInfoPage patients={patients} setPatients={setPatients} isEmbedded={false} />
                        </div>
                    </div>

                    <div className={activeTab === 'bed_status' ? 'block' : 'hidden'}>
                        <BedManagementPage admissions={admissions} setAdmissions={setAdmissions} setSuccessMessage={setSuccessMessage} />
                    </div>

                    <div className={activeTab === 'invoice' ? 'block' : 'hidden'}>
                        <IndoorInvoicePage admissions={admissions} doctors={doctors} referrars={referrars} employees={employees} indoorInvoices={indoorInvoices} setIndoorInvoices={setIndoorInvoices} setSuccessMessage={setSuccessMessage} medicines={medicines} setAdmissions={setAdmissions} detailedExpenses={detailedExpenses} patients={patients} />
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
