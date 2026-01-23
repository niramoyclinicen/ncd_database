
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Patient, Doctor, Employee, Medicine, Referrar, MedicineItem } from './DiagnosticData';
import SearchableSelect from './SearchableSelect';
import PatientInfoPage from './PatientInfoPage';
import DoctorInfoPage from './DoctorInfoPage';
import ReferrerInfoPage from './ReferrerInfoPage';
import { BackIcon, ClinicIcon, StethoscopeIcon, ClipboardIcon, FileTextIcon, SettingsIcon, UserPlusIcon, Armchair, Activity, SaveIcon, MoneyIcon, TrashIcon, PrinterIcon, EyeIcon, SearchIcon } from './Icons';

// Fixed Clinic Config
const CLINIC_REGISTRATION = 'HSM76710';

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
  discharge_date: ''
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
const serviceCategoriesList = ["Conservative treatment", "Operation", "NVD and D&C", "O2 and nebulizer", "Plaster and Bandage", "Others"];
const serviceTypesList = [
    'Admission Fee', 'Doctor round fee', 'Doctor prescription fee', 'Bed rent', 'Service Charge',
    'Obstetrician/ Midwife', 'Anaesthetist', 'Assistant_1', 'Assistant_2', 'Medicine', 'Stuff_cost', 'Surgeon', 'Other'
];
const doctorServiceTypes = [
    "Doctor round fee", "Doctor prescription fee", "Obstetrician/ Midwife", "Surgeon", "Anaesthetist", "Assistant_1", "Assistant_2"
];

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

    const [newMedication, setNewMedication] = useState<Medication>({ id: 0, type: 'Tab', name: '', dosage: '', frequency: 8, category: 'Conservative' });
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
        const dateStr = today.toISOString().split('T')[0];
        const count = admissions.filter(a => a.admission_id.startsWith(`ADM-${dateStr}`)).length + 1;
        const newId = `ADM-${dateStr}-${String(count).padStart(3, '0')}`;
        setAdmissionData({ ...emptyAdmission, admission_id: newId, admission_date: dateStr });
        setSelectedAdmissionId(null);
    };

    // SYNC FUNCTION: Propagates current admission record changes to the global admissions list
    const syncAdmissionToGlobal = (record: AdmissionRecord) => {
        setAdmissions((prev: any) => {
            const idx = prev.findIndex((a: any) => a.admission_id === record.admission_id);
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
        setNewMedication(prev => ({ ...prev, name: '', dosage: '', genericName: '' }));
        setSelectedDrugId('');
    };

    const removeMedicationFromDraft = (id: number) => {
        setCurrentOrder(prev => ({ ...prev, medications: prev.medications?.filter(m => m.id !== id) }));
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

    const handleSaveOrder = () => {
        if (!currentOrder.date || !currentOrder.time) return alert("Date/Time required");
        if (!admissionData.admission_id) return alert("Save admission info first.");

        let updatedOrders = [...admissionData.clinical_orders];
        if (editingOrderBlockId) {
            updatedOrders = updatedOrders.map(order => order.id === editingOrderBlockId ? { ...order, ...currentOrder as ClinicalOrderBlock } : order);
        } else {
            const newBlock: ClinicalOrderBlock = { id: Date.now().toString(), ...currentOrder as ClinicalOrderBlock };
            updatedOrders = [newBlock, ...updatedOrders];
        }
        
        const updatedAdmission = { ...admissionData, clinical_orders: updatedOrders };
        setAdmissionData(updatedAdmission);
        syncAdmissionToGlobal(updatedAdmission); // Auto sync to global list
        
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
        const medsWithNewIds = t.medications.map(m => ({
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
        setDrugDemands((prev: any) => [demand, ...prev]);

        setSuccessMessage("New drug added for prescription!");
        setShowDrugDemandModal(false);
        setNewDrugEntry({ name: '', generic: '', type: 'Tab', strength: '' });
    };

    const activeNurses = useMemo(() => employees.filter(e => e.is_current_month), [employees]);
    const filteredAdmissions = useMemo(() => admissions.filter(a => a.admission_id.toLowerCase().includes(searchTerm.toLowerCase()) || a.patient_name.toLowerCase().includes(searchTerm.toLowerCase())), [admissions, searchTerm]);
    const commonInputClass = "w-full p-2 bg-[#2d3748] border border-gray-600 rounded text-gray-200 text-sm focus:ring-1 focus:ring-blue-500";

    return (
        <div className="space-y-6">
            <div className="flex bg-[#20293a] p-1 rounded-lg border border-[#374151] mb-6">
                <button onClick={() => setPageMode('admission')} className={`flex-1 py-3 px-4 rounded-md font-bold text-sm uppercase tracking-wide transition-all ${pageMode === 'admission' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}> <ClipboardIcon className="w-4 h-4 inline-block mr-2 mb-1"/> Admission Section </button>
                <button onClick={() => setPageMode('treatment')} className={`flex-1 py-3 px-4 rounded-md font-bold text-sm uppercase tracking-wide transition-all ${pageMode === 'treatment' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}> <StethoscopeIcon className="w-4 h-4 inline-block mr-2 mb-1"/> Treatment Section </button>
            </div>

            {pageMode === 'admission' && (
                <>
                    <div className="bg-[#1f2937] p-6 rounded-lg border border-gray-700 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Admission Information Entry</h3>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <label className="text-gray-300 text-sm">ID:</label>
                                <input type="text" value={admissionData.admission_id} disabled className="w-40 p-2 bg-[#1a202c] border border-gray-600 rounded text-gray-300 text-sm" placeholder="Auto-ID" />
                            </div>
                            <button onClick={handleGetNewId} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Add New</button>
                            <button onClick={handleSaveAdmission} className="px-4 py-2 bg-[#22c55e] hover:bg-green-700 text-white rounded text-sm">Save</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div><label className="block text-xs text-gray-400">Date</label><input type="date" value={admissionData.admission_date} onChange={e => setAdmissionData({...admissionData, admission_date: e.target.value})} className={commonInputClass} /></div>
                            <div className="md:col-span-2">
                                <SearchableSelect 
                                    theme="dark" 
                                    label="Patient" 
                                    options={patients.map(p => ({ 
                                        id: p.pt_id, 
                                        name: p.pt_name, 
                                        details: `Age: ${p.ageY}Y | Sex: ${p.gender} | Mob: ${p.mobile} | Add: ${p.address}` 
                                    }))} 
                                    value={admissionData.patient_id} 
                                    onChange={(id, name) => setAdmissionData({...admissionData, patient_id: id, patient_name: name})} 
                                    onAddNew={() => setShowNewPatientForm(true)} 
                                    inputHeightClass="h-[38px] bg-[#2d3748] border-gray-600" 
                                />
                            </div>
                            <div className="md:col-span-1"><SearchableSelect theme="dark" label="Doctor" options={doctors.map(d => ({ id: d.doctor_id, name: d.doctor_name, details: d.degree }))} value={admissionData.doctor_id} onChange={(id, name) => setAdmissionData({...admissionData, doctor_id: id, doctor_name: name})} onAddNew={() => setShowNewDoctorForm(true)} inputHeightClass="h-[38px] bg-[#2d3748] border-gray-600" /></div>
                            <div className="md:col-span-1"><SearchableSelect theme="dark" label="Referrer" options={referrars.map(r => ({ id: r.ref_id, name: r.ref_name, details: r.ref_degrees }))} value={admissionData.referrer_id} onChange={(id, name) => setAdmissionData({...admissionData, referrer_id: id, referrer_name: name})} onAddNew={() => setShowNewReferrarForm(true)} inputHeightClass="h-[38px] bg-[#2d3748] border-gray-600" /></div>
                            <div className="md:col-span-1">
                                <label className="block text-xs text-gray-400 mb-1">Bed No</label>
                                <select 
                                    value={admissionData.bed_no || ''} 
                                    onChange={e => setAdmissionData({...admissionData, bed_no: e.target.value})} 
                                    className="w-full p-2 bg-[#2d3748] border border-gray-600 rounded text-gray-200 text-sm focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Select Bed...</option>
                                    <optgroup label="Male Ward">
                                        {Array.from({length: 5}, (_, i) => `M-${String(i+1).padStart(2, '0')}`).map(b => <option key={b} value={b}>{b}</option>)}
                                    </optgroup>
                                    <optgroup label="Female Ward">
                                        {Array.from({length: 5}, (_, i) => `F-${String(i+1).padStart(2, '0')}`).map(b => <option key={b} value={b}>{b}</option>)}
                                    </optgroup>
                                    <optgroup label="Cabins">
                                        {['CAB-101', 'CAB-102', 'CAB-103', 'CAB-104', 'VIP-01'].map(b => <option key={b} value={b}>{b}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div className="md:col-span-1"><SearchableSelect theme="dark" label="Chief complaint / Indication" options={indications.map(i => ({ id: i.id, name: i.name }))} value={indications.find(i => i.name === admissionData.indication)?.id || ''} onChange={(id, name) => setAdmissionData({...admissionData, indication: name})} onAddNew={() => setShowIndicationManager(true)} inputHeightClass="h-[38px] bg-[#2d3748] border-gray-600" /></div>
                            <div className="md:col-span-1"><SearchableSelect theme="dark" label="Service" options={services.map(s => ({ id: s.id, name: s.name }))} value={services.find(s => s.name === admissionData.service_name)?.id || ''} onChange={(id, name) => setAdmissionData({...admissionData, service_name: name})} onAddNew={() => setShowServiceManager(true)} inputHeightClass="h-[38px] bg-[#2d3748] border-gray-600" /></div>
                            <div className="md:col-span-1"><label className="block text-xs text-gray-400">Service Category</label><select value={admissionData.service_category} onChange={e => setAdmissionData({...admissionData, service_category: e.target.value})} className={commonInputClass}>{serviceCategoriesList.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div className="md:col-span-1"><label className="block text-xs text-gray-400">Contract</label><select value={admissionData.contract_type} onChange={e => setAdmissionData({...admissionData, contract_type: e.target.value as any})} className={commonInputClass}><option value="Non-Contact">Non-Contact</option><option value="Contact">Contact</option></select></div>
                            {admissionData.contract_type === 'Contact' && <div className="md:col-span-1"><label className="block text-xs text-gray-400">Amount</label><input type="number" value={admissionData.contract_amount} onChange={e => setAdmissionData({...admissionData, contract_amount: Number(e.target.value)})} className={commonInputClass} /></div>}
                        </div>
                    </div>
                    <div className="bg-[#20293a] p-6 rounded-lg border border-gray-700 shadow-xl mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Admitted Patients List</h3>
                            <div className="flex gap-4">
                                <button onClick={handlePrintAdmissionList} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2"><FileTextIcon className="w-4 h-4"/> Print List</button>
                                <input type="text" placeholder="Search List..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 bg-[#1a202c] border border-gray-600 rounded text-gray-200 text-sm"/>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-[#1f2937] uppercase text-xs text-gray-400 border-b border-gray-600"><tr><th className="p-3">ID</th><th className="p-3">Date</th><th className="p-3">Patient Name</th><th className="p-3">Bed</th><th className="p-3">Gender/Age</th><th className="p-3">Contact</th><th className="p-3">Address</th><th className="p-3 text-center">Actions</th></tr></thead>
                                <tbody>
                                    {filteredAdmissions.length > 0 ? filteredAdmissions.map(adm => {
                                        const pat = patients.find(p => p.pt_id === adm.patient_id);
                                        return (
                                            <tr key={adm.admission_id} className="border-b border-gray-700 hover:bg-gray-800">
                                                <td className="p-3 font-mono text-blue-300">{adm.admission_id}</td>
                                                <td className="p-3">{adm.admission_date}</td>
                                                <td className="p-3 font-bold text-white">{adm.patient_name}</td>
                                                <td className="p-3 text-yellow-400">{adm.bed_no || 'N/A'}</td>
                                                <td className="p-3">{pat ? `${pat.gender}, ${pat.ageY}Y` : ''}</td>
                                                <td className="p-3">{pat?.mobile}</td>
                                                <td className="p-3 text-xs">{pat?.address}</td>
                                                <td className="p-3 text-center space-x-2"><button onClick={() => handleEditAdmissionInfo(adm)} className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs">Edit Info</button><button onClick={() => handleSelectPatientForTreatment(adm)} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold">Treat</button></td>
                                            </tr>
                                        );
                                    }) : ( <tr><td colSpan={8} className="p-6 text-center text-gray-500">No admitted patients found.</td></tr> )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {pageMode === 'treatment' && (
                <>
                    <div className="bg-[#172554] p-4 rounded-lg border border-blue-800 shadow-lg mb-4 flex justify-between items-center">
                        <div>
                            {admissionData.admission_id ? ( <div><h2 className="text-xl font-bold text-white">Treating: <span className="text-yellow-400">{admissionData.patient_name}</span></h2><p className="text-sm text-blue-200">ID: {admissionData.admission_id} | Dr: {admissionData.doctor_name} | Bed: {admissionData.bed_no || 'N/A'}</p></div> ) : ( <div className="text-yellow-300 font-bold">Please select a patient from the Admission Section list first.</div> )}
                        </div>
                        {admissionData.admission_id && ( 
                            <div className="flex gap-4 items-center">
                                <button onClick={handlePrintTreatmentRecord} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-all"><FileTextIcon className="w-5 h-5"/> Print Full Chart</button>
                                <div className="text-right"><span className="block text-xs text-gray-400 uppercase">Status</span><span className="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded font-bold">Admitted</span></div> 
                            </div>
                        )}
                    </div>
                    {admissionData.admission_id && (
                        <div className="bg-[#20293a] p-4 rounded-lg border border-[#374151] shadow-lg">
                            <div className="flex gap-4 border-b border-gray-700 pb-2 mb-4">
                                {['orders', 'rounds', 'nurse', 'demands'].map(t => ( <button key={t} onClick={() => setActiveSubTab(t as any)} className={`px-4 py-2 font-bold ${activeSubTab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}> {t === 'orders' ? 'Doctor Orders' : t === 'rounds' ? 'Doctor Round' : t === 'demands' ? 'Drug Demands' : 'Nurse Chart'} </button> ))}
                            </div>
                            {activeSubTab === 'orders' && (
                                <div className="space-y-4">
                                    <div className="bg-[#172554] p-4 rounded border border-[#374151]">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-sky-300 uppercase">{editingOrderBlockId ? "Edit Treatment / Order" : "Add Treatment / Order"}</h4>
                                            <div className="flex gap-2">
                                                <button onClick={() => setShowTemplateModal(true)} className="text-xs bg-indigo-600 px-2 py-1 rounded text-white hover:bg-indigo-500">Templates</button>
                                                {editingOrderBlockId && <button onClick={() => { setEditingOrderBlockId(null); setCurrentOrder({ category: 'Conservative', diet: 'Regular', medications: [], note: '', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) }); }} className="text-xs text-red-300 hover:text-white">Cancel Edit</button>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4 mb-4">
                                            <div><label className="text-xs text-gray-400 block">Date</label><input type="date" value={currentOrder.date} onChange={e=>setCurrentOrder({...currentOrder, date: e.target.value})} className={commonInputClass}/></div>
                                            <div><label className="text-xs text-gray-400 block">Time</label><input type="time" value={currentOrder.time} onChange={e=>setCurrentOrder({...currentOrder, time: e.target.value})} className={commonInputClass}/></div>
                                            <div><label className="text-xs text-gray-400 block">Category</label><select value={currentOrder.category} onChange={e=>setCurrentOrder({...currentOrder, category: e.target.value as any})} className={commonInputClass}><option value="Conservative">Conservative</option><option value="Pre-operative">Pre-operative</option><option value="Operative">Operative</option><option value="Post-operative">Post-operative</option></select></div>
                                            <div><label className="text-xs text-gray-400 block">Diet</label><select value={currentOrder.diet} onChange={e=>setCurrentOrder({...currentOrder, diet: e.target.value})} className={commonInputClass}>{dietOptions.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                                        </div>
                                        <div className="bg-[#283245] p-3 rounded mb-4">
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1 relative"><SearchableSelect theme="dark" label="" options={medicines.map(m => ({ id: m.id, name: `${m.tradeName} (${m.genericName})` }))} value={selectedDrugId} onChange={handleMedicineSelect} placeholder="Search Drug..." inputHeightClass="h-9 bg-[#374151]" /><button onClick={() => setShowDrugDemandModal(true)} className="absolute right-1 top-1.5 h-6 w-6 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full font-bold flex items-center justify-center text-sm z-20">+</button></div>
                                                <select value={newMedication.type} onChange={e=>setNewMedication({...newMedication, type:e.target.value})} className="h-9 bg-[#374151] border-gray-600 rounded text-gray-200 text-xs px-2">{drugTypes.map(t=><option key={t} value={t}>{t}</option>)}</select>
                                                <input value={newMedication.dosage} onChange={e=>setNewMedication({...newMedication, dosage:e.target.value})} placeholder="Dose" className="h-9 bg-[#374151] border border-gray-600 rounded text-gray-200 text-xs px-2 w-20"/>
                                                <select value={newMedication.frequency} onChange={e=>setNewMedication({...newMedication, frequency:Number(e.target.value)})} className="h-9 bg-[#374151] border-gray-600 rounded text-gray-200 text-xs px-2">{drugFrequencies.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select>
                                                <button onClick={addMedicationToDraft} className="h-9 w-9 bg-blue-600 text-white rounded font-bold hover:bg-blue-500">+</button>
                                            </div>
                                        </div>
                                        <div className="bg-[#111827] p-2 rounded border border-gray-700 mb-4 min-h-[60px]">
                                            {currentOrder.medications?.map((m, i) => (<div key={m.id} className="flex justify-between items-center text-sm text-gray-300 border-b border-gray-800 pb-1 mb-1"><span>{i+1}. <b>{m.type} {m.name}</b> ({m.dosage}) --- <span className="text-yellow-500">{getFrequencyText(m.frequency)}</span></span><button onClick={()=>removeMedicationFromDraft(m.id)} className="text-red-500 text-xs font-bold">X</button></div>))}
                                        </div>
                                        <div className="mb-4"><textarea value={currentOrder.note} onChange={e=>setCurrentOrder({...currentOrder, note:e.target.value})} className="w-full p-2 bg-[#283245] border border-gray-600 rounded text-white text-sm h-12" placeholder="Note"/></div>
                                        <button onClick={handleSaveOrder} className={`w-full py-2 ${editingOrderBlockId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white font-bold rounded`}>{editingOrderBlockId ? "Update Order" : "Save Order"}</button>
                                    </div>
                                    <div className="space-y-4">
                                        {admissionData.clinical_orders.map(block => (
                                            <div key={block.id} className={`bg-[#172554] border ${editingOrderBlockId === block.id ? 'border-yellow-500 ring-2 ring-yellow-500' : 'border-gray-600'} rounded shadow`}>
                                                <div className="bg-[#2d3748] p-2 flex justify-between items-center border-b border-gray-600"><div className="flex gap-3 items-center"><span className="text-blue-400 font-bold font-mono">{block.date} {block.time}</span><span className="text-xs bg-blue-900 px-2 py-0.5 rounded text-blue-200">{block.category}</span><span className="text-green-400 text-sm">Diet: {block.diet}</span></div><div className="flex gap-2"><button onClick={() => handleEditOrder(block)} className="text-yellow-500 text-xs font-bold hover:text-yellow-400">EDIT</button><button onClick={()=>{if(confirm("Delete?")) setAdmissionData((prev: any)=>({...prev, clinical_orders: prev.clinical_orders.filter((o: any)=>o.id!==block.id)}))}} className="text-red-500 text-xs font-bold hover:text-red-400">DEL</button></div></div>
                                                <div className="p-3">{block.medications.map((m, i) => (<div key={i} className="text-sm text-gray-200 flex items-center mb-1"><span className="w-5 text-gray-500">{i+1}.</span><span className="font-bold">{m.type} {m.name}</span><span className="text-gray-400 ml-2">({m.dosage})</span><span className="mx-2 text-gray-600">---</span><span className="text-yellow-500 font-mono">{getFrequencyText(m.frequency)}</span></div>))}{block.note && <div className="mt-2 pt-2 border-t border-gray-700 text-sm text-amber-200"><span className="text-gray-500 text-xs font-bold mr-2">NOTE:</span>{block.note}</div>}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {activeSubTab === 'rounds' && (
                                <div className="bg-[#172554] p-4 rounded border border-[#374151]">
                                    <div className="flex gap-2 mb-4"><input type="time" value={roundTime} onChange={e=>setRoundTime(e.target.value)} className="bg-[#374151] border border-gray-600 rounded text-white p-2 w-32"/><input list="doctor_list_round" type="text" value={roundDoctor} onChange={e=>setRoundDoctor(e.target.value)} placeholder="Doctor" className="bg-[#374151] border border-gray-600 rounded text-white p-2 w-48"/><datalist id="doctor_list_round">{doctors.map(d=><option key={d.doctor_id} value={d.doctor_name}/>)}</datalist><input type="text" value={newRoundNote} onChange={e=>setNewRoundNote(e.target.value)} placeholder="Round Note..." className="flex-1 bg-[#374151] border border-gray-600 rounded text-white p-2"/><button onClick={()=>{if(!newRoundNote)return; const updated = {...admissionData, doctor_rounds:[...admissionData.doctor_rounds, {id:Date.now(), date:new Date().toISOString().split('T')[0], time:roundTime, note:newRoundNote, by:roundDoctor}]}; setAdmissionData(updated); syncAdmissionToGlobal(updated); setNewRoundNote('');}} className="bg-teal-600 text-white px-4 py-2 rounded">Add</button></div>
                                    <div className="max-h-60 overflow-y-auto bg-[#111827] rounded"><table className="w-full text-sm text-left text-gray-300"><thead className="bg-[#1f2937] text-xs uppercase text-gray-400"><tr><th className="p-2">Time</th><th className="p-2">Note</th><th className="p-2">By</th><th className="p-2 text-right">X</th></tr></thead><tbody>{admissionData.doctor_rounds.map(r=><tr key={r.id} className="border-b border-gray-700"><td className="p-2">{r.time}</td><td className="p-2">{r.note}</td><td className="p-2">{r.by}</td><td className="p-2 text-right"><button onClick={()=>{const updated = {...admissionData, doctor_rounds:admissionData.doctor_rounds.filter(x=>x.id!==r.id)}; setAdmissionData(updated); syncAdmissionToGlobal(updated);}} className="text-red-500">x</button></td></tr>)}</tbody></table></div>
                                </div>
                            )}

                            {activeSubTab === 'nurse' && (
                                <div className="space-y-6">
                                    <div className="bg-[#172554] p-5 rounded border border-[#374151]">
                                        <div className="flex items-center gap-4 mb-4 bg-[#1f2937] p-4 rounded border border-[#374151] shadow-md"><div className="w-96"><SearchableSelect theme="dark" label="Select Performing Nurse (Logged)" options={activeNurses.map(nurse => ({ id: nurse.emp_name, name: nurse.emp_name, details: nurse.job_position }))} value={performingNurse} onChange={(id, name) => setPerformingNurse(name)} onAddNew={() => {}} placeholder="Search Nurse..." inputHeightClass="h-10 bg-[#374151] border-gray-600" /></div></div>
                                        <h4 className="text-lg font-bold text-purple-400 mb-4 uppercase tracking-wide">Scheduled Medications</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left text-gray-300 border-collapse">
                                                <thead className="bg-[#111827] text-xs uppercase font-bold text-gray-400">
                                                    <tr>
                                                        <th className="p-3 border border-gray-600">Drug Details</th>
                                                        <th className="p-3 border border-gray-600">Frequency</th>
                                                        <th className="p-3 border border-gray-600">Category</th>
                                                        <th className="p-3 border border-gray-600">Last Given</th>
                                                        <th className="p-3 border border-gray-600">Next Dose Due</th>
                                                        <th className="p-3 border border-gray-600 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-[#1f2937]">
                                                    {admissionData.clinical_orders.flatMap(o => o.medications).map((med, idx) => {
                                                        const logs = admissionData.nurse_chart.filter(l => l.medicationId === med.id).sort((a, b) => b.id - a.id);
                                                        const lastLog = logs[0];
                                                        let statusText = 'Not Started';
                                                        let nextTimeText = 'Start Now';
                                                        let lastGivenText = 'Never';
                                                        let lastGivenSrc = '';
                                                        let nextColorClass = 'text-red-400 font-bold';
                                                        let lastColorClass = 'text-gray-400';

                                                        const substituteMed = medicines.find(m => 
                                                            med.genericName && m.genericName && 
                                                            m.genericName.toLowerCase() === med.genericName.toLowerCase() && 
                                                            m.stock > 0
                                                        );
                                                        
                                                        const autoSrc = substituteMed ? 'Clinic' : 'Outside';
                                                        const currentSrc = medicationSources[med.id] || autoSrc;

                                                        if (lastLog) {
                                                            lastGivenText = lastLog.time;
                                                            lastGivenSrc = lastLog.supplySrc === 'Outside' ? '(Outside)' : '(Clinic)';
                                                            lastColorClass = 'text-gray-300';
                                                            if (med.frequency === 0) {
                                                                statusText = 'Completed';
                                                                nextTimeText = '-';
                                                                nextColorClass = 'text-green-400';
                                                            } else {
                                                                const lastTimeMs = lastLog.id; 
                                                                const nextTimeMs = lastTimeMs + (med.frequency * 60 * 60 * 1000);
                                                                const nextDate = new Date(nextTimeMs);
                                                                const now = Date.now();
                                                                const isOverdue = now > nextTimeMs;
                                                                nextTimeText = `Next: ${nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                                statusText = isOverdue ? 'Overdue' : 'On Schedule';
                                                                nextColorClass = isOverdue ? 'text-red-400 font-bold' : 'text-green-400 font-medium';
                                                            }
                                                        }

                                                        return (
                                                            <tr key={`${med.id}-${idx}`} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                                <td className="p-3 border border-gray-700 font-medium text-gray-100 text-base">{med.type}. {med.name} ({med.dosage})</td>
                                                                <td className="p-3 border border-gray-700">{getFrequencyText(med.frequency)}</td>
                                                                <td className="p-3 border border-gray-700">{med.category}</td>
                                                                <td className={`p-3 border border-gray-700 ${lastColorClass}`}>{statusText} ({lastGivenText}) <span className="text-xs text-yellow-500">{lastGivenSrc}</span></td>
                                                                <td className={`p-3 border border-gray-700 ${nextColorClass} text-base`}>{nextTimeText}</td>
                                                                <td className="p-3 border border-gray-700 text-right">
                                                                    <div className="flex flex-col gap-1 items-end">
                                                                        <div className="flex gap-2 items-center">
                                                                            <select 
                                                                                value={currentSrc}
                                                                                onChange={(e) => setMedicationSources(prev => ({...prev, [med.id]: e.target.value as 'Clinic' | 'Outside'}))}
                                                                                className="bg-[#374151] text-xs text-white p-1 rounded border border-gray-600"
                                                                            >
                                                                                <option value="Clinic">Clinic Supply</option>
                                                                                <option value="Outside">Patient/Outside</option>
                                                                            </select>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    if(!performingNurse) return alert("Select Nurse First");
                                                                                    
                                                                                    // 3. OVERDOSE PREVENTION: Check if medicine was given less than 2 mins (120,000 ms) ago
                                                                                    if (lastLog && (Date.now() - lastLog.id < 120000)) {
                                                                                        if (!confirm("সতর্কতা: এই ঔষধটি মাত্র ২ মিনিট আগে দেওয়া হয়েছে। আপনি কি পুনরায় দিতে চান? (Medicine given < 2 mins ago. Proceed?)")) {
                                                                                            return;
                                                                                        }
                                                                                    }

                                                                                    let finalInventoryId = med.inventoryId;
                                                                                    if (currentSrc === 'Clinic') {
                                                                                        if (substituteMed) {
                                                                                            finalInventoryId = substituteMed.id;
                                                                                            const updatedMedicines = medicines.map(m => 
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
                                                                                    const updated = {...admissionData, nurse_chart: [newLog, ...admissionData.nurse_chart]};
                                                                                    setAdmissionData(updated);
                                                                                    syncAdmissionToGlobal(updated); // IMMEDIATE SYNC FOR INVOICE
                                                                                }} 
                                                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow transition-colors"
                                                                            >
                                                                                Give
                                                                            </button>
                                                                        </div>
                                                                        {substituteMed ? (
                                                                            <span className="text-[10px] text-green-400 font-bold">
                                                                                Available: {substituteMed.tradeName} (Stock: {substituteMed.stock})
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] text-red-400 font-bold">Out of Stock</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {admissionData.clinical_orders.flatMap(o => o.medications).length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500 text-base">No medications ordered by doctor yet.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="bg-[#172554] p-4 rounded border border-[#374151]">
                                        <div className="flex gap-2 mb-2"><input type="text" value={newNurseNote} onChange={e => setNewNurseNote(e.target.value)} placeholder="Nurse Note..." className="flex-1 p-3 bg-[#374151] border border-gray-600 rounded text-gray-200"/><button onClick={() => { if(!performingNurse) return alert("Select Nurse"); const updated = {...admissionData, nurse_chart: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), note: newNurseNote, by: performingNurse }, ...admissionData.nurse_chart]}; setAdmissionData(updated); syncAdmissionToGlobal(updated); setNewNurseNote('');}} className="bg-purple-600 text-white px-6 py-3 rounded">Log</button></div>
                                        <div className="max-h-60 overflow-y-auto bg-[#111827] rounded"><table className="w-full text-sm text-left text-gray-300"><thead className="bg-[#1f2937] sticky top-0"><tr><th className="p-2">Time</th><th className="p-2">Activity</th><th className="p-2">Nurse</th></tr></thead><tbody>{admissionData.nurse_chart.map(n=><tr key={n.id} className="border-b border-gray-700"><td className="p-2">{n.time}</td><td className="p-2">{n.note}</td><td className="p-2 text-purple-400">{n.by}</td></tr>)}</tbody></table></div>
                                    </div>
                                </div>
                            )}
                            {activeSubTab === 'demands' && (
                                <div className="bg-[#172554] p-6 rounded border border-[#374151]"><h4 className="text-xl font-bold text-yellow-400 mb-4">Drug Demand List</h4><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-300"><thead className="bg-[#111827] text-xs uppercase text-gray-400"><tr><th className="p-3">Drug</th><th className="p-3">Generic</th><th className="p-3">Req By</th><th className="p-3">Status</th></tr></thead><tbody className="bg-[#1f2937]">{drugDemands.map(req => (<tr key={req.id}><td className="p-3">{req.name} <span className="text-xs text-gray-400">({req.type})</span></td><td className="p-3">{req.genericName}</td><td className="p-3">{req.requestedBy}</td><td className="p-3">{req.status}</td></tr>))}</tbody></table></div></div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {showIndicationManager && <GenericManagerPage title="Manage Indication" placeholder="Enter Indication Name" items={indications} setItems={setIndications as any} onClose={()=>setShowIndicationManager(false)} onSaveAndSelect={(id, name)=>{setAdmissionData((prev: any)=>({...prev, indication:name})); setShowIndicationManager(false);}} />}
            {showServiceManager && <GenericManagerPage title="Manage Services" placeholder="Enter Service Name" items={services} setItems={setServices as any} onClose={()=>setShowServiceManager(false)} onSaveAndSelect={(id, name)=>{setAdmissionData((prev: any)=>({...prev, service_name:name})); setShowServiceManager(false);}} />}
            {showNewPatientForm && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"><div className="bg-[#1f2937] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-600"><div className="p-4"><PatientInfoPage patients={patients} setPatients={setPatients} isEmbedded={true} onClose={()=>setShowNewPatientForm(false)} onSaveAndSelect={(id,name)=>{setAdmissionData((prev: any)=>({...prev, patient_id:id, patient_name:name})); setShowNewPatientForm(false);}}/></div></div></div>}
            {showNewDoctorForm && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"><div className="bg-[#1f2937] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-600"><div className="p-4"><DoctorInfoPage doctors={doctors} setDoctors={setDoctors} isEmbedded={true} onClose={()=>setShowNewDoctorForm(false)} onSaveAndSelect={(id,name)=>{setAdmissionData((prev: any)=>({...prev, doctor_id:id, doctor_name:name})); setShowNewDoctorForm(false);}}/></div></div></div>}
            {showNewReferrarForm && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"><div className="bg-[#1f2937] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-600"><div className="p-4"><ReferrerInfoPage referrars={referrars} setReferrars={setReferrars} isEmbedded={true} onClose={()=>setShowNewReferrarForm(false)} onSaveAndSelect={(id,name)=>{setAdmissionData((prev: any)=>({...prev, referrer_id:id, referrer_name:name})); setShowNewReferrarForm(false);}}/></div></div></div>}
            {showDrugDemandModal && <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-[#1f2937] rounded-lg w-full max-w-md border border-gray-600 shadow-2xl p-6"><h3 className="text-xl font-bold text-white mb-4">New Drug</h3><input value={newDrugEntry.name} onChange={e=>setNewDrugEntry({...newDrugEntry, name:e.target.value})} className="w-full p-2 bg-[#2d3748] border border-gray-600 rounded text-white mb-2" placeholder="Trade Name"/><input value={newDrugEntry.generic} onChange={e=>setNewDrugEntry({...newDrugEntry, generic:e.target.value})} className="w-full p-2 bg-[#2d3748] border border-gray-600 rounded text-white mb-4" placeholder="Generic Name (e.g. Paracetamol)"/><button onClick={handleSaveNewDrugEntry} className="px-4 py-2 bg-blue-600 text-white rounded">Add</button><button onClick={()=>setShowDrugDemandModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded ml-2">Cancel</button></div></div>}
            
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1f2937] rounded-lg w-full max-w-lg border border-gray-600 shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Treatment Templates</h3>
                        <div className="flex gap-2 mb-6">
                            <input value={newTemplateName} onChange={e=>setNewTemplateName(e.target.value)} placeholder="New Template Name" className="flex-1 p-2 bg-[#2d3748] border border-gray-600 rounded text-white"/>
                            <button onClick={handleSaveTemplate} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500">Save Current Order as Template</button>
                        </div>
                        <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase">Saved Templates</h4>
                        <div className="max-h-60 overflow-y-auto bg-[#111827] rounded border border-gray-700 p-2">
                            {templates.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-2 hover:bg-gray-800 border-b border-gray-800 last:border-0">
                                    <div onClick={() => handleLoadTemplate(t)} className="cursor-pointer flex-1">
                                        <div className="font-bold text-blue-400">{t.name}</div>
                                        <div className="text-xs text-gray-500">{t.category} - {t.medications.length} meds</div>
                                    </div>
                                    <button onClick={()=>{setTemplates((prev: any)=>prev.filter((x: any)=>x.id!==t.id))}} className="text-red-500 text-xs">Del</button>
                                </div>
                            ))}
                            {templates.length === 0 && <div className="text-center text-gray-500 p-4">No templates saved yet.</div>}
                        </div>
                        <div className="mt-4 text-right"><button onClick={()=>setShowTemplateModal(false)} className="bg-slate-600 text-white px-4 py-2 rounded">Close</button></div>
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
}> = ({ admissions, doctors, referrars, employees, indoorInvoices, setIndoorInvoices, setSuccessMessage, medicines, setAdmissions }) => {
    const [formData, setFormData] = useState<IndoorInvoice>(emptyIndoorInvoice);
    const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRecord | null>(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [applyPC, setApplyPC] = useState(false); 

    const activeEmployees = useMemo(() => employees.filter(e => e.is_current_month), [employees]);

    // Calculate Stats
    const stats = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentMonth = today.substring(0, 7);
        const currentYear = now.getFullYear().toString();

        let todayColl = 0, todayDue = 0, monthColl = 0, yearColl = 0, totalDue = 0;

        indoorInvoices.forEach(inv => {
            if (inv.invoice_date === today) {
                todayColl += inv.paid_amount;
                todayDue += inv.due_bill;
            }
            if (inv.invoice_date.startsWith(currentMonth)) {
                monthColl += inv.paid_amount;
            }
            if (inv.invoice_date.startsWith(currentYear)) {
                yearColl += inv.paid_amount;
            }
            totalDue += inv.due_bill;
        });

        return { todayColl, todayDue, monthColl, yearColl, totalDue };
    }, [indoorInvoices]);

    const calculateTotals = (items: ServiceItem[], discountAmt: number, paidAmt: number, specialDiscount: number) => {
        const newItems = items.map(item => ({ 
            ...item, 
            line_total: (item.service_charge || 0) * (item.quantity || 0), 
            payable_amount: ((item.service_charge || 0) * (item.quantity || 0)) - (item.discount || 0) 
        }));
        
        const total_bill = newItems.reduce((sum, item) => sum + item.line_total, 0);
        const payable_bill = total_bill - newItems.reduce((sum, item) => sum + (item.discount || 0), 0);
        const netPayable = payable_bill - (specialDiscount || 0);
        const due_bill = netPayable - (paidAmt || 0);
        
        return { items: newItems, total_bill, payable_bill, due_bill, net_payable: netPayable };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? parseFloat(value) || 0 : value;
        
        if (name === 'paid_amount' || name === 'special_discount_amount') {
            const paid = name === 'paid_amount' ? val as number : formData.paid_amount;
            const special = name === 'special_discount_amount' ? val as number : formData.special_discount_amount || 0;
            const totals = calculateTotals(formData.items, 0, paid, special);
            setFormData(prev => ({ ...prev, [name]: val, ...totals }));
        } else {
            setFormData(prev => ({ ...prev, [name]: val }));
        }
    };

    const handleGenerateId = () => {
        if (!selectedAdmission) return alert("Select Patient first.");
        const today = new Date();
        const dStr = today.toISOString().split('T')[0].replace(/-/g, '');
        // Prefix CLIN- used for differentiation in Accounts
        const newId = `CLIN-${dStr}-${indoorInvoices.length + 1}`;
        setFormData(prev => ({ ...prev, daily_id: newId, invoice_date: today.toISOString().split('T')[0], admission_id: selectedAdmission.admission_id, patient_name: selectedAdmission.patient_name }));
    };

    const handleServiceChange = (id: number, field: keyof ServiceItem, value: any) => {
        let updatedItems = formData.items.map(item => item.id === id ? { ...item, [field]: value } : item);
        
        // AUTO-CALCULATE MEDICINE BILL IF TYPE IS 'Medicine'
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

        const totals = calculateTotals(updatedItems, 0, formData.paid_amount, formData.special_discount_amount || 0);
        setFormData(prev => ({ ...prev, ...totals }));
    };

    const handleAddServiceItem = () => {
        const newItem: ServiceItem = { id: Date.now(), service_type: '', service_provider: '', service_charge: 0, quantity: 1, line_total: 0, discount: 0, payable_amount: 0, note: '' };
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
        
        // 2. BED RELEASE & REVERSE LOGIC
        // Logic: If discharge_date is set, clear the bed in admission (Release).
        // If invoice discharge date is cleared/empty, ensure the bed stays occupied.
        if (formData.admission_id) {
            setAdmissions((prev: any) => prev.map((adm: any) => {
                if (adm.admission_id === formData.admission_id) {
                    const hasDischargeDate = !!formData.discharge_date;
                    return { 
                        ...adm, 
                        discharge_date: formData.discharge_date || undefined, 
                        // If discharged, clear bed. If not discharged, keep current bed (or restore if was empty)
                        bed_no: hasDischargeDate ? '' : (adm.bed_no || 'RE-ASSIGNED') 
                    };
                }
                return adm;
            }));
        }

        setIndoorInvoices((prev: any) => {
            const idx = prev.findIndex((inv: any) => inv.daily_id === formData.daily_id);
            if (idx >= 0) { const newArr = [...prev]; newArr[idx] = formData; return newArr; }
            return [...prev, formData];
        });
        setSuccessMessage("Indoor Invoice Saved! Bed status synced.");
        setFormData(emptyIndoorInvoice);
        setSelectedAdmission(null);
    };

    // --- PRINT FINAL INVOICE ---

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
                <div class="inv-title">INPATIENT BILL / INVOICE</div>
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

    const commonInputClasses = "w-full p-2 bg-[#374151] border border-gray-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center"><h4 className="text-gray-400 text-xs uppercase">Today Collection</h4><p className="text-2xl font-bold text-green-400">{stats.todayColl.toFixed(2)}</p></div>
                <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center"><h4 className="text-gray-400 text-xs uppercase">Monthly Collection</h4><p className="text-2xl font-bold text-blue-400">{stats.monthColl.toFixed(2)}</p></div>
                <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center"><h4 className="text-gray-400 text-xs uppercase">Yearly Collection</h4><p className="text-2xl font-bold text-purple-400">{stats.yearColl.toFixed(2)}</p></div>
                <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center"><h4 className="text-gray-400 text-xs uppercase">Total Due</h4><p className="text-2xl font-bold text-red-400">{stats.totalDue.toFixed(2)}</p></div>
            </div>

            <div className="bg-[#20293a] p-6 rounded border border-[#374151]">
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Indoor Invoice</h3>
                <div className="flex gap-4 mb-6">
                    <select className="w-1/3 p-2 bg-[#2d2d55] border border-gray-600 rounded text-white" onChange={e => { const adm = admissions.find(a => a.admission_id === e.target.value); setSelectedAdmission(adm || null); if(adm) setFormData({...emptyIndoorInvoice, admission_id: adm.admission_id, patient_id: adm.patient_id, patient_name: adm.patient_name, admission_date: adm.admission_date}); }} value={selectedAdmission?.admission_id || ''}> <option value="">Select Patient...</option>{admissions.map(a => <option key={a.admission_id} value={a.admission_id}>{a.patient_name} ({a.admission_id})</option>)} </select>
                    <button onClick={handleGenerateId} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">Generate ID</button>
                </div>
                {formData.daily_id && (
                    <form onSubmit={handleSaveInvoice} className="space-y-6">
                        <div className="grid grid-cols-4 gap-6 bg-[#1f2937] p-4 rounded border border-gray-600">
                            <div><label className="block text-xs text-gray-400">ID</label><input type="text" value={formData.daily_id} disabled className="w-full p-2 bg-[#1a202c] border border-gray-600 rounded text-gray-300"/></div>
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
                            <div className="col-span-2"><label className="block text-xs text-gray-400">Referrer</label><select name="referrar_id" value={formData.referrar_id} onChange={(e) => { const ref = referrars.find(r => r.ref_id === e.target.value); setFormData({...formData, referrar_id: ref?.ref_id, referrar_name: ref?.ref_name}); }} className={commonInputClasses}><option value="">Select...</option>{referrars.map(r => <option key={r.ref_id} value={r.ref_id}>{r.ref_name}</option>)}</select></div>
                        </div>
                        <div className="bg-[#1f2937] p-4 rounded border border-gray-600">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-bold text-sky-300">Services</h4>
                                <button type="button" onClick={handleAddServiceItem} className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-500 font-bold shadow">+ Add Service Row</button>
                            </div>
                            <table className="w-full text-sm text-left text-gray-300 mb-2">
                                <thead className="bg-[#111827]"><tr><th className="p-2">Type</th><th className="p-2">Provider</th><th className="p-2">Charge</th><th className="p-2">Qty</th><th className="p-2">Disc</th><th className="p-2">Payable</th><th className="p-2">Note</th><th className="p-2">X</th></tr></thead>
                                <tbody>{formData.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-1">
                                            <input list={`service_type_${item.id}`} value={item.service_type} onChange={e=>handleServiceChange(item.id,'service_type',e.target.value)} className="w-full bg-[#374151] text-white p-1 rounded h-8 text-xs" />
                                            <datalist id={`service_type_${item.id}`}>{serviceTypesList.map(t=><option key={t} value={t}/>)}</datalist>
                                        </td>
                                        <td className="p-1">
                                            <input list={`service_provider_${item.id}`} value={item.service_provider} onChange={e=>handleServiceChange(item.id,'service_provider',e.target.value)} className="w-full bg-[#374151] text-white p-1 rounded h-8 text-xs" />
                                            <datalist id={`service_provider_${item.id}`}>
                                                {doctorServiceTypes.includes(item.service_type) 
                                                    ? doctors.map(d=><option key={d.doctor_id} value={d.doctor_name}/>) 
                                                    : activeEmployees.map(e=><option key={e.emp_id} value={e.emp_name}/>)
                                                }
                                            </datalist>
                                        </td>
                                        <td className="p-1"><input type="number" value={item.service_charge} onChange={e=>handleServiceChange(item.id,'service_charge',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-[#374151] text-white p-1 rounded text-right h-8"/></td>
                                        <td className="p-1"><input type="number" value={item.quantity} onChange={e=>handleServiceChange(item.id,'quantity',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-[#374151] text-white p-1 rounded text-right h-8"/></td>
                                        <td className="p-1"><input type="number" value={item.discount} onChange={e=>handleServiceChange(item.id,'discount',parseFloat(e.target.value))} onFocus={e=>e.target.select()} className="w-full bg-[#374151] text-white p-1 rounded text-right h-8"/></td>
                                        <td className="p-1 font-bold text-sky-300 text-right">{item.payable_amount.toFixed(2)}</td>
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
                
                <div className="mt-8">
                    <h3 className="text-gray-400 font-bold mb-2">Saved Invoices</h3>
                    <div className="max-h-60 overflow-y-auto bg-[#111827] rounded border border-gray-700">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="bg-[#1f2937] text-gray-400 sticky top-0"><tr><th className="p-2">ID</th><th className="p-2">Date</th><th className="p-2">Patient</th><th className="p-2 text-right">Total</th><th className="p-2 text-right">Paid</th><th className="p-2 text-right">Due</th><th className="p-2 text-center">Action</th></tr></thead>
                            <tbody className="divide-y divide-gray-700">
                                {indoorInvoices.map(inv => (
                                    <tr key={inv.daily_id} onClick={() => handleLoadInvoice(inv)} className={`cursor-pointer hover:bg-gray-700 ${selectedInvoiceId === inv.daily_id ? 'bg-blue-900/30' : ''}`}>
                                        <td className="p-2 font-mono text-xs">{inv.daily_id}</td><td className="p-2">{inv.invoice_date}</td><td className="p-2">{inv.patient_name}</td><td className="p-2 text-right">{inv.total_bill.toFixed(2)}</td><td className="p-2 text-right text-green-400">{inv.paid_amount.toFixed(2)}</td><td className="p-2 text-right text-red-400">{inv.due_bill.toFixed(2)}</td><td className="p-2 text-center"><button onClick={(e) => { e.stopPropagation(); handlePrintInvoice(inv); }} className="text-sky-400 hover:text-white text-xs font-bold underline">Print</button></td>
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
    const dueInvoices = indoorInvoices.filter(inv => inv.due_bill > 0.5 && inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // --- PRINT RECEIPT ---
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
        setClinicDueCollections((prev: any) => [...prev, newCollection]);
        setIndoorInvoices((prev: any) => prev.map((inv: any) => inv.daily_id === updatedInvoice.daily_id ? updatedInvoice : inv));
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

    // --- PRINT BED STATUS ---
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
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
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
}

const ClinicPage: React.FC<ClinicPageProps> = ({ 
    onBack, patients, setPatients, doctors, setDoctors, referrars, setReferrars, employees, medicines, setMedicines, admissions, setAdmissions, indoorInvoices, setIndoorInvoices 
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
                        <div className="bg-[#1f2937] p-6 rounded border border-[#374151]">
                            <PatientInfoPage patients={patients} setPatients={setPatients} />
                        </div>
                    </div>

                    {activeTab === 'bed_status' && <BedManagementPage admissions={admissions} />}

                    <div className={activeTab === 'invoice' ? 'block' : 'hidden'}>
                        <IndoorInvoicePage admissions={admissions} doctors={doctors} referrars={referrars} employees={employees} indoorInvoices={indoorInvoices} setIndoorInvoices={setIndoorInvoices} setSuccessMessage={setSuccessMessage} medicines={medicines} setAdmissions={setAdmissions} />
                    </div>

                    {activeTab === 'due_collection' && <ClinicDueCollectionPage indoorInvoices={indoorInvoices} setIndoorInvoices={setIndoorInvoices} clinicDueCollections={clinicDueCollections} setClinicDueCollections={setClinicDueCollections} employees={employees} setSuccessMessage={setSuccessMessage} />}
                    {activeTab === 'report_summary' && <ReportSummaryPage admissions={admissions} doctors={doctors} patients={patients} onOpenRxMaster={() => setShowRxMaster(true)} />}
                </div>
            </div>
            
            {/* Render the Master Discharge/Rx Modal */}
            {showRxMaster && (
                <DischargeRxMasterModal 
                    admissions={admissions} 
                    patients={patients} 
                    doctors={doctors} 
                    onClose={() => setShowRxMaster(false)} 
                />
            )}
        </div>
    );
};

export default ClinicPage;
