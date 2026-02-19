
import React, { useState, useEffect, useRef } from 'react';
import { Doctor, emptyDoctor } from './DiagnosticData';

interface DoctorInfoPageProps {
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  isEmbedded?: boolean;
  onClose?: () => void;
  onSaveAndSelect?: (id: string, name: string) => void;
}

const DoctorInfoPage: React.FC<DoctorInfoPageProps> = ({ doctors, setDoctors, isEmbedded = false, onClose, onSaveAndSelect }) => {
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(doctors);
  const [formData, setFormData] = useState<Doctor>(emptyDoctor);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (isEmbedded) return;
    const results = doctors.filter(doctor =>
      doctor.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.doctor_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(results);
  }, [searchTerm, doctors, isEmbedded]);

  useEffect(() => {
    if (isEmbedded && !isEditing && !formData.doctor_id) handleGetNewId();
  }, [isEmbedded, isEditing, formData.doctor_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      setMobileError('');
      const digits = value.replace(/\D/g, '').slice(0, 11);
      let formatted = digits;
      if (digits.length >= 5) formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
      setFormData(prev => ({ ...prev, mobile: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleGetNewId = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDoctors = doctors.filter(d => d.doctor_id?.startsWith(`DR-${year}-${month}-${day}`)).length;
    const newId = `DR-${year}-${month}-${day}-${String(todayDoctors + 1).padStart(3, '0')}`;
    setFormData({ ...emptyDoctor, doctor_id: newId });
    setSelectedDoctorId(null);
    setIsEditing(false);
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctor_id || !formData.doctor_name) return alert('ID and Name required.');
    if (isEditing) setDoctors(prev => prev.map(d => d.doctor_id === formData.doctor_id ? formData : d));
    else setDoctors(prev => [formData, ...prev]);
    setSuccessMessage('Doctor info saved!');
    if (isEmbedded && onSaveAndSelect) onSaveAndSelect(formData.doctor_id, formData.doctor_name);
    setFormData(emptyDoctor);
    setSelectedDoctorId(null);
    setIsEditing(false);
    if (onClose && isEmbedded) onClose();
  };

  const inputBaseClasses = "py-2 px-3 mt-1 block w-full border border-sky-800 rounded-md shadow-sm text-lg font-medium bg-sky-900/50 text-sky-200 placeholder-sky-400 focus:bg-sky-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelBaseClasses = "block text-sm font-semibold text-sky-300";
  const actionButtonClasses = "px-4 py-2 text-sm font-medium rounded-md flex justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 transition-colors min-w-[100px]";

  return (
    <div className={`bg-slate-900 text-slate-200 rounded-xl px-4 sm:px-6 pb-6 pt-2 space-y-6 ${isEmbedded ? '!p-0 !space-y-0 !bg-transparent' : ''}`}>
        {successMessage && <div className="fixed bottom-5 right-5 z-[9999] bg-green-900/95 border border-green-500 text-green-100 px-6 py-3 rounded-lg shadow-2xl">{successMessage}</div>}
      
      <div className={`bg-sky-950 rounded-xl p-4 sm:p-6 ${isEmbedded ? 'border-2 border-blue-800 mt-4' : 'border border-sky-800'}`}>
        {!isEmbedded && <h2 className="text-2xl font-bold text-sky-100 mb-6 border-b border-sky-800 pb-4">Doctor Information</h2>}
        {!isEmbedded && (
          <div className="flex flex-wrap items-center gap-2 border-b border-sky-800 pb-4 mb-4">
              <label className="font-semibold text-sky-300 whitespace-nowrap">Dr. Id:</label>
              <input type="text" disabled value={formData.doctor_id} className="w-48 border border-sky-800 rounded-md shadow-sm text-lg font-medium px-3 py-2 bg-sky-900 text-sky-400 cursor-not-allowed" />
              <button type="button" onClick={handleGetNewId} className={`${actionButtonClasses} text-white bg-blue-600 hover:bg-blue-700`}>Add New</button>
              <button type="submit" form="doctor-form" className={`${actionButtonClasses} text-white bg-green-600 hover:bg-green-700`}>Save</button>
              <button type="button" onClick={() => { if(selectedDoctorId) { const d = doctors.find(x => x.doctor_id === selectedDoctorId); if(d) { setFormData(d); setIsEditing(true); } } }} disabled={!selectedDoctorId} className={`${actionButtonClasses} text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50`}>Edit</button>
              <button type="button" onClick={() => { if(selectedDoctorId && confirm('Delete?')) setDoctors(prev => prev.filter(x => x.doctor_id !== selectedDoctorId)); }} disabled={!selectedDoctorId} className={`${actionButtonClasses} text-white bg-red-600 hover:bg-red-700 disabled:opacity-50`}>Delete</button>
          </div>
        )}
        {!isEmbedded && (
          <div className="mb-6 flex items-center gap-2">
            <label className="font-semibold text-sky-300 whitespace-nowrap">Search:</label>
            <input type="text" placeholder="Name or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 py-2 px-3 border border-sky-800 bg-sky-900 text-sky-200 rounded-md text-lg font-medium" />
          </div>
        )}
        <form id="doctor-form" onSubmit={handleSaveDoctor}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div><label className={labelBaseClasses}>Doctor Name</label><input type="text" name="doctor_name" value={formData.doctor_name} onChange={handleInputChange} required className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} className={inputBaseClasses}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
            <div><label className={labelBaseClasses}>Degree</label><input type="text" name="degree" value={formData.degree} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. MBBS, FCPS" /></div>
            <div><label className={labelBaseClasses}>Mobile</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="01XXX-XXXXXX" className={inputBaseClasses} /></div>
            <div className="md:col-span-2 flex items-center gap-4 mt-2 bg-sky-900/30 p-4 rounded-lg border border-sky-800">
                <div className="flex-shrink-0">{formData.photo ? <img src={formData.photo} alt="Doc" className="w-24 h-24 rounded-full object-cover border-2 border-sky-500 shadow-md" /> : <div className="w-24 h-24 rounded-full bg-sky-800 flex items-center justify-center text-sky-400 border-2 border-dashed border-sky-600"><span className="text-xs">No Photo</span></div>}</div>
                <div className="flex-1"><label className={labelBaseClasses}>Upload Photo</label><input type="file" accept="image/*" onChange={handlePhotoUpload} ref={fileInputRef} className="mt-1 block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" /></div>
            </div>
          </div>
          {isEmbedded && (
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-sky-800">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-white rounded">Cancel</button>
            </div>
          )}
        </form>
      </div>

      {!isEmbedded && (
        <div className="overflow-x-auto border border-slate-700 rounded-lg">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-300 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-300 uppercase">Doctor Name</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-300 uppercase">Doctor Degree</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-300 uppercase">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-300 uppercase">Mobile</th>
                </tr>
              </thead>
              <tbody className="bg-slate-900 divide-y divide-slate-700">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.doctor_id} onClick={() => { setFormData(doctor); setSelectedDoctorId(doctor.doctor_id); setIsEditing(false); }} className={`cursor-pointer hover:bg-slate-800/50 ${selectedDoctorId === doctor.doctor_id ? 'bg-blue-900/40' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-sky-400 font-mono">{doctor.doctor_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200 font-bold">{doctor.doctor_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300">{doctor.degree}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">{doctor.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">{doctor.mobile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default DoctorInfoPage;
