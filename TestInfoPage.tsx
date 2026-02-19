
import React, { useState, useEffect } from 'react';
import { Referrar, emptyReferrar } from './DiagnosticData';

interface ReferrarInfoPageProps {
  referrars: Referrar[];
  setReferrars: React.Dispatch<React.SetStateAction<Referrar[]>>;
  isEmbedded?: boolean;
  onClose?: () => void;
  onSaveAndSelect?: (id: string, name: string) => void;
}

const ReferrarInfoPage: React.FC<ReferrarInfoPageProps> = ({ referrars, setReferrars, isEmbedded = false, onClose, onSaveAndSelect }) => {
    const [filteredReferrars, setFilteredReferrars] = useState<Referrar[]>(referrars);
    const [formData, setFormData] = useState<Referrar>(emptyReferrar);
    const [selectedReferrarId, setSelectedReferrarId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mobileError, setMobileError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (isEmbedded) return;
        const results = referrars.filter(referrar =>
            referrar.ref_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            referrar.ref_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredReferrars(results);
    }, [searchTerm, referrars, isEmbedded]);

    useEffect(() => {
        if (isEmbedded && !isEditing && !formData.ref_id) {
            handleGetNewId();
        }
    }, [isEmbedded, isEditing, formData.ref_id]);

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

    const handleGetNewId = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const referrarsTodayCount = referrars.filter(r => r.ref_id.startsWith(`REF-${year}-${month}-${day}`)).length;
        const newSerial = String(referrarsTodayCount + 1).padStart(3, '0');
        
        const newId = `REF-${year}-${month}-${day}-${newSerial}`;
        setFormData({ ...emptyReferrar, ref_id: newId });
        setIsEditing(false);
    };

    const handleSaveReferrar = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.ref_id || !formData.ref_name) {
            alert('Referrar ID and Name are required.');
            return;
        }
        
        const rawMobile = formData.ref_mobile.replace(/\D/g, '');
        if (formData.ref_mobile && (rawMobile.length !== 11 || !rawMobile.startsWith('01'))) {
            setMobileError('Please enter a valid mobile number (e.g., 01712-345515)');
            return;
        }
        setMobileError('');

        if (isEditing) {
            setReferrars(referrars.map(r => r.ref_id === formData.ref_id ? formData : r));
            setSuccessMessage('Referrar updated successfully!');
        } else {
            if (referrars.some(r => r.ref_id === formData.ref_id)) {
                alert('Referrar ID already exists. Please get a new ID.');
                return;
            }
            setReferrars([formData, ...referrars]);
            setSuccessMessage('New referrar added successfully!');
        }
        
        if (isEmbedded && onSaveAndSelect) {
            onSaveAndSelect(formData.ref_id, formData.ref_name);
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

    const inputBaseClasses = "py-2 px-3 mt-1 block w-full border border-sky-800 rounded-md shadow-sm sm:text-sm bg-sky-900/50 text-sky-200 placeholder-sky-400 transition-colors duration-200 ease-in-out focus:bg-sky-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelBaseClasses = "block text-sm font-semibold text-sky-300";

    return (
        <div className={`bg-slate-900 text-slate-200 rounded-xl p-4 sm:p-6 space-y-8 ${isEmbedded ? '!p-0 !space-y-0 !bg-transparent' : ''}`}>
             {successMessage && (
                <div className="fixed bottom-5 right-5 z-[9999] bg-green-900/95 border border-green-500 text-green-100 px-6 py-3 rounded-lg shadow-2xl flex items-center transition-transform animate-fade-in-up backdrop-blur-sm">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="ml-4 text-green-300 font-bold">&times;</button>
                </div>
            )}
            
            <div className={`bg-sky-950 rounded-xl p-4 sm:p-6 ${isEmbedded ? 'border-2 border-blue-800 mt-4' : 'border border-sky-800'}`}>
                {!isEmbedded && (
                    <h2 className="text-2xl font-bold text-sky-100 mb-6 border-b border-sky-800 pb-4">Referrer Information</h2>
                )}

                {!isEmbedded && (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-800 pb-4 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <label htmlFor="ref_id" className="font-semibold text-sky-300 whitespace-nowrap">Ref. Id:</label>
                            <input type="text" id="ref_id" name="ref_id" disabled value={formData.ref_id} className="w-48 border border-sky-800 rounded-md shadow-sm sm:text-sm px-3 py-2 bg-sky-900 text-sky-400 cursor-not-allowed" />
                            <button type="button" onClick={handleGetNewId} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-blue-500">
                                Get New ID
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button type="submit" form="referrar-form" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-green-500">Save</button>
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-sky-200 bg-slate-600 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-slate-500">Cancel</button>
                            <button type="button" onClick={handleEditReferrar} disabled={!selectedReferrarId} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                        </div>
                    </div>
                )}

                {isEmbedded && (
                    <div className="flex items-center gap-2 mb-4">
                         <label htmlFor="ref_id_embedded" className="font-semibold text-sky-300 whitespace-nowrap">New Ref. Id:</label>
                         <input type="text" id="ref_id_embedded" name="ref_id" disabled value={formData.ref_id} className="w-48 border border-sky-800 rounded-md shadow-sm sm:text-sm px-3 py-2 bg-sky-900 text-sky-400 cursor-not-allowed" />
                    </div>
                )}

                {!isEmbedded && (
                    <div className="mb-6 flex items-center gap-2">
                        <label htmlFor="search_referrar" className="font-semibold text-sky-300 whitespace-nowrap">Search:</label>
                        <input 
                            type="text" 
                            id="search_referrar" 
                            name="search_referrar" 
                            placeholder="Search by Name or ID" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 py-2 px-3 border border-sky-800 bg-sky-900 text-sky-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                )}
                
                <form id="referrar-form" onSubmit={handleSaveReferrar}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <div>
                            <label htmlFor="ref_name" className={labelBaseClasses}>Referrar Name</label>
                            <input type="text" id="ref_name" name="ref_name" value={formData.ref_name} onChange={handleInputChange} required className={inputBaseClasses} />
                        </div>
                        <div>
                            <label htmlFor="ref_gender" className={labelBaseClasses}>Gender</label>
                            <select id="ref_gender" name="ref_gender" value={formData.ref_gender} onChange={handleInputChange} className={inputBaseClasses}>
                                <option value="" disabled hidden>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ref_degrees" className={labelBaseClasses}>Degrees</label>
                            <input type="text" id="ref_degrees" name="ref_degrees" value={formData.ref_degrees} onChange={handleInputChange} className={inputBaseClasses} />
                        </div>
                        <div>
                            <label htmlFor="address" className={labelBaseClasses}>Address</label>
                            <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className={inputBaseClasses} />
                        </div>
                        <div>
                            <label htmlFor="ref_mobile" className={labelBaseClasses}>Mobile</label>
                            <input 
                                type="tel" 
                                id="ref_mobile" 
                                name="ref_mobile" 
                                value={formData.ref_mobile} 
                                onChange={handleInputChange} 
                                placeholder="00000-000000"
                                className={inputBaseClasses} 
                            />
                            {mobileError && <p className="mt-1 text-xs text-red-500">{mobileError}</p>}
                        </div>
                    </div>
                    {isEmbedded && (
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-4 mt-4 border-t border-sky-800">
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-green-500">Save</button>
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-sky-200 bg-slate-600 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-slate-500">Cancel</button>
                        </div>
                    )}
                </form>
            </div>
            
            {!isEmbedded && (
                <>
                    <div className="overflow-x-auto border border-slate-700 rounded-lg mt-8">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Referrar ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Gender</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Degrees</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Address</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Mobile</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-900 divide-y divide-slate-700">
                                {filteredReferrars.map((referrar) => (
                                    <tr 
                                        key={referrar.ref_id} 
                                        onClick={() => handleRowClick(referrar)}
                                        className={`cursor-pointer hover:bg-slate-800/50 ${selectedReferrarId === referrar.ref_id ? 'bg-blue-900/40' : ''}`}
                                        aria-selected={selectedReferrarId === referrar.ref_id}
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRowClick(referrar)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{referrar.ref_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">{referrar.ref_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{referrar.ref_gender}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{referrar.ref_degrees}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{referrar.address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{referrar.ref_mobile}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReferrarInfoPage;