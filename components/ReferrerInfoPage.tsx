
import React, { useState, useEffect, useCallback } from 'react';
import { Referrar, emptyReferrar } from './DiagnosticData';
import { 
    Search, MapPin, Users, Phone, PlusCircle, Edit3, Trash2, Filter,
    Info, User, GraduationCap, Map as MapIcon
} from 'lucide-react';

interface ReferrarInfoPageProps {
  referrars: Referrar[];
  setReferrars: React.Dispatch<React.SetStateAction<Referrar[]>>;
  isEmbedded?: boolean;
  onClose?: () => void;
  onSaveAndSelect?: (id: string, name: string) => void;
}

const ReferrarInfoPage: React.FC<ReferrarInfoPageProps> = ({ 
    referrars = [], 
    setReferrars, 
    isEmbedded = false, 
    onClose, 
    onSaveAndSelect 
}) => {
    const [formData, setFormData] = useState<Referrar>(emptyReferrar);
    const [selectedReferrarId, setSelectedReferrarId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [areaFilter, setAreaFilter] = useState('All');
    const [mobileError, setMobileError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleGetNewId = useCallback(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const safeReferrars = Array.isArray(referrars) ? referrars : [];
        const prefix = `REF-${year}-${month}-${day}`;
        const referrarsTodayCount = safeReferrars.filter(r => r && r.ref_id && r.ref_id.startsWith(prefix)).length;
        const newSerial = String(referrarsTodayCount + 1).padStart(3, '0');
        
        const newId = `${prefix}-${newSerial}`;
        setFormData({ ...emptyReferrar, ref_id: newId });
        setIsEditing(false);
    }, [referrars]);

    useEffect(() => {
        if (isEmbedded && !formData.ref_id) {
            const timer = setTimeout(() => handleGetNewId(), 0);
            return () => clearTimeout(timer);
        }
    }, [isEmbedded, formData.ref_id, handleGetNewId]);

    const uniqueAreas = React.useMemo(() => {
        const areas = new Set<string>();
        const safeReferrars = Array.isArray(referrars) ? referrars : [];
        safeReferrars.forEach(r => {
            if (r && r.area) areas.add(r.area.trim());
        });
        return Array.from(areas).sort();
    }, [referrars]);

    const filteredReferrars = React.useMemo(() => {
        const safeReferrars = Array.isArray(referrars) ? referrars : [];
        return safeReferrars.filter(ref => {
            if (!ref) return false;
            const matchesSearch = 
                (ref.ref_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ref.ref_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ref.ref_mobile || '').includes(searchTerm);
            const matchesArea = areaFilter === 'All' || ref.area === areaFilter;
            return matchesSearch && matchesArea;
        });
    }, [searchTerm, areaFilter, referrars]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'ref_mobile') {
            setMobileError('');
            const digits = value.replace(/\D/g, '').slice(0, 11);
            let formatted = digits;
            if (digits.length >= 5) formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
            setFormData(prev => ({ ...prev, ref_mobile: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveReferrar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.ref_id || !formData.ref_name) {
            alert('Referrar ID and Name are required.');
            return;
        }

        const rawMobile = formData.ref_mobile.replace(/\D/g, '');
        if (formData.ref_mobile && (rawMobile.length !== 11 || !rawMobile.startsWith('01'))) {
            setMobileError('Please enter a valid mobile number');
            return;
        }

        if (isEditing) {
            setReferrars(prev => prev.map(r => r.ref_id === formData.ref_id ? formData : r));
        } else {
            setReferrars(prev => [formData, ...prev]);
        }
        
        if (onSaveAndSelect) {
            onSaveAndSelect(formData.ref_id, formData.ref_name);
        }
        setSuccessMessage('Referrar Data Saved!');
        if (onClose) onClose();
    };

    const inputBaseClasses = "py-2 px-3 mt-1 block w-full border border-sky-800 rounded-md bg-sky-900/50 text-sky-100 placeholder-sky-400 focus:ring-2 focus:ring-blue-500 outline-none";

    return (
        <div className={`bg-slate-900 p-6 rounded-xl ${isEmbedded ? '' : 'min-h-screen'}`}>
            <div className="flex justify-between items-center mb-6 border-b border-sky-800 pb-4">
                <h2 className="text-xl font-bold text-white uppercase">Referrer Profile</h2>
                {!isEmbedded && <button onClick={handleGetNewId} className="bg-blue-600 px-4 py-2 rounded text-xs font-bold text-white uppercase tracking-widest hover:bg-blue-500 transition-colors">Generate New ID</button>}
            </div>

            <form id="referrer-form" onSubmit={handleSaveReferrar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-sky-400 uppercase">Referrer ID</label>
                    <input type="text" name="ref_id" value={formData.ref_id} readOnly className={`${inputBaseClasses} bg-slate-800/50 text-sky-500 font-mono`} />
                </div>
                <div>
                    <label className="text-xs font-bold text-sky-400 uppercase">Referrer Name *</label>
                    <input type="text" name="ref_name" value={formData.ref_name} onChange={handleInputChange} required className={inputBaseClasses} placeholder="Enter Name" />
                </div>
                <div>
                    <label className="text-xs font-bold text-sky-400 uppercase">Degrees</label>
                    <input type="text" name="ref_degrees" value={formData.ref_degrees} onChange={handleInputChange} className={inputBaseClasses} placeholder="MBBS, FCPS" />
                </div>
                <div>
                    <label className="text-xs font-bold text-sky-400 uppercase">Mobile Number</label>
                    <input type="text" name="ref_mobile" value={formData.ref_mobile} onChange={handleInputChange} className={`${inputBaseClasses} ${mobileError ? 'border-red-500' : ''}`} placeholder="01XXX-XXXXXX" />
                    {mobileError && <p className="text-[10px] text-red-500 mt-1">{mobileError}</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-sky-400 uppercase">Gender</label>
                    <select name="ref_gender" value={formData.ref_gender} onChange={handleInputChange} className={inputBaseClasses}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-sky-400 uppercase">Area / Upazilla</label>
                    <input type="text" name="area" value={formData.area} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. Enayetpur" />
                </div>
                <div>
                    <label className="text-xs font-bold text-sky-400 uppercase">Address / Chamber</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputBaseClasses} placeholder="Full address" />
                </div>

                <div className="md:col-span-2 flex gap-4 mt-6">
                    <button type="submit" className="flex-1 bg-emerald-600 py-3 text-sm font-bold text-white uppercase tracking-widest rounded-lg hover:bg-emerald-500 transition-all active:scale-95 shadow-lg">Save Referrer</button>
                    {onClose && <button type="button" onClick={onClose} className="px-6 bg-slate-700 text-slate-300 font-bold uppercase py-3 rounded-lg hover:bg-slate-600 text-xs">Cancel</button>}
                </div>
            </form>

            {!isEmbedded && (
                <div className="mt-12 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                            <input type="text" placeholder="Search Referrer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-sky-800 rounded-lg text-white" />
                        </div>
                        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="bg-slate-800 text-white border border-sky-800 px-4 py-2 rounded-lg">
                            <option value="All">All Areas</option>
                            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto border border-sky-800 rounded-xl bg-slate-900/50">
                        <table className="min-w-full divide-y divide-sky-900">
                            <thead>
                                <tr className="bg-slate-800">
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-sky-400 uppercase">ID</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-sky-400 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-sky-400 uppercase">Area</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-sky-400 uppercase">Mobile</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold text-sky-400 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-900/50">
                                {filteredReferrars.map(ref => (
                                    <tr key={ref.ref_id} className="hover:bg-sky-800/20 cursor-pointer" onClick={() => { setFormData(ref); setIsEditing(true); }}>
                                        <td className="px-4 py-3 text-xs text-sky-500 font-mono">{ref.ref_id}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-white">{ref.ref_name}</td>
                                        <td className="px-4 py-3 text-xs text-sky-300">{ref.area}</td>
                                        <td className="px-4 py-3 text-xs text-sky-300">{ref.ref_mobile}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="p-1 hover:text-blue-400 transition-colors text-sky-500"><Edit3 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferrarInfoPage;
