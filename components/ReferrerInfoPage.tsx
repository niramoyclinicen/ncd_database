
import React, { useState, useEffect, useMemo } from 'react';
import { Referrar, emptyReferrar } from './DiagnosticData';
import { 
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
    Search, MapPin, Users, Phone, PlusCircle, Edit3, Trash2, Filter,
    Info, User, GraduationCap, Map
} from 'lucide-react';

interface ReferrarInfoPageProps {
  referrars: Referrar[];
  setReferrars: React.Dispatch<React.SetStateAction<Referrar[]>>;
  isEmbedded?: boolean;
  onClose?: () => void;
  onSaveAndSelect?: (id: string, name: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const ReferrarInfoPage: React.FC<ReferrarInfoPageProps> = ({ referrars, setReferrars, isEmbedded = false, onClose, onSaveAndSelect }) => {
    const [formData, setFormData] = useState<Referrar>(emptyReferrar);
    const [selectedReferrarId, setSelectedReferrarId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [areaFilter, setAreaFilter] = useState('All');
    const [mobileError, setMobileError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Extract unique areas for the dropdown/datalist - case insensitive uniqueness
    const uniqueAreas = useMemo(() => {
        const normalizedMap = new Map<string, string>();
        referrars.forEach(r => {
            const area = r.area?.trim() || '';
            if (area) {
                const lower = area.toLowerCase();
                // Ensure we store the properly capitalized version (Title Case for each word)
                const capitalized = area.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                if (!normalizedMap.has(lower)) {
                    normalizedMap.set(lower, capitalized);
                }
            }
        });
        return Array.from(normalizedMap.values()).sort();
    }, [referrars]);

    // Calculate data for the Pie Chart
    const pieData = useMemo(() => {
        const counts: Record<string, number> = {};
        referrars.forEach(r => {
            const area = r.area || 'Unknown';
            counts[area] = (counts[area] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [referrars]);

    const filteredReferrars = useMemo(() => {
        if (!Array.isArray(referrars)) return [];
        return referrars.filter(referrar => {
            const matchesSearch = 
                (referrar.ref_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (referrar.ref_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (referrar.ref_mobile || '').includes(searchTerm);
            
            const matchesArea = areaFilter === 'All' || referrar.area === areaFilter;
            
            return matchesSearch && matchesArea;
        });
    }, [searchTerm, areaFilter, referrars]);

    const handleGetNewId = React.useCallback(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const referrarsTodayCount = referrars.filter(r => r.ref_id.startsWith(`REF-${year}-${month}-${day}`)).length;
        const newSerial = String(referrarsTodayCount + 1).padStart(3, '0');
        
        const newId = `REF-${year}-${month}-${day}-${newSerial}`;
        setFormData({ ...emptyReferrar, ref_id: newId });
        setIsEditing(false);
    }, [referrars]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (isEmbedded && !isEditing && !formData.ref_id) {
            const timer = setTimeout(() => handleGetNewId(), 0);
            return () => clearTimeout(timer);
        }
    }, [isEmbedded, isEditing, formData.ref_id, handleGetNewId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'ref_mobile') {
            setMobileError('');
            const digits = value.replace(/\D/g, '').slice(0, 11);
            let formatted = digits;
            if (digits.length >= 5) {
                formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
            }
            setFormData(prev => ({ ...prev, ref_mobile: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const resetForm = () => {
        setFormData(emptyReferrar);
        setSelectedReferrarId(null);
        setIsEditing(false);
        setMobileError('');
        if (isEmbedded) {
            handleGetNewId();
        }
    };

    const handleSaveReferrar = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.ref_id || !formData.ref_name) {
            alert('Referrar ID and Name are required.');
            return;
        }

        // Normalize Area: Auto-capitalize first letter of each word and trim
        let normalizedArea = formData.area?.trim() || '';
        if (normalizedArea) {
            normalizedArea = normalizedArea.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        
        const dataToSave = { ...formData, area: normalizedArea };
        
        const rawMobile = dataToSave.ref_mobile.replace(/\D/g, '');
        if (dataToSave.ref_mobile && (rawMobile.length !== 11 || !rawMobile.startsWith('01'))) {
            setMobileError('Please enter a valid mobile number (e.g., 01712-345515)');
            return;
        }
        setMobileError('');

        if (isEditing) {
            setReferrars(referrars.map(r => r.ref_id === dataToSave.ref_id ? dataToSave : r));
            setSuccessMessage('Referrar updated successfully!');
        } else {
            if (referrars.some(r => r.ref_id === dataToSave.ref_id)) {
                alert('Referrar ID already exists. Please get a new ID.');
                return;
            }
            setReferrars([dataToSave, ...referrars]);
            setSuccessMessage('New referrar added successfully!');
        }
        
        if (isEmbedded && onSaveAndSelect) {
            onSaveAndSelect(dataToSave.ref_id, dataToSave.ref_name);
        }
        resetForm();
        if (onClose && isEmbedded) {
            onClose();
        }
    };

    const handleEditReferrar = () => {
        if (!selectedReferrarId) {
            alert("Please select a referrar from the table to edit.");
            return;
        }
        const referrarToEdit = referrars.find(r => r.ref_id === selectedReferrarId);
        if (referrarToEdit) {
            setFormData(referrarToEdit);
            setIsEditing(true);
            setSuccessMessage(`Editing ${referrarToEdit.ref_name}`);
        }
    };

    const handleRowClick = (referrar: Referrar) => {
        setFormData(referrar);
        setSelectedReferrarId(referrar.ref_id);
        setIsEditing(false);
        setMobileError('');
    };

    const inputBaseClasses = "py-2.5 px-3 mt-1 block w-full border border-sky-800 rounded-lg shadow-sm sm:text-sm bg-sky-900/50 text-sky-100 placeholder-sky-400 transition-all duration-200 focus:bg-sky-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
    const labelBaseClasses = "flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1";

    return (
        <div className={`bg-slate-950 text-slate-200 rounded-2xl p-4 sm:p-8 space-y-8 min-h-screen ${isEmbedded ? '!p-0 !space-y-0 !bg-transparent !min-h-0' : ''}`}>
             {successMessage && (
                <div className="fixed bottom-8 right-8 z-[9999] bg-emerald-900/90 border border-emerald-500 text-emerald-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center transition-all animate-in slide-in-from-bottom-5 backdrop-blur-md">
                    <Info className="w-5 h-5 mr-3 text-emerald-400" />
                    <span className="font-medium">{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="ml-6 text-emerald-400 hover:text-emerald-200 transition-colors">&times;</button>
                </div>
            )}
            
            <div className={`bg-sky-950/30 rounded-3xl p-6 sm:p-8 border border-sky-800/50 backdrop-blur-sm ${isEmbedded ? 'border-2 border-blue-800 mt-4' : ''}`}>
                {!isEmbedded && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-sky-800/50 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                                <Users className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight">Referrer Information</h2>
                                <p className="text-sky-400 font-bold text-sm flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-sky-800/50 rounded-md border border-sky-700">Total: {referrars.length}</span>
                                    <span>•</span>
                                    <span>Manage your diagnostic referrers</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={handleGetNewId} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                                <PlusCircle className="w-4 h-4" />
                                New ID
                            </button>
                            <button type="submit" form="referrar-form" className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
                                Save Referrer
                            </button>
                            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-bold text-sky-200 bg-slate-700 rounded-xl hover:bg-slate-600 transition-all active:scale-95">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Side: Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <form id="referrar-form" onSubmit={handleSaveReferrar} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label htmlFor="ref_id" className={labelBaseClasses}>
                                        <Info className="w-3.5 h-3.5" /> Referrer ID
                                    </label>
                                    <input type="text" id="ref_id" name="ref_id" disabled value={formData.ref_id} className={`${inputBaseClasses} bg-sky-900/30 border-dashed cursor-not-allowed opacity-70`} />
                                </div>
                                
                                <div>
                                    <label htmlFor="ref_name" className={labelBaseClasses}>
                                        <User className="w-3.5 h-3.5" /> Referrer Name
                                    </label>
                                    <input type="text" id="ref_name" name="ref_name" value={formData.ref_name} onChange={handleInputChange} required className={inputBaseClasses} placeholder="Enter full name" />
                                </div>

                                <div>
                                    <label htmlFor="ref_gender" className={labelBaseClasses}>
                                        <Users className="w-3.5 h-3.5" /> Gender
                                    </label>
                                    <select id="ref_gender" name="ref_gender" value={formData.ref_gender} onChange={handleInputChange} className={inputBaseClasses}>
                                        <option value="" disabled hidden>Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="ref_degrees" className={labelBaseClasses}>
                                        <GraduationCap className="w-3.5 h-3.5" /> Degrees
                                    </label>
                                    <input type="text" id="ref_degrees" name="ref_degrees" value={formData.ref_degrees} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. MBBS, FCPS" />
                                </div>

                                <div>
                                    <label htmlFor="area" className={labelBaseClasses}>
                                        <MapPin className="w-3.5 h-3.5" /> Area / Location
                                    </label>
                                    <input 
                                        type="text" 
                                        id="area" 
                                        name="area" 
                                        list="area-list"
                                        value={formData.area} 
                                        onChange={handleInputChange} 
                                        className={inputBaseClasses} 
                                        placeholder="Select or type area"
                                    />
                                    <datalist id="area-list">
                                        {uniqueAreas.map(area => (
                                            <option key={area} value={area} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="address" className={labelBaseClasses}>
                                        <Map className="w-3.5 h-3.5" /> Detailed Address
                                    </label>
                                    <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className={inputBaseClasses} placeholder="Full clinic/chamber address" />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="ref_mobile" className={labelBaseClasses}>
                                        <Phone className="w-3.5 h-3.5" /> Mobile Number
                                    </label>
                                    <input 
                                        type="tel" 
                                        id="ref_mobile" 
                                        name="ref_mobile" 
                                        value={formData.ref_mobile} 
                                        onChange={handleInputChange} 
                                        placeholder="01XXX-XXXXXX"
                                        className={`${inputBaseClasses} ${mobileError ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                    />
                                    {mobileError && <p className="mt-2 text-xs font-bold text-red-400 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> {mobileError}
                                    </p>}
                                </div>
                            </div>

                            {isEmbedded && (
                                <div className="flex items-center gap-4 pt-4 border-t border-sky-800/50">
                                    <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                                        <PlusCircle className="w-4 h-4" />
                                        Save New Referrer
                                    </button>
                                    <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-black text-sky-200 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all active:scale-95 uppercase tracking-widest">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Side: Chart & Stats */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="bg-sky-900/20 rounded-3xl p-6 border border-sky-800/50 h-full flex flex-col">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-blue-400" />
                                Area Distribution
                            </h3>
                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0c1a33', borderColor: '#1e3a8a', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="bg-sky-800/30 p-4 rounded-2xl border border-sky-700/50">
                                    <p className="text-[10px] font-black text-sky-400 uppercase">Top Area</p>
                                    <p className="text-xl font-black text-white truncate">
                                        {pieData.length > 0 ? pieData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-sky-800/30 p-4 rounded-2xl border border-sky-700/50">
                                    <p className="text-[10px] font-black text-sky-400 uppercase">Active Areas</p>
                                    <p className="text-xl font-black text-white">{uniqueAreas.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Table Section */}
            {!isEmbedded && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-sky-900/20 p-6 rounded-3xl border border-sky-800/50">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-500" />
                            <input 
                                type="text" 
                                placeholder="Search by Name, ID or Mobile..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-sky-950/50 border border-sky-800 rounded-2xl text-white placeholder-sky-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-sky-950/50 border border-sky-800 px-4 py-3 rounded-2xl min-w-[200px]">
                                <MapPin className="w-4 h-4 text-sky-500" />
                                <select 
                                    value={areaFilter} 
                                    onChange={(e) => setAreaFilter(e.target.value)}
                                    className="bg-transparent text-white outline-none w-full text-sm font-bold"
                                >
                                    <option value="All">All Areas</option>
                                    {uniqueAreas.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={handleEditReferrar} 
                                disabled={!selectedReferrarId}
                                className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all disabled:opacity-30 disabled:grayscale"
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-sky-800/50 rounded-3xl bg-sky-950/20 backdrop-blur-sm shadow-2xl">
                        <table className="min-w-full divide-y divide-sky-800/50">
                            <thead className="bg-sky-900/40">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-sky-400 uppercase tracking-widest">Referrer ID</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-sky-400 uppercase tracking-widest">Name & Degree</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-sky-400 uppercase tracking-widest">Area</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-sky-400 uppercase tracking-widest">Mobile</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-sky-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-800/30">
                                {filteredReferrars.length > 0 ? filteredReferrars.map((referrar) => (
                                    <tr 
                                        key={referrar.ref_id} 
                                        onClick={() => handleRowClick(referrar)}
                                        className={`group cursor-pointer transition-all hover:bg-sky-800/30 ${selectedReferrarId === referrar.ref_id ? 'bg-blue-600/20' : ''}`}
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-sky-800/50 rounded-lg border border-sky-700 text-xs font-bold text-sky-300">
                                                {referrar.ref_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                                                    {referrar.ref_name}
                                                </span>
                                                <span className="text-[10px] font-bold text-sky-500 uppercase">
                                                    {referrar.ref_degrees || 'No Degree'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm text-sky-300">
                                                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                                                {referrar.area || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm font-mono text-sky-300">
                                                <Phone className="w-3.5 h-3.5 text-sky-500" />
                                                {referrar.ref_mobile}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 bg-sky-800 hover:bg-blue-600 rounded-lg text-sky-300 hover:text-white transition-all">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 bg-sky-800 hover:bg-red-600 rounded-lg text-sky-300 hover:text-white transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-sky-600">
                                                <Users className="w-12 h-12 opacity-20" />
                                                <p className="font-bold">No referrers found matching your criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferrarInfoPage;
