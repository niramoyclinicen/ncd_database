
import React, { useState, useEffect, useMemo } from 'react';
import { Patient, emptyPatient } from './DiagnosticData'; 
import { formatDateTime } from '../utils/dateUtils'; 

interface PatientInfoPageProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  isEmbedded?: boolean; 
  onClose?: () => void; 
  onSaveAndSelect?: (id: string, name: string) => void; 
}

// --- Simple Pie Chart Component ---
const AddressPieChart: React.FC<{ patients: Patient[] }> = ({ patients }) => {
    const addressCounts = useMemo(() => {
        if (!Array.isArray(patients)) return {};
        const counts: Record<string, number> = {};
        patients.forEach(p => {
            if (!p) return;
            const addr = p.address ? p.address.trim() : 'Unknown';
            counts[addr] = (counts[addr] || 0) + 1;
        });
        return counts;
    }, [patients]);

    const total = patients.length;
    const data = Object.entries(addressCounts)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value);

    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
        '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'
    ];

    const slices = useMemo(() => {
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
            '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'
        ];
        return data.map((item, index) => {
            const percent = item.value / (total || 1);
            const startPercent = data.slice(0, index).reduce((sum, it) => sum + (it.value / (total || 1)), 0);
            const endPercent = startPercent + percent;
            
            const startX = Math.cos(2 * Math.PI * startPercent);
            const startY = Math.sin(2 * Math.PI * startPercent);
            const endX = Math.cos(2 * Math.PI * endPercent);
            const endY = Math.sin(2 * Math.PI * endPercent);
            
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = [`M 0 0`, `L ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `Z`].join(' ');
            return { pathData, color: colors[index % colors.length], ...item, percent };
        });
    }, [data, total]);

    if (total === 0) return <div className="text-center text-slate-500 py-10">No Data</div>;

    return (
        <div className="flex flex-col items-center bg-white p-4 rounded-xl border border-gray-200 h-full shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 w-full text-center">Address Distribution</h3>
            <div className="relative w-48 h-48 mb-4">
                <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
                    {slices.map((slice, i) => (
                        <path key={i} d={slice.pathData} fill={slice.color} className="hover:opacity-80 transition-opacity" />
                    ))}
                </svg>
            </div>
            <div className="w-full overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="py-1">Color</th>
                            <th className="py-1">Address</th>
                            <th className="py-1 text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slices.map((slice, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div></td>
                                <td className="py-1 truncate max-w-[100px] text-gray-800" title={slice.name}>{slice.name}</td>
                                <td className="py-1 text-right font-bold text-gray-900">{slice.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PatientInfoPage: React.FC<PatientInfoPageProps> = ({ patients, setPatients, isEmbedded = false, onClose, onSaveAndSelect }) => {
  const [formData, setFormData] = useState<Patient>(emptyPatient);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGetNewId = React.useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayPatients = patients.filter(p => p.pt_id.startsWith(`${year}-${month}-${day}`)).length;
    const newId = `${year}-${month}-${day}(${String(todayPatients + 1).padStart(5, '0')})`;
    setFormData({ ...emptyPatient, pt_id: newId, date_modified: formatDateTime(today) });
    setSelectedPatientId(null);
    setIsEditing(false);
  }, [patients]);

  const filteredPatients = useMemo(() => {
    if (isEmbedded) return patients;
    return patients.filter(patient =>
      patient.pt_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.pt_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, patients, isEmbedded]);

  const uniqueNames = useMemo(() => Array.from(new Set(patients.map(p => p.pt_name).filter(Boolean))), [patients]);
  const uniqueAddresses = useMemo(() => Array.from(new Set(patients.map(p => p.address).filter(Boolean))), [patients]);
  const uniqueThanas = useMemo(() => Array.from(new Set(patients.map(p => p.thana).filter(Boolean))), [patients]);
  const uniqueDistricts = useMemo(() => Array.from(new Set(patients.map(p => p.district).filter(Boolean))), [patients]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000); 
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (isEmbedded && !isEditing && !formData.pt_id) {
      const timer = setTimeout(() => handleGetNewId(), 0);
      return () => clearTimeout(timer);
    }
  }, [isEmbedded, isEditing, formData.pt_id, handleGetNewId]);

  // --- AGE CALCULATION LOGIC ---
  const calculateAge = (dobY: string, dobM: string, dobD: string) => {
    const y = parseInt(dobY, 10);
    const m = parseInt(dobM, 10);
    const d = parseInt(dobD, 10);
    
    if (!y || isNaN(y) || y < 1900) return { ageY: '', ageM: '', ageD: '' };
    
    const birthDate = new Date(y, (m || 1) - 1, d || 1);
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { 
      ageY: String(Math.max(0, years)), 
      ageM: String(Math.max(0, months)), 
      ageD: String(Math.max(0, days)) 
    };
  };

  // --- DOB CALCULATION LOGIC ---
  const calculateDOB = (ageY: string, ageM: string, ageD: string) => {
    const years = parseInt(ageY, 10) || 0;
    const months = parseInt(ageM, 10) || 0;
    const days = parseInt(ageD, 10) || 0;
    
    if (years === 0 && months === 0 && days === 0) return { dobY: '', dobM: '', dobD: '' };
    
    const today = new Date();
    const dob = new Date();
    
    dob.setFullYear(today.getFullYear() - years);
    dob.setMonth(today.getMonth() - months);
    dob.setDate(today.getDate() - days);
    
    return { 
        dobY: String(dob.getFullYear()), 
        dobM: String(dob.getMonth() + 1).padStart(2, '0'), 
        dobD: String(dob.getDate()).padStart(2, '0') 
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let updatedData = { ...formData, [name]: value };

    if (['dobY', 'dobM', 'dobD'].includes(name)) {
      if (name === 'dobY' && value.length === 4) {
        const { ageY, ageM, ageD } = calculateAge(value, formData.dobM, formData.dobD);
        updatedData = { ...updatedData, ageY, ageM, ageD };
      } else if (name !== 'dobY' && formData.dobY.length === 4) {
        const { ageY, ageM, ageD } = calculateAge(formData.dobY, name === 'dobM' ? value : formData.dobM, name === 'dobD' ? value : formData.dobD);
        updatedData = { ...updatedData, ageY, ageM, ageD };
      }
    } else if (['ageY', 'ageM', 'ageD'].includes(name)) {
      const { dobY, dobM, dobD } = calculateDOB(
        name === 'ageY' ? value : formData.ageY, 
        name === 'ageM' ? value : formData.ageM, 
        name === 'ageD' ? value : formData.ageD
      );
      updatedData = { ...updatedData, dobY, dobM, dobD };
    }

    if (name === 'mobile') {
      setMobileError(''); 
      const digits = value.replace(/\D/g, '').slice(0, 11);
      let formatted = digits;
      if (digits.length >= 5) formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
      setFormData({ ...updatedData, mobile: formatted });
    } else {
      setFormData(updatedData);
    }
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pt_id || !formData.pt_name) return alert('Patient ID and Name are required.');
    const rawMobile = formData.mobile.replace(/\D/g, '');
    if (formData.mobile && (rawMobile.length !== 11 || !rawMobile.startsWith('01'))) {
      setMobileError('Invalid mobile number');
      return;
    }
    const currentDateTime = formatDateTime(new Date()); 
    if (isEditing) setPatients(patients.map(p => p.pt_id === formData.pt_id ? { ...formData, date_modified: currentDateTime } : p));
    else setPatients([{ ...formData, date_modified: currentDateTime }, ...patients]);
    setSuccessMessage('Saved successfully!');
    if (isEmbedded && onSaveAndSelect) onSaveAndSelect(formData.pt_id, formData.pt_name);
    setFormData(emptyPatient);
    setSelectedPatientId(null);
    setIsEditing(false);
    setLastEdited(null);
    if (onClose && isEmbedded) onClose();
  };

  const inputBaseClasses = "py-2 px-3 mt-1 block w-full border border-gray-300 rounded-md shadow-sm text-lg font-medium bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelBaseClasses = "block text-sm font-semibold text-gray-600";
  const actionButtonClasses = "px-4 py-2 text-sm font-medium rounded-md flex justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white transition-colors min-w-[100px]";

  return (
    <div className={`bg-[#f8f9fa] text-gray-800 rounded-xl px-4 sm:px-6 pb-6 pt-2 space-y-6 ${isEmbedded ? '!p-0 !space-y-0 !bg-transparent' : ''}`}>
        {successMessage && (
            <div className="fixed bottom-5 right-5 z-[9999] bg-green-600 border border-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center transition-transform animate-fade-in-up">
                <span className="font-semibold">{successMessage}</span>
            </div>
        )}
      
      <div className="flex flex-col xl:flex-row gap-6">
          {!isEmbedded && <div className="w-full xl:w-1/4 min-w-[250px]"><AddressPieChart patients={patients} /></div>}
          <div className={`flex-1 bg-white rounded-xl p-4 sm:p-6 ${isEmbedded ? 'border-2 border-blue-600 mt-4' : 'border border-gray-200 shadow-sm'}`}>
            {!isEmbedded && <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4">Patient Information</h2>}
            {!isEmbedded && (
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4 mb-4">
                    <label className="font-semibold text-gray-600 whitespace-nowrap">Pt. Id:</label>
                    <input type="text" disabled value={formData.pt_id} className="w-48 border border-gray-300 rounded-md shadow-sm text-lg font-medium px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" />
                    <button type="button" onClick={handleGetNewId} className={`${actionButtonClasses} text-white bg-blue-600 hover:bg-blue-700`}>Add New</button>
                    <button type="submit" form="patient-form" className={`${actionButtonClasses} text-white bg-green-600 hover:bg-green-700`}>Save</button>
                    <button type="button" onClick={() => { if(selectedPatientId) { const p = patients.find(x => x.pt_id === selectedPatientId); if(p) { setFormData(p); setIsEditing(true); } } }} disabled={!selectedPatientId} className={`${actionButtonClasses} text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50`}>Edit</button>
                    <button type="button" onClick={() => { if(selectedPatientId && confirm('Delete?')) { setPatients(patients.filter(x => x.pt_id !== selectedPatientId)); setFormData(emptyPatient); setSelectedPatientId(null); } }} disabled={!selectedPatientId} className={`${actionButtonClasses} text-white bg-red-600 hover:bg-red-700 disabled:opacity-50`}>Delete</button>
                </div>
            )}
            {!isEmbedded && (
                <div className="mb-6 flex items-center gap-2">
                    <label className="font-semibold text-gray-600 whitespace-nowrap">Search:</label>
                    <input type="text" placeholder="Name or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 py-2 px-3 border border-gray-300 bg-white text-gray-900 rounded-md text-lg font-medium" />
                </div>
            )}
            <form id="patient-form" onSubmit={handleSavePatient}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div className="space-y-5">
                        <div><label className={labelBaseClasses}>Patient Name</label><input type="text" name="pt_name" value={formData.pt_name} onChange={handleInputChange} required className={inputBaseClasses} list="patientNamesOptions" /></div>
                        <div className="flex gap-4">
                            <div className="w-1/3"><label className={labelBaseClasses}>Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} className={inputBaseClasses}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                            <div className="flex-1"><label className={labelBaseClasses}>Care off</label><div className="flex items-center gap-2"><select name="co_pref" value={formData.co_pref} onChange={handleInputChange} className={`${inputBaseClasses} w-[70px]`}><option value="S/O">S/O</option><option value="D/O">D/O</option><option value="W/O">W/O</option></select><input type="text" name="co_name" value={formData.co_name} onChange={handleInputChange} className={`${inputBaseClasses} flex-1`} /></div></div>
                        </div>
                        <div>
                          <label className={labelBaseClasses}>Age (Y / M / D)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" name="ageY" placeholder="Y" value={formData.ageY} onChange={handleInputChange} onFocus={e => e.target.select()} className={`${inputBaseClasses} w-1/3 text-center`} />
                            <input type="number" name="ageM" placeholder="M" value={formData.ageM} onChange={handleInputChange} onFocus={e => e.target.select()} className={`${inputBaseClasses} w-1/3 text-center`} />
                            <input type="number" name="ageD" placeholder="D" value={formData.ageD} onChange={handleInputChange} onFocus={e => e.target.select()} className={`${inputBaseClasses} w-1/3 text-center`} />
                          </div>
                        </div>
                        <div>
                          <label className={labelBaseClasses}>Date of Birth (YYYY - MM - DD)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" name="dobY" placeholder="YYYY" value={formData.dobY} onChange={handleInputChange} onFocus={e => e.target.select()} className={`${inputBaseClasses} w-1/3 text-center`} />
                            <select name="dobM" value={formData.dobM} onChange={handleInputChange} className={`${inputBaseClasses} w-1/3`}>
                              <option value="">Month</option>
                              {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select name="dobD" value={formData.dobD} onChange={handleInputChange} className={`${inputBaseClasses} w-1/3`}>
                              <option value="">Day</option>
                              {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>
                    </div>
                    <div className="space-y-5">
                        <div><label className={labelBaseClasses}>Address</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputBaseClasses} list="addressOptions" /></div>
                        <div className="flex gap-4">
                            <div className="w-1/2"><label className={labelBaseClasses}>Thana</label><input type="text" name="thana" value={formData.thana} onChange={handleInputChange} className={inputBaseClasses} list="thanaOptions" /></div>
                            <div className="w-1/2"><label className={labelBaseClasses}>District</label><input type="text" name="district" value={formData.district} onChange={handleInputChange} className={inputBaseClasses} list="districtOptions" /></div>
                        </div>
                        <div><label className={labelBaseClasses}>Mobile</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="01XXX-XXXXXX" className={inputBaseClasses} />{mobileError && <p className="text-red-500 text-xs mt-1">{mobileError}</p>}</div>
                    </div>
                </div>
                {isEmbedded && (
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-sky-800">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-white rounded">Cancel</button>
                    </div>
                )}
            </form>
          </div>
      </div>

      {!isEmbedded && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Barcode</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Pt_ID</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Mobile</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Thana</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">District</th>
                  <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.pt_id}
                    onClick={() => { setFormData(patient); setSelectedPatientId(patient.pt_id); setIsEditing(false); setLastEdited(null); }}
                    className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedPatientId === patient.pt_id ? 'bg-blue-100/50' : ''}`}
                  >
                    <td className="px-4 py-2">
                        <img 
                            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(patient.pt_id)}&scale=1&height=5&incltext=false`} 
                            alt="Barcode" 
                            className="h-6 opacity-70" 
                        />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-blue-600 font-mono">{patient.pt_id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{patient.pt_name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{patient.gender}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{patient.ageY}Y</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{patient.mobile}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-700 font-medium">{patient.address}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{patient.thana}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{patient.district}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-[10px] text-gray-400 font-mono">{patient.date_modified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}

      <datalist id="patientNamesOptions">{uniqueNames.map((name, i) => <option key={i} value={name} />)}</datalist>
      <datalist id="addressOptions">{uniqueAddresses.map((addr, i) => <option key={i} value={addr} />)}</datalist>
      <datalist id="thanaOptions">{uniqueThanas.map((thana, i) => <option key={i} value={thana} />)}</datalist>
      <datalist id="districtOptions">{uniqueDistricts.map((dist, i) => <option key={i} value={dist} />)}</datalist>
    </div>
  );
};

export default PatientInfoPage;
