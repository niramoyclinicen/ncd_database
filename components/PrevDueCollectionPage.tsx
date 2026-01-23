import React, { useState, useEffect } from 'react';
import { LabInvoice, Employee, DueCollection } from './DiagnosticData';
import SearchableSelect from './SearchableSelect';
import { formatDateTime } from '../utils/dateUtils';

interface Props {
    invoices: LabInvoice[];
    setInvoices: React.Dispatch<React.SetStateAction<LabInvoice[]>>;
    dueCollections: DueCollection[];
    setDueCollections: React.Dispatch<React.SetStateAction<DueCollection[]>>;
    employees: Employee[];
}

const PrevDueCollectionPage: React.FC<Props> = ({ invoices, setInvoices, dueCollections, setDueCollections, employees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredInvoices, setFilteredInvoices] = useState<LabInvoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<LabInvoice | null>(null);
    const [collectionAmount, setCollectionAmount] = useState<number>(0);
    const [collectedBy, setCollectedBy] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const dueInvoices = invoices.filter(inv => 
            inv.due_amount > 0.5 && 
            (inv.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
             inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredInvoices(dueInvoices);
    }, [searchTerm, invoices]);

    const handlePrintReceipt = (invoice: LabInvoice, collectedAmt: number) => {
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
                <tr><td><b>Invoice ID:</b> ${invoice.invoice_id}</td><td><b>Receipt No:</b> DC-${Date.now().toString().slice(-5)}</td></tr>
                <tr><td><b>Amount Paid:</b></td><td style="font-size:18px; font-weight:bold">৳${collectedAmt.toFixed(2)}</td></tr>
                <tr><td><b>Remaining Due:</b></td><td style="color:red">৳${(invoice.due_amount - collectedAmt).toFixed(2)}</td></tr>
            </table>
            <div style="margin-top:30px; text-align:right"><b>Authorized Sign</b><br>..........................</div>
        </div></body></html>`;
        win.document.write(html); win.document.close(); win.print();
    };

    const handleConfirmCollection = () => {
        if (!selectedInvoice || collectionAmount <= 0 || collectionAmount > selectedInvoice.due_amount + 0.1) {
            alert("ভুল অ্যামাউন্ট!"); return;
        }
        const collectionDate = formatDateTime(new Date());
        const newCol: DueCollection = { collection_id: `DC-${Date.now()}`, invoice_id: selectedInvoice.invoice_id, collection_date: collectionDate, amount_collected: collectionAmount, collected_by: collectedBy, payment_method: 'Cash' };
        
        const updatedInvoice: LabInvoice = { ...selectedInvoice, paid_amount: selectedInvoice.paid_amount + collectionAmount, due_amount: selectedInvoice.due_amount - collectionAmount, status: (selectedInvoice.due_amount - collectionAmount) <= 0.5 ? 'Paid' : 'Due', last_modified: collectionDate };

        setDueCollections(prev => [...prev, newCol]);
        setInvoices(prev => prev.map(inv => inv.invoice_id === updatedInvoice.invoice_id ? updatedInvoice : inv));
        
        handlePrintReceipt(selectedInvoice, collectionAmount);
        setSuccessMessage(`সফলভাবে ${collectionAmount} টাকা আদায় হয়েছে।`);
        setShowModal(false); setSelectedInvoice(null);
    };

    return (
        <div className="bg-slate-900 text-slate-200 rounded-xl p-6 space-y-6">
            {successMessage && <div className="fixed top-20 right-5 bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg z-50 animate-bounce">{successMessage}</div>}
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                <h2 className="text-2xl font-bold text-sky-100">Diagnostic Due Recovery</h2>
                <input type="text" placeholder="Search Patient or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="py-2 px-4 bg-slate-800 border border-slate-700 rounded-md text-white w-64" />
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase font-black"><tr><th className="p-4">Date</th><th className="p-4">Invoice ID</th><th className="p-4">Patient</th><th className="p-4 text-right">Total</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right text-red-400">Due</th><th className="p-4 text-center">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredInvoices.map((inv) => (
                            <tr key={inv.invoice_id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 text-sm">{inv.invoice_date}</td><td className="p-4 font-mono text-sky-400">{inv.invoice_id}</td><td className="p-4 font-bold">{inv.patient_name}</td><td className="p-4 text-right">{inv.total_amount.toFixed(2)}</td><td className="p-4 text-right text-green-400">{inv.paid_amount.toFixed(2)}</td><td className="p-4 text-right text-red-500 font-black">৳{inv.due_amount.toFixed(2)}</td>
                                <td className="p-4 text-center"><button onClick={() => { setSelectedInvoice(inv); setShowModal(true); setCollectionAmount(0); }} className="bg-green-600 px-4 py-1.5 rounded-md text-xs font-bold text-white">Collect</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">বকেয়া টাকা আদায়</h3>
                        <div className="bg-slate-900 p-4 rounded mb-6 flex justify-between items-center"><span className="text-slate-400">Current Due:</span><span className="text-red-400 text-2xl font-black">৳{selectedInvoice.due_amount.toFixed(2)}</span></div>
                        <div className="space-y-4">
                            <div><label className="text-xs text-slate-500 uppercase font-black">Amount to Pay</label><input type="number" value={collectionAmount || ''} onChange={e => setCollectionAmount(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-xl font-bold" autoFocus /></div>
                            <SearchableSelect label="Collected By" theme="dark" options={employees.filter(e=>e.is_current_month).map(e=>({id: e.emp_name, name: e.emp_name}))} value={collectedBy} onChange={(id, name)=>setCollectedBy(name)} />
                        </div>
                        <div className="mt-8 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-700 rounded">বাতিল</button><button onClick={handleConfirmCollection} className="flex-1 py-2 bg-green-600 font-bold rounded">Confirm & Print</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrevDueCollectionPage;