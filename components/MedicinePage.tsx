
import React, { useState, useEffect, useMemo } from 'react';
import { Medicine, Employee, PurchaseInvoice, InvoiceItem, Doctor, SalesInvoice, SalesItem, DrugMonograph } from './DiagnosticData';
import { BackIcon, MapPinIcon, PhoneIcon, MedicineIcon, FileTextIcon, Pill, SearchIcon, Activity, SaveIcon } from './Icons';
import SearchableSelect from './SearchableSelect';
import { IndoorInvoice } from './ClinicPage';

interface MedicinePageProps {
  onBack: () => void;
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  clinicalDrugs: DrugMonograph[];
  setClinicalDrugs: React.Dispatch<React.SetStateAction<DrugMonograph[]>>;
  employees: Employee[];
  doctors: Doctor[];
  invoices: PurchaseInvoice[];
  setInvoices: React.Dispatch<React.SetStateAction<PurchaseInvoice[]>>;
  salesInvoices: SalesInvoice[];
  setSalesInvoices: React.Dispatch<React.SetStateAction<SalesInvoice[]>>;
  indoorInvoices: IndoorInvoice[];
}

type MedicineTab = 'buy' | 'due_paid' | 'sell' | 'store' | 'chart' | 'hishab';
type ViewMode = 'list' | 'add' | 'edit' | 'print';

const formulations = ['Tab', 'Cap', 'Syr', 'Inj', 'Susp', 'Cream', 'Oint', 'Drops', 'Inhaler', 'Supp', 'Sachet', 'Other'];

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const defaultSuppliers = [
    "Medicine Store", "Square Pharmaceuticals", "Beximco Pharmaceuticals", "Incepta Pharmaceuticals", "Renata Limited",
    "Healthcare Pharmaceuticals", "ACI Limited", "Aristopharma Ltd.", "Eskayef Pharmaceuticals", "ACME Laboratories",
    "Drug International", "Radiant Pharmaceuticals", "Sun Pharmaceutical", "Popular Pharmaceuticals"
];

const MedicinePage: React.FC<MedicinePageProps> = ({ 
    onBack, medicines, setMedicines, clinicalDrugs, setClinicalDrugs, employees, doctors, invoices, setInvoices, salesInvoices, setSalesInvoices, indoorInvoices
}) => {
  const [activeTab, setActiveTab] = useState<MedicineTab>('sell');
  const [buyViewMode, setBuyViewMode] = useState<ViewMode>('list');
  const [sellViewMode, setSellViewMode] = useState<ViewMode>('list');
  const [sellSubTab, setSellSubTab] = useState<'outdoor' | 'indoor'>('outdoor');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Sales State Extras
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  // Supplier Payment Logic
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ invoiceId: '', supplierName: '', currentDue: 0, payAmount: '' });

  // Drug Monograph State
  // Fix: Removed 'contraindications' property from initial state to match DrugMonograph interface
  const [clinicalDrugForm, setClinicalDrugForm] = useState<DrugMonograph>({
      id: '', brandName: '', genericName: '', strength: '', formulation: 'Tab', company: '',
      pregnancyCategory: 'B', indications: [], sideEffects: [], adultDose: ''
  });
  const [isEditingDrug, setIsEditingDrug] = useState(false);
  const [drugSearch, setDrugSearch] = useState('');

  // Purchase Form State
  const [purchaseFormData, setPurchaseFormData] = useState<PurchaseInvoice>({
      invoiceId: '', invoiceDate: new Date().toISOString().split('T')[0], source: '', items: [], totalAmount: 0, discount: 0, netPayable: 0, paidAmount: 0, dueAmount: 0, billCreatedBy: 'Admin', billPaidBy: '', receivedBy: '', status: 'Saved', createdDate: ''
  });
  const [currentPurchaseItem, setCurrentPurchaseItem] = useState<Partial<InvoiceItem>>({ tradeName: '', genericName: '', formulation: 'Tab', strength: '', unitPriceBuy: 0, unitPriceSell: 0, qtyBuying: 0, lineTotalBuy: 0, expiryDate: '' });
  
  // Sales Form State
  const [salesFormData, setSalesFormData] = useState<SalesInvoice>({
      invoiceId: '', invoiceDate: new Date().toISOString().split('T')[0], customerName: '', customerMobile: '', customerAge: '', customerGender: '', refDoctorName: '', items: [], totalAmount: 0, discount: 0, netPayable: 0, paidAmount: 0, dueAmount: 0, billCreatedBy: 'Admin', status: 'Saved', createdDate: ''
  });
  const [currentSalesItem, setCurrentSalesItem] = useState<Partial<SalesItem>>({ tradeName: '', genericName: '', formulation: 'Tab', strength: '', unitPriceSell: 0, qtySelling: 0, lineTotalSell: 0, stock: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([]);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);

  useEffect(() => { if (successMessage) { const timer = setTimeout(() => setSuccessMessage(''), 3000); return () => clearTimeout(timer); } }, [successMessage]);
  
  // Auto Calculations
  useEffect(() => {
    const sub = purchaseFormData.items.reduce((sum, item) => sum + item.lineTotalBuy, 0);
    const net = sub - purchaseFormData.discount;
    const due = net - purchaseFormData.paidAmount;
    setPurchaseFormData(prev => ({ ...prev, totalAmount: sub, netPayable: net, dueAmount: due }));
  }, [purchaseFormData.items, purchaseFormData.discount, purchaseFormData.paidAmount]);

  useEffect(() => {
      const sub = salesFormData.items.reduce((sum, item) => sum + item.lineTotalSell, 0);
      const net = sub - salesFormData.discount;
      const due = net - salesFormData.paidAmount;
      setSalesFormData(prev => ({ ...prev, totalAmount: sub, netPayable: net, dueAmount: due }));
  }, [salesFormData.items, salesFormData.discount, salesFormData.paidAmount]);

  const handleSearchChange = (term: string, type: 'buy' | 'sell') => {
    setSearchTerm(term);
    if (type === 'buy') {
        setCurrentPurchaseItem(prev => ({ ...prev, tradeName: term }));
        if (term.length > 0) {
            const matches = medicines.filter(m => m.tradeName.toLowerCase().includes(term.toLowerCase()) || m.genericName.toLowerCase().includes(term.toLowerCase()));
            setSuggestions(matches);
            setShowSuggestions(true);
        } else { setSuggestions([]); setShowSuggestions(false); }
    } else {
        setCurrentSalesItem(prev => ({ ...prev, tradeName: term }));
        if (term.length === 0) {
            setSuggestions(medicines.filter(m => m.stock > 0));
            setShowSuggestions(true);
        } else {
            const matches = medicines.filter(m => (m.tradeName.toLowerCase().includes(term.toLowerCase()) || m.genericName.toLowerCase().includes(term.toLowerCase())));
            setSuggestions(matches);
            setShowSuggestions(true);
        }
    }
  };

  const handleSupplierChange = (val: string) => {
      setPurchaseFormData(prev => ({ ...prev, source: val }));
      const historySuppliers = Array.from(new Set(invoices.map(i => i.source))).filter((s): s is string => !!s);
      const allSuppliers = Array.from(new Set([...defaultSuppliers, ...historySuppliers]));
      if (val) {
          const matches = allSuppliers.filter(s => s.toLowerCase().includes(val.toLowerCase()));
          setSupplierSuggestions(matches);
      } else { setSupplierSuggestions(allSuppliers); }
      setShowSupplierSuggestions(true);
  };

  const handleProcessDuePayment = () => {
      const amt = parseFloat(paymentData.payAmount);
      if (isNaN(amt) || amt <= 0 || amt > paymentData.currentDue + 0.1) {
          alert("Invalid payment amount"); return;
      }
      setInvoices(prev => prev.map(inv => {
          if (inv.invoiceId === paymentData.invoiceId) {
              const newPaid = inv.paidAmount + amt;
              return { ...inv, paidAmount: newPaid, dueAmount: inv.netPayable - newPaid };
          }
          return inv;
      }));
      setSuccessMessage("Supplier payment processed!");
      setShowPaymentModal(false);
  };

  const selectMedicineForPurchase = (med: Medicine) => {
      setCurrentPurchaseItem({ id: med.id, tradeName: med.tradeName, genericName: med.genericName, formulation: med.formulation, strength: med.strength, unitPriceBuy: med.unitPriceBuy, unitPriceSell: med.unitPriceSell, qtyBuying: 1, lineTotalBuy: med.unitPriceBuy, expiryDate: '' });
      setSearchTerm(med.tradeName); setSuggestions([]); setShowSuggestions(false);
  };

  const selectMedicineForSale = (med: Medicine) => {
      setCurrentSalesItem({ id: med.id, tradeName: med.tradeName, genericName: med.genericName, formulation: med.formulation, strength: med.strength, unitPriceSell: med.unitPriceSell, stock: med.stock, qtySelling: 1, lineTotalSell: med.unitPriceSell });
      setSearchTerm(med.tradeName); setSuggestions([]); setShowSuggestions(false);
  };

  const addPurchaseItem = () => {
      if (!currentPurchaseItem.tradeName || (currentPurchaseItem.qtyBuying || 0) <= 0) return;
      const existingMed = medicines.find(m => m.tradeName.trim().toLowerCase() === currentPurchaseItem.tradeName?.trim().toLowerCase());
      if (!currentPurchaseItem.id && existingMed) {
          if (confirm(`"${existingMed.tradeName}" নামে ঔষধটি আগে থেকেই সিস্টেমে আছে। আপনি কি এই ঔষধটির সাথেই স্টক যোগ করতে চান?`)) {
              currentPurchaseItem.id = existingMed.id;
          } else { return; }
      }
      const newItem: InvoiceItem = { ...currentPurchaseItem as InvoiceItem, id: currentPurchaseItem.id || Date.now().toString(), lineTotalBuy: (Number(currentPurchaseItem.unitPriceBuy) || 0) * (Number(currentPurchaseItem.qtyBuying) || 0), stock: 0, defaultFrequency: '' };
      setPurchaseFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
      setCurrentPurchaseItem({ tradeName: '', genericName: '', formulation: 'Tab', strength: '', unitPriceBuy: 0, unitPriceSell: 0, qtyBuying: 0, lineTotalBuy: 0, expiryDate: '' });
      setSearchTerm(''); setShowSuggestions(false);
  };

  const addSalesItem = () => {
      if (!currentSalesItem.id) { alert("Please select a medicine from stock list only."); return; }
      const qty = Number(currentSalesItem.qtySelling) || 0; 
      const existingStock = medicines.find(m => m.id === currentSalesItem.id)?.stock || 0;
      
      const alreadyInDraft = salesFormData.items.find(i => i.id === currentSalesItem.id)?.qtySelling || 0;
      const available = existingStock - alreadyInDraft;

      if (qty <= 0 || qty > available) { alert(`Invalid Quantity. Available: ${available}`); return; }

      const existingItemIdx = salesFormData.items.findIndex(i => i.id === currentSalesItem.id);
      if (existingItemIdx >= 0) {
          const updatedItems = [...salesFormData.items];
          updatedItems[existingItemIdx].qtySelling += qty;
          updatedItems[existingItemIdx].lineTotalSell = updatedItems[existingItemIdx].qtySelling * updatedItems[existingItemIdx].unitPriceSell;
          setSalesFormData(prev => ({ ...prev, items: updatedItems }));
      } else {
          const newItem: SalesItem = { id: currentSalesItem.id, tradeName: currentSalesItem.tradeName || '', genericName: currentSalesItem.genericName || '', formulation: currentSalesItem.formulation || '', strength: currentSalesItem.strength || '', unitPriceBuy: 0, unitPriceSell: Number(currentSalesItem.unitPriceSell) || 0, qtySelling: qty, lineTotalSell: (Number(currentSalesItem.unitPriceSell) || 0) * qty, stock: existingStock, defaultFrequency: '' };
          setSalesFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
      }
      setCurrentSalesItem({ tradeName: '', genericName: '', formulation: 'Tab', strength: '', unitPriceSell: 0, qtySelling: 0, lineTotalSell: 0, stock: 0 });
      setSearchTerm(''); setShowSuggestions(false);
  };

  const removePurchaseItem = (index: number) => { setPurchaseFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) })); };
  const removeSalesItem = (index: number) => { setSalesFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) })); };

  const handleSavePurchase = () => {
      if (!purchaseFormData.source) { setErrors({ source: true }); return; }
      if (purchaseFormData.items.length === 0) return;
      const updatedMedicines = [...medicines];
      purchaseFormData.items.forEach(item => {
          const idx = updatedMedicines.findIndex(m => m.id === item.id);
          if (idx >= 0) { 
              updatedMedicines[idx].stock += Number(item.qtyBuying); 
              updatedMedicines[idx].unitPriceBuy = Number(item.unitPriceBuy); 
              updatedMedicines[idx].unitPriceSell = Number(item.unitPriceSell); 
              updatedMedicines[idx].genericName = item.genericName;
              updatedMedicines[idx].strength = item.strength;
              updatedMedicines[idx].formulation = item.formulation;
              updatedMedicines[idx].expiryDate = item.expiryDate;
          }
          else { 
              updatedMedicines.push({ id: item.id, tradeName: item.tradeName, genericName: item.genericName, formulation: item.formulation, strength: item.strength, stock: Number(item.qtyBuying), unitPriceBuy: item.unitPriceBuy, unitPriceSell: item.unitPriceSell, expiryDate: item.expiryDate }); 
          }
      });
      setMedicines(updatedMedicines);
      setInvoices([ { ...purchaseFormData, status: 'Posted', createdDate: new Date().toISOString() }, ...invoices ]);
      setSuccessMessage("Purchase invoice saved!");
      setBuyViewMode('list');
      setPurchaseFormData({ invoiceId: '', invoiceDate: new Date().toISOString().split('T')[0], source: '', items: [], totalAmount: 0, discount: 0, netPayable: 0, paidAmount: 0, dueAmount: 0, billCreatedBy: 'Admin', billPaidBy: '', receivedBy: '', status: 'Saved', createdDate: '' });
  };

  const handleSaveSales = () => {
      if (!salesFormData.customerName) { setErrors({ customerName: true }); return; }
      if (salesFormData.items.length === 0) return;
      
      // We use functional updates to ensure consistency
      setMedicines(prevMeds => {
          const newMeds = [...prevMeds];
          
          // Revert old if editing
          if (sellViewMode === 'edit' && editingInvoiceId) {
              const oldInv = salesInvoices.find(x => x.invoiceId === editingInvoiceId);
              if (oldInv) {
                  oldInv.items.forEach(oldItem => {
                      const mIdx = newMeds.findIndex(m => m.id === oldItem.id);
                      if (mIdx >= 0) newMeds[mIdx] = { ...newMeds[mIdx], stock: newMeds[mIdx].stock + oldItem.qtySelling };
                  });
              }
          }

          // Apply current form quantities
          salesFormData.items.forEach(newItem => {
              const mIdx = newMeds.findIndex(m => m.id === newItem.id);
              if (mIdx >= 0) newMeds[mIdx] = { ...newMeds[mIdx], stock: newMeds[mIdx].stock - newItem.qtySelling };
          });
          return newMeds;
      });

      if (sellViewMode === 'edit') {
          setSalesInvoices(prev => prev.map(inv => inv.invoiceId === editingInvoiceId ? { ...salesFormData, status: 'Posted' } : inv));
          setSuccessMessage("Invoice Correction Saved!");
      } else {
          setSalesInvoices([ { ...salesFormData, status: 'Posted', createdDate: new Date().toISOString() }, ...salesInvoices ]);
          setSuccessMessage("Sale Completed Successfully!");
      }
      
      setSellViewMode('list');
      setEditingInvoiceId(null);
  };

  const handleReturnSale = (inv: SalesInvoice) => {
    if(!confirm(`পেশেন্ট "${inv.customerName}" এর সকল ঔষধ ফেরত নিতে চান? স্টকে ঔষধ যোগ হয়ে যাবে।`)) return;
    
    // 1. Update Medicines Stock correctly using immutable updates
    setMedicines(prevMeds => prevMeds.map(m => {
        const returnedItem = inv.items.find(it => it.id === m.id);
        if (returnedItem) {
            return { ...m, stock: m.stock + returnedItem.qtySelling };
        }
        return m;
    }));

    // 2. Remove the Invoice
    setSalesInvoices(prev => prev.filter(x => x.invoiceId !== inv.invoiceId));
    setSuccessMessage("Return Processed! Stock Restored.");
  };

  const startEditSale = (inv: SalesInvoice) => {
    setSalesFormData({...inv});
    setEditingInvoiceId(inv.invoiceId);
    setSellViewMode('edit');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleSaveClinicalDrug = () => {
    if (!clinicalDrugForm.brandName || !clinicalDrugForm.genericName) return;
    if (isEditingDrug) setClinicalDrugs(prev => prev.map(d => d.id === clinicalDrugForm.id ? clinicalDrugForm : d));
    else setClinicalDrugs(prev => [{ ...clinicalDrugForm, id: Date.now().toString() }, ...prev]);
    // Fix: Removed 'contraindications' property from state update to match DrugMonograph interface
    setClinicalDrugForm({ id: '', brandName: '', genericName: '', strength: '', formulation: 'Tab', company: '', pregnancyCategory: 'B', indications: [], sideEffects: [], adultDose: '' });
    setIsEditingDrug(false);
    setSuccessMessage("Drug Database updated!");
  };

  // --- PRINT FUNCTIONS ---

  const handlePrintPurchase = (inv: PurchaseInvoice) => {
    const printContent = `<html><head><title>Purchase ${inv.invoiceId}</title><style>@page{size:A4;margin:15mm}body{font-family:sans-serif;padding:0;color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:12px}th{background:#f4f4f4}.header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:20px}.header h1{margin:0;font-size:20px}.total-area{margin-top:20px;text-align:right;font-weight:bold;font-size:13px}</style></head><body><div class="header"><h1>Niramoy Clinic & Diagnostic</h1><p>Enayetpur, Sirajgonj | 01730 923007</p><p><b>Purchase Voucher</b></p></div><p>Invoice: ${inv.invoiceId} | Date: ${inv.invoiceDate}<br>Supplier: <b>${inv.source}</b></p><table><thead><tr><th>Item Name</th><th>Generic</th><th>Qty</th><th>Buy Price</th><th>Total</th></tr></thead><tbody>${inv.items.map(i=>`<tr><td>${i.tradeName} ${i.strength}</td><td>${i.genericName}</td><td>${i.qtyBuying}</td><td>${i.unitPriceBuy.toFixed(2)}</td><td>${i.lineTotalBuy.toFixed(2)}</td></tr>`).join('')}</tbody></table><div class="total-area"><p>Net Payable: ৳${inv.netPayable.toFixed(2)}</p><p>Paid: ৳${inv.paidAmount.toFixed(2)}</p><p>Due: ৳${inv.dueAmount.toFixed(2)}</p></div><div style="margin-top:50px;display:flex;justify-content:space-between"><div style="border-top:1px solid #000;width:150px;text-align:center;font-size:10px">Supplier Signature</div><div style="border-top:1px solid #000;width:150px;text-align:center;font-size:10px">Received By</div></div></body></html>`;
    const win = window.open('', '_blank'); win?.document.write(printContent); win?.document.close(); win?.print();
  };

  const handlePrintSale = (inv: SalesInvoice) => {
    const printContent = `<html><head><title>Invoice ${inv.invoiceId}</title><style>@page{size:A4;margin:15mm}body{font-family:sans-serif;padding:0;color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccc;padding:10px;text-align:left;font-size:13px}th{background:#f4f4f4}.header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:20px}.header h1{margin:0;font-size:24px}.total-area{margin-top:20px;text-align:right;font-weight:bold;font-size:15px}</style></head><body><div class="header"><h1>Niramoy Clinic & Diagnostic</h1><p>Enayetpur, Sirajgonj | 01730 923007</p><p>Medicine Invoice</p></div><p>Customer: <b>${inv.customerName}</b> | Mobile: ${inv.customerMobile}<br>Invoice: ${inv.invoiceId} | Date: ${inv.invoiceDate}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${inv.items.map(i=>`<tr><td>${i.tradeName} ${i.strength}</td><td>${i.qtySelling}</td><td>${i.unitPriceSell}</td><td>${i.lineTotalSell.toFixed(2)}</td></tr>`).join('')}</tbody></table><div class="total-area"><p>Net Payable: ৳${inv.netPayable.toFixed(2)}</p></div><div style="margin-top:100px;text-align:right"><p style="border-top:1px solid #000;display:inline-block;padding:5px 20px">Authorized Signature</p></div></body></html>`;
    const win = window.open('', '_blank'); win?.document.write(printContent); win?.document.close(); win?.print();
  };

  const handlePrintStore = () => {
    const printContent = `<html><head><title>Stock Report</title><style>@page{size:A4;margin:15mm}body{font-family:sans-serif;padding:0;color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #000;padding:5px;text-align:left;font-size:10px}th{background:#f4f4f4;text-transform:uppercase}.header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:10px}.header h1{margin:0;font-size:18px}</style></head><body><div class="header"><h1>Niramoy Clinic & Diagnostic</h1><p>Stock Status Report - ${new Date().toLocaleDateString()}</p></div><table><thead><tr><th>Brand Name</th><th>Generic</th><th>Strength</th><th>Exp</th><th>Buy P.</th><th>Sell P.</th><th>Stock</th><th>Value</th></tr></thead><tbody>${medicines.map(m=>`<tr><td>${m.tradeName}</td><td>${m.genericName}</td><td>${m.strength}</td><td>${m.expiryDate||'N/A'}</td><td>${m.unitPriceBuy.toFixed(2)}</td><td>${m.unitPriceSell.toFixed(2)}</td><td style="font-weight:bold">${m.stock}</td><td>${(m.stock*m.unitPriceBuy).toFixed(2)}</td></tr>`).join('')}</tbody></table><div style="margin-top:20px;text-align:right;font-weight:bold;font-size:12px">Total Inventory Value: ৳${medicines.reduce((s,m)=>s+(m.stock*m.unitPriceBuy),0).toFixed(2)}</div></body></html>`;
    const win = window.open('', '_blank'); win?.document.write(printContent); win?.document.close(); win?.print();
  };

  const handlePrintHishab = () => {
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.name || '';
    const filteredPurchases = invoices.filter(inv => {
        if (!inv.invoiceDate) return false;
        const [y, m] = inv.invoiceDate.split('-').map(Number);
        return (m - 1) === selectedMonth && y === selectedYear;
    });
    const filteredSales = salesInvoices.filter(inv => {
        if (!inv.invoiceDate) return false;
        const [y, m] = inv.invoiceDate.split('-').map(Number);
        return (m - 1) === selectedMonth && y === selectedYear;
    });
    const buyTotals = filteredPurchases.reduce((acc, inv) => { acc.val += inv.netPayable; acc.paid += inv.paidAmount; return acc; }, { val: 0, paid: 0 });
    const saleTotals = filteredSales.reduce((sum, inv) => sum + inv.netPayable, 0);

    const printContent = `
    <html>
    <head>
        <title>Medicine Account Summary - ${monthName} ${selectedYear}</title>
        <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; color: #1e40af; }
            .header p { margin: 2px 0; font-size: 12px; font-weight: bold; }
            .report-title { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; text-transform: uppercase; }
            .summary-box { display: flex; gap: 10px; margin-bottom: 30px; }
            .stat-card { flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; background: #f9fafb; }
            .stat-card span { display: block; font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 5px; }
            .stat-card b { font-size: 18px; color: #000; }
            .stat-card.balance { border: 2px solid #3b82f6; background: #eff6ff; }
            .tables-container { display: flex; flex-direction: column; gap: 30px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f3f4f6; font-weight: bold; text-transform: uppercase; }
            .text-right { text-align: right; }
            .tfoot { background: #eee; font-weight: bold; }
            .ledger-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; border-left: 4px solid #3b82f6; padding-left: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Niramoy Clinic & Diagnostic</h1>
            <p>Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
        </div>
        <div class="report-title">Medicine Ledger Analysis: ${monthName} - ${selectedYear}</div>
        <div class="summary-box">
            <div class="stat-card"><span>Total Purchase (Buy)</span><b>৳ ${buyTotals.val.toLocaleString()}</b></div>
            <div class="stat-card"><span>Total Sales (Sell)</span><b>৳ ${saleTotals.toLocaleString()}</b></div>
            <div class="stat-card balance"><span>Net Balance</span><b>৳ ${(saleTotals - buyTotals.val).toLocaleString()}</b></div>
        </div>
        <div class="tables-container">
            <div>
                <div class="ledger-title">Stock Purchase Ledger</div>
                <table>
                    <thead><tr><th>Date</th><th>Supplier</th><th class="text-right">Bill Amount</th><th className="text-right">Paid</th></tr></thead>
                    <tbody>${filteredPurchases.map(inv => `<tr><td>${inv.invoiceDate}</td><td>${inv.source}</td><td class="text-right">৳${inv.netPayable.toLocaleString()}</td><td class="text-right">৳${inv.paidAmount.toLocaleString()}</td></tr>`).join('')}</tbody>
                    <tfoot class="tfoot"><tr><td colspan="2" class="text-right">TOTAL:</td><td class="text-right">৳${buyTotals.val.toLocaleString()}</td><td class="text-right">৳${buyTotals.paid.toLocaleString()}</td></tr></tfoot>
                </table>
            </div>
            <div>
                <div class="ledger-title">Outdoor Sales Journal</div>
                <table>
                    <thead><tr><th>Date</th><th>Category</th><th class="text-right">Sales Amount</th></tr></thead>
                    <tbody>${filteredSales.map(inv => `<tr><td>${inv.invoiceDate}</td><td>Outdoor Sale</td><td class="text-right">৳${inv.netPayable.toLocaleString()}</td></tr>`).join('')}</tbody>
                    <tfoot class="tfoot"><tr><td colspan="2" class="text-right">GRAND REVENUE:</td><td class="text-right">৳${saleTotals.toLocaleString()}</td></tr></tfoot>
                </table>
            </div>
        </div>
    </body>
    </html>`;
    const win = window.open('', '_blank'); win?.document.write(printContent); win?.document.close(); setTimeout(() => win?.print(), 500);
  };

  // --- RENDER SECTIONS ---

  const renderBuyTab = () => {
    if(buyViewMode === 'list') return (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-blue-400">Purchase Invoices</h2><button onClick={() => {const newId = `PUR-${Date.now()}`; setPurchaseFormData({invoiceId: newId, invoiceDate: new Date().toISOString().split('T')[0], source: '', items: [], totalAmount: 0, discount: 0, netPayable: 0, paidAmount: 0, dueAmount: 0, billCreatedBy: 'Admin', billPaidBy: '', receivedBy: '', status: 'Saved', createdDate: ''}); setBuyViewMode('add'); setErrors({});}} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-500 font-bold shadow-lg transition-all">+ Add New Purchase</button></div>
            <div className="overflow-x-auto rounded-xl border border-slate-700 shadow-2xl"><table className="w-full text-left border-collapse"><thead className="bg-slate-700 text-slate-100"><tr><th className="p-4 uppercase text-xs font-black">ID</th><th className="p-4 uppercase text-xs font-black">Date</th><th className="p-4 uppercase text-xs font-black">Supplier</th><th className="p-4 text-right uppercase text-xs font-black">Net Amount</th><th className="p-4 text-right uppercase text-xs font-black">Due</th><th className="p-4 text-center uppercase text-xs font-black">Actions</th></tr></thead><tbody>{invoices.map(inv => (<tr key={inv.invoiceId} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-750 transition-colors"><td className="p-4 text-slate-300 font-mono text-sm">{inv.invoiceId}</td><td className="p-4 text-slate-100 font-bold">{inv.invoiceDate}</td><td className="p-4 text-white font-black text-base">{inv.source}</td><td className="p-4 text-sky-400 text-right font-black">৳{inv.netPayable.toFixed(2)}</td><td className="p-4 text-red-500 text-right font-black">৳{inv.dueAmount.toFixed(2)}</td><td className="p-4 text-center space-x-4"><button onClick={() => { setPurchaseFormData(inv); setBuyViewMode('edit'); setErrors({}); }} className="text-sky-400 hover:text-white text-sm font-bold underline">Edit</button><button onClick={() => handlePrintPurchase(inv)} className="text-emerald-400 hover:text-white text-sm font-bold underline">Print</button></td></tr>))}</tbody></table></div>
        </div>
    );
    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-black text-white mb-6 border-b border-slate-700 pb-2">{buyViewMode === 'add' ? 'New Purchase Entry' : 'Edit Purchase Entry'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div><label className="block text-xs font-black text-slate-400 mb-1 uppercase">Invoice ID</label><input type="text" value={purchaseFormData.invoiceId} disabled className="w-full bg-slate-900 border border-slate-600 rounded p-2.5 text-slate-500 font-bold" /></div>
                <div><label className="block text-xs font-black text-slate-400 mb-1 uppercase">Date</label><input type="date" value={purchaseFormData.invoiceDate} onChange={e=>setPurchaseFormData({...purchaseFormData, invoiceDate:e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2.5 text-white font-black" /></div>
                <div className="relative"><label className="block text-xs font-black text-slate-400 mb-1 uppercase">Supplier Name</label><input type="text" value={purchaseFormData.source} onChange={e=>handleSupplierChange(e.target.value)} onFocus={() => handleSupplierChange(purchaseFormData.source)} onBlur={()=>setTimeout(()=>setShowSupplierSuggestions(false), 200)} className={`w-full bg-slate-900 border rounded p-2.5 text-white font-black ${errors.source ? 'border-red-500' : 'border-slate-600'}`} placeholder="Search Supplier..." autoComplete="off"/>{showSupplierSuggestions && supplierSuggestions.length > 0 && (<ul className="absolute z-50 w-full bg-slate-700 border border-slate-500 mt-1 max-h-48 overflow-y-auto rounded shadow-2xl">{supplierSuggestions.map((s,i)=>(<li key={i} onMouseDown={()=>setPurchaseFormData({...purchaseFormData, source: s})} className="p-3 hover:bg-slate-600 cursor-pointer text-white text-sm border-b border-slate-600/30 last:border-0 font-bold">{s}</li>))}</ul>)}</div>
            </div>
            <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-700 mb-6 shadow-inner">
                <h3 className="text-xs font-black text-blue-300 mb-4 uppercase tracking-[0.2em]">Add Medicine Items (Trade + Generic)</h3>
                
                <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-[2] min-w-[200px] relative">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase ml-1">Trade_Name</label>
                        <input type="text" value={searchTerm} onChange={e=>handleSearchChange(e.target.value, 'buy')} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(()=>setShowSuggestions(false), 200)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-black text-sm placeholder-slate-600" placeholder="Brand Name" />
                        {showSuggestions && suggestions.length > 0 && <ul className="absolute z-50 w-full bg-slate-700 border border-slate-500 mt-1 max-h-56 overflow-y-auto rounded shadow-2xl">{suggestions.map(m=><li key={m.id} onMouseDown={()=>selectMedicineForPurchase(m)} className="p-2 hover:bg-slate-600 cursor-pointer text-white border-b border-slate-600 flex flex-col"><span className="font-black text-xs">{m.tradeName} ({m.strength})</span><span className="text-[10px] text-slate-400 font-bold italic">{m.genericName}</span></li>)}</ul>}
                    </div>
                    <div className="flex-[1.5] min-w-[150px]">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Generic_Name</label>
                        <input type="text" value={currentPurchaseItem.genericName} onChange={e=>setCurrentPurchaseItem({...currentPurchaseItem, genericName:e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-black text-sm" placeholder="Generic Formula"/>
                    </div>
                    <div className="w-20">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Form</label>
                        <select value={currentPurchaseItem.formulation} onChange={e=>setCurrentPurchaseItem({...currentPurchaseItem, formulation:e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-[11px] font-black h-[38px]">{formulations.map(f=><option key={f} value={f}>{f}</option>)}</select>
                    </div>
                    <div className="w-20">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Strength</label>
                        <input type="text" value={currentPurchaseItem.strength} onChange={e=>setCurrentPurchaseItem({...currentPurchaseItem, strength:e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-black text-sm" placeholder="e.g. 500mg"/>
                    </div>
                    <div className="w-28">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Expiry</label>
                        <input type="month" value={currentPurchaseItem.expiryDate} onChange={e=>setCurrentPurchaseItem({...currentPurchaseItem, expiryDate:e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs font-black" />
                    </div>
                    <div className="w-20">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Buy_Price</label>
                        <input type="number" value={currentPurchaseItem.unitPriceBuy} onChange={e=>setCurrentPurchaseItem({...currentPurchaseItem, unitPriceBuy:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm font-black" />
                    </div>
                    <div className="w-20">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Sell_Price</label>
                        <input type="number" value={currentPurchaseItem.unitPriceSell} onChange={e=>setCurrentPurchaseItem({...currentPurchaseItem, unitPriceSell:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm font-black" />
                    </div>
                    <div className="w-16">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Qnty</label>
                        <input type="number" value={currentPurchaseItem.qtyBuying} onChange={e=>setCurrentPurchaseItem({...currentPurchaseItem, qtyBuying:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm font-black text-center" />
                    </div>
                    <button onClick={addPurchaseItem} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-500 font-black shadow-lg text-sm uppercase">Add</button>
                </div>
            </div>
            <div className="overflow-x-auto border-2 border-slate-700 rounded-xl mb-6 shadow-xl"><table className="w-full text-left border-collapse text-sm text-slate-100"><thead className="bg-slate-700 text-white"><tr><th className="p-3 uppercase text-xs">Medicine (Trade + Generic)</th><th className="p-3 text-right uppercase text-xs">Buy P.</th><th className="p-3 text-right uppercase text-xs">Sell P.</th><th className="p-3 text-right uppercase text-xs">Qty</th><th className="p-3 text-right uppercase text-xs">Total</th><th className="p-3 text-center uppercase text-xs">X</th></tr></thead><tbody>{purchaseFormData.items.map((item, i) => (<tr key={i} className="border-b border-slate-700 bg-slate-850"><td className="p-3 font-black text-white"><div>{item.tradeName} <span className="text-xs font-bold text-slate-500">({item.strength})</span></div><div className="text-[10px] text-slate-400 italic font-bold uppercase">{item.genericName}</div></td><td className="p-3 text-right text-slate-300 font-bold">{item.unitPriceBuy.toFixed(2)}</td><td className="p-3 text-right text-slate-300 font-bold">{item.unitPriceSell.toFixed(2)}</td><td className="p-3 text-right font-black text-white">{item.qtyBuying}</td><td className="p-3 text-right font-black text-emerald-400 text-base">৳{item.lineTotalBuy.toFixed(2)}</td><td className="p-3 text-center"><button onClick={()=>removePurchaseItem(i)} className="text-red-500 font-black hover:text-white bg-slate-900 w-8 h-8 rounded-full">×</button></td></tr>))}</tbody></table></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700"><label className="block text-xs font-black text-slate-500 mb-2 uppercase">Bill Created By</label><select value={purchaseFormData.billCreatedBy} onChange={e=>setPurchaseFormData({...purchaseFormData, billCreatedBy:e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white font-black"><option value="Admin">Admin</option>{employees.map(e=><option key={e.emp_id} value={e.emp_name}>{e.emp_name}</option>)}</select></div>
                <div className="bg-slate-900 p-6 rounded-2xl border-2 border-slate-700 space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center text-slate-400 font-black text-xs uppercase"><span>Sub Total:</span> <span className="text-white text-xl">৳{purchaseFormData.totalAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-slate-400 font-black text-xs uppercase"><span>Discount:</span> <input type="number" value={purchaseFormData.discount} onChange={e=>setPurchaseFormData({...purchaseFormData, discount:parseFloat(e.target.value)||0})} className="w-28 bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-right text-white font-black focus:border-blue-500 outline-none"/></div>
                    <div className="flex justify-between items-center text-sky-400 font-black border-t-2 border-slate-800 pt-3 text-2xl uppercase"><span>Net Bill:</span> <span>৳{purchaseFormData.netPayable.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-emerald-400 font-black text-xs uppercase"><span>Paid Amount:</span> <input type="number" value={purchaseFormData.paidAmount} onChange={e=>setPurchaseFormData({...purchaseFormData, paidAmount:parseFloat(e.target.value)||0})} className="w-28 bg-slate-800 border border-slate-600 rounded p-2 text-right text-white font-black text-xl"/></div>
                    <div className="flex justify-between items-center text-red-500 font-black text-2xl uppercase"><span>Due Amount:</span> <span>৳{purchaseFormData.dueAmount.toFixed(2)}</span></div>
                </div>
            </div>
            <div className="mt-8 flex justify-end gap-4"><button onClick={()=>{setBuyViewMode('list'); setErrors({});}} className="px-8 py-3 bg-slate-700 text-white rounded-lg font-black hover:bg-slate-600 transition-all">Discard</button><button onClick={handleSavePurchase} className="px-16 py-3 bg-blue-600 text-white rounded-lg font-black shadow-2xl hover:bg-blue-500 transform active:scale-95 transition-all uppercase tracking-widest">Post Invoice</button></div>
        </div>
    );
  };

  const renderDuePaidTab = () => {
    const dueInvoices = invoices.filter(i => i.dueAmount > 0.5);
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-red-500 uppercase tracking-tighter border-b border-red-900/50 pb-2 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> Pending Supplier Payments (Due)</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-700 shadow-2xl"><table className="w-full text-left border-collapse"><thead className="bg-slate-700 text-slate-100"><tr><th className="p-4 uppercase text-xs font-black">Inv-Date</th><th className="p-4 uppercase text-xs font-black">Supplier Name</th><th className="p-4 uppercase text-xs font-black text-right">Total Bill</th><th className="p-4 uppercase text-xs font-black text-right">Paid</th><th className="p-4 uppercase text-xs font-black text-right text-red-400">Current Due</th><th className="p-4 uppercase text-xs font-black text-center">Action</th></tr></thead><tbody className="divide-y divide-slate-700">{dueInvoices.map(inv => (<tr key={inv.invoiceId} className="bg-slate-800 hover:bg-slate-750 transition-colors"><td className="p-4 text-slate-300 font-bold">{inv.invoiceDate}</td><td className="p-4 text-white font-black text-base">{inv.source}</td><td className="p-4 text-right text-slate-300 font-bold">{inv.netPayable.toFixed(2)}</td><td className="p-4 text-right text-emerald-400 font-black">৳{inv.paidAmount.toFixed(2)}</td><td className="p-4 text-right text-red-500 font-black text-2xl">৳{inv.dueAmount.toFixed(2)}</td><td className="p-4 text-center"><button onClick={()=>{setPaymentData({invoiceId: inv.invoiceId, supplierName: inv.source, currentDue: inv.dueAmount, payAmount: ''}); setShowPaymentModal(true);}} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-black shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest">Pay Now</button></td></tr>))}</tbody></table>{dueInvoices.length === 0 && <div className="p-20 text-center text-slate-500 font-black text-2xl italic uppercase opacity-30">Clear! No Pending Supplier Dues.</div>}</div>
        </div>
    );
  };

  const renderSellTab = () => {
    if(sellViewMode === 'list') return (
        <div className="space-y-6">
            <div className="flex bg-[#20293a] p-1 rounded-lg border border-[#374151]">
                <button onClick={() => setSellSubTab('outdoor')} className={`flex-1 py-2 rounded-md font-bold text-xs uppercase transition-all ${sellSubTab === 'outdoor' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Outdoor Medicine Sales</button>
                <button onClick={() => setSellSubTab('indoor')} className={`flex-1 py-2 rounded-md font-bold text-xs uppercase transition-all ${sellSubTab === 'indoor' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Indoor Medicine Management</button>
            </div>

            {sellSubTab === 'outdoor' ? (
                <>
                    <div className="flex justify-between items-center border-b border-slate-700 pb-3"><h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Direct Outdoor Sales</h2><button onClick={() => {const newId = `SL-${Date.now()}`; setSalesFormData({invoiceId: newId, invoiceDate: new Date().toISOString().split('T')[0], customerName: '', customerMobile: '', customerAge: '', customerGender: '', refDoctorName: '', items: [], totalAmount: 0, discount: 0, netPayable: 0, paidAmount: 0, dueAmount: 0, billCreatedBy: 'Admin', status: 'Saved', createdDate: ''}); setSellViewMode('add'); setErrors({}); setEditingInvoiceId(null);}} className="bg-emerald-600 text-white px-8 py-2 rounded-lg hover:bg-emerald-500 font-black shadow-2xl transition-all">+ New Sale</button></div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-700 shadow-2xl"><table className="w-full text-left border-collapse text-sm"><thead className="bg-slate-700 text-slate-100"><tr><th className="p-4 font-black">ID</th><th className="p-4 font-black">Date</th><th className="p-4 font-black">Customer Name</th><th className="p-4 text-right font-black">Net Amount</th><th className="p-4 text-center font-black">Action</th></tr></thead><tbody>{salesInvoices.map(inv => (<tr key={inv.invoiceId} onClick={() => handlePrintSale(inv)} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer group"><td className="p-4 text-slate-300 font-mono text-xs group-hover:text-emerald-400 transition-colors underline">{inv.invoiceId}</td><td className="p-4 text-slate-100 font-bold">{inv.invoiceDate}</td><td className="p-4 text-white font-black">{inv.customerName}</td><td className="p-4 text-emerald-400 text-right font-black">৳{inv.netPayable.toFixed(2)}</td><td className="p-4 text-center space-x-2" onClick={e=>e.stopPropagation()}><button onClick={() => handlePrintSale(inv)} className="text-sky-400 hover:text-white font-black uppercase text-[10px] border border-sky-800 px-3 py-1 rounded">Voucher</button><button onClick={() => startEditSale(inv)} className="text-amber-400 hover:text-white font-black uppercase text-[10px] border border-amber-800 px-3 py-1 rounded">Correct</button><button onClick={() => handleReturnSale(inv)} className="bg-rose-900/50 text-rose-400 hover:bg-rose-600 hover:text-white font-black uppercase text-[10px] border border-rose-800 px-3 py-1 rounded transition-all">Return</button></td></tr>))}</tbody></table>{salesInvoices.length === 0 && <div className="p-16 text-center text-slate-600 italic">No outdoor sales records.</div>}</div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center border-b border-slate-700 pb-3"><h2 className="text-xl font-bold text-purple-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Indoor Medicine Billing Records</h2></div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-700 shadow-2xl"><table className="w-full text-left border-collapse text-sm"><thead className="bg-slate-700 text-slate-100"><tr><th className="p-4 font-black">Invoice ID</th><th className="p-4 font-black">Patient Name</th><th className="p-4 font-black">Date</th><th className="p-4 text-right font-black">Medicine Bill</th><th className="p-4 text-center font-black">Details</th></tr></thead><tbody>{indoorInvoices.filter(inv => inv.items.some(it => it.service_type === 'Medicine')).map(inv => { const medTotal = inv.items.filter(it => it.service_type === 'Medicine').reduce((s, it) => s + it.payable_amount, 0); return (<tr key={inv.daily_id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-750 transition-colors"><td className="p-4 text-slate-300 font-mono text-xs">{inv.daily_id}</td><td className="p-4 text-white font-black">{inv.patient_name}</td><td className="p-4 text-slate-100">{inv.invoice_date}</td><td className="p-4 text-purple-400 text-right font-black">৳{medTotal.toFixed(2)}</td><td className="p-4 text-center"><span className="text-slate-500 text-xs italic">Billed to IPD</span></td></tr>); })}</tbody></table>{indoorInvoices.length === 0 && <div className="p-16 text-center text-slate-600 italic">No indoor medicine billing records.</div>}</div>
                </>
            )}
        </div>
    );
    return (
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-black text-emerald-400 mb-8 border-b border-slate-700 pb-2">{sellViewMode === 'edit' ? 'Correction: Adjust Outdoor Sale' : 'Direct Outdoor Sale Form'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div><label className="block text-xs font-black text-slate-400 mb-1 uppercase">Invoice ID</label><input type="text" value={salesFormData.invoiceId} disabled className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-500 font-bold"/></div>
                <div><label className="block text-xs font-black text-slate-400 mb-1 uppercase">Customer Name</label><input type="text" value={salesFormData.customerName} onChange={e=>setSalesFormData({...salesFormData, customerName:e.target.value})} className={`w-full bg-slate-900 border rounded-xl p-3 text-white font-black ${errors.customerName?'border-red-500':'border-slate-700 focus:border-emerald-500 outline-none shadow-inner'}`}/></div>
                <div><label className="block text-xs font-black text-slate-400 mb-1 uppercase">Mobile No.</label><input type="text" value={salesFormData.customerMobile} onChange={e=>setSalesFormData({...salesFormData, customerMobile:e.target.value})} className={`w-full bg-slate-900 border rounded-xl p-3 text-white font-black shadow-inner ${errors.customerMobile?'border-red-500':'border-slate-700'}`}/></div>
                <div><label className="block text-xs font-black text-slate-400 mb-1 uppercase">Referrer</label><input type="text" value={salesFormData.refDoctorName} onChange={e=>setSalesFormData({...salesFormData, refDoctorName:e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold shadow-inner" placeholder="Optional"/></div>
            </div>
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700 mb-8 shadow-inner ring-1 ring-emerald-500/10">
                <h3 className="text-xs font-black text-emerald-300 mb-4 uppercase tracking-[0.3em] flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></span> Stock Check & Add</h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[350px] relative">
                        <label className="block text-xs font-black text-slate-500 mb-1 uppercase ml-1">Search & Select Medicine (Trade + Generic)</label>
                        <input type="text" value={searchTerm} onChange={e=>handleSearchChange(e.target.value, 'sell')} onFocus={() => handleSearchChange('', 'sell')} onBlur={() => setTimeout(()=>setShowSuggestions(false), 200)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white font-black placeholder-slate-800 shadow-lg focus:ring-2 focus:ring-emerald-500 outline-none text-lg" placeholder="Search Brand/Generic..." />
                        {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute z-[100] w-full bg-slate-800 border-2 border-slate-500 mt-2 max-h-80 overflow-y-auto rounded-2xl shadow-2xl divide-y divide-slate-700">
                            {suggestions.map(m=><li key={m.id} onMouseDown={()=>selectMedicineForSale(m)} className="p-4 hover:bg-emerald-900/30 cursor-pointer text-white flex justify-between items-center transition-colors"><div className="flex flex-col"><span className="font-black text-white text-lg">{m.tradeName} <span className="text-sky-400 font-bold">({m.strength})</span></span><span className="text-xs text-slate-400 font-bold italic">{m.genericName}</span></div><span className={`text-xs px-3 py-1 rounded-full font-black ${m.stock < 10 ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>STOCK: {m.stock}</span></li>)}
                        </ul>
                        )}
                    </div>
                    <div className="w-28"><label className="block text-xs font-black text-slate-500 mb-1 uppercase text-center">Unit P.</label><input type="number" value={currentSalesItem.unitPriceSell} onChange={e=>setCurrentSalesItem({...currentSalesItem, unitPriceSell:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white font-black text-right" /></div>
                    <div className="w-24"><label className="block text-xs font-black text-slate-500 mb-1 uppercase text-center">Qty</label><input type="number" value={currentSalesItem.qtySelling} onChange={e=>setCurrentSalesItem({...currentSalesItem, qtySelling:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white font-black text-center" /></div>
                    <button onClick={addSalesItem} className="bg-emerald-600 text-white px-10 py-4 rounded-xl hover:bg-emerald-500 font-black shadow-2xl transform active:scale-95 transition-all">Add Item</button>
                </div>
            </div>
            <div className="overflow-x-auto border-2 border-slate-700 rounded-2xl mb-8 shadow-2xl"><table className="w-full text-left border-collapse text-sm"><thead className="bg-slate-700 text-white"><tr><th className="p-4 uppercase text-xs font-black">X</th><th className="p-4 uppercase text-xs font-black">Medicine Info</th><th className="p-4 text-right uppercase text-xs font-black">Price</th><th className="p-4 text-center uppercase text-xs font-black">Qty</th><th className="p-4 text-right uppercase text-xs font-black">Line Total</th></tr></thead><tbody>{salesFormData.items.map((item, i) => (<tr key={i} className="border-b border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-colors"><td className="p-4 text-center"><button onClick={()=>removeSalesItem(i)} className="text-red-500 font-black bg-slate-900 w-10 h-10 rounded-full flex items-center justify-center border border-red-900">×</button></td><td className="p-4"><div className="font-black text-white text-lg">{item.tradeName} <span className="text-sm font-bold text-sky-400">({item.strength})</span></div><div className="text-xs text-slate-400 italic font-bold">{item.genericName}</div></td><td className="p-4 text-right text-slate-300 font-bold">{item.unitPriceSell.toFixed(2)}</td><td className="p-4 text-center font-black text-white text-2xl">{item.qtySelling}</td><td className="p-4 text-right font-black text-emerald-400 text-2xl">৳{item.lineTotalSell.toFixed(2)}</td></tr>))}</tbody></table>{salesFormData.items.length === 0 && <div className="p-16 text-center text-slate-800 font-black italic uppercase">No items added to bill.</div>}</div>
            <div className="flex flex-col md:flex-row justify-end gap-6">
                <div className="bg-slate-900 p-8 rounded-3xl border-2 border-slate-700 space-y-5 w-full md:w-[450px] shadow-2xl">
                    <div className="flex justify-between items-center text-slate-500 font-black uppercase text-xs tracking-widest"><span>Sub-Total Gross:</span> <span className="text-white text-2xl">৳{salesFormData.totalAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-slate-500 font-black uppercase text-xs tracking-widest"><span>Less Discount:</span> <input type="number" value={salesFormData.discount} onChange={e=>setSalesFormData({...salesFormData, discount:parseFloat(e.target.value)||0})} className="w-32 bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-right text-white font-black text-lg focus:border-blue-500 outline-none"/></div>
                    <div className="flex justify-between items-center text-sky-400 font-black border-t-2 border-slate-800 pt-5 text-3xl uppercase tracking-tighter"><span>NET BILL:</span> <span>৳{salesFormData.netPayable.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-emerald-400 font-black uppercase text-xs tracking-widest"><span>Cash Received:</span> <input type="number" value={salesFormData.paidAmount} onChange={e=>setSalesFormData({...salesFormData, paidAmount:parseFloat(e.target.value)||0})} className="w-32 bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-right text-white font-black text-2xl focus:border-emerald-500 outline-none"/></div>
                    <div className="flex justify-between items-center text-red-500 font-black text-3xl uppercase tracking-tighter"><span>DUE AMOUNT:</span> <span>৳{salesFormData.dueAmount.toFixed(2)}</span></div>
                </div>
            </div>
            <div className="mt-10 flex justify-end gap-5"><button onClick={()=>{setSellViewMode('list'); setErrors({}); setEditingInvoiceId(null);}} className="px-10 py-5 bg-slate-700 text-white rounded-2xl font-black hover:bg-slate-600 shadow-xl transition-all uppercase tracking-widest">Cancel</button><button onClick={handleSaveSales} className="px-20 py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-2xl hover:bg-emerald-500 transform active:scale-95 transition-all text-xl uppercase tracking-widest">{sellViewMode === 'edit' ? 'Update Corrections' : 'Complete Sale'}</button></div>
        </div>
    );
  };

  const renderStoreTab = () => {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3"><h2 className="text-2xl font-black text-purple-400 flex items-center gap-2 uppercase tracking-tighter"><span className="w-3 h-3 bg-purple-500 rounded-full"></span> Live Stock Inventory</h2><button onClick={handlePrintStore} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"><FileTextIcon className="w-4 h-4"/> Print Stock List</button></div>
              <div className="overflow-x-auto rounded-2xl border border-slate-700 shadow-2xl"><table className="w-full text-left border-collapse text-sm"><thead className="bg-slate-700 text-slate-100"><tr><th className="p-4 uppercase text-xs font-black tracking-widest">Brand Name</th><th className="p-4 uppercase text-xs font-black tracking-widest">Generic</th><th className="p-4 uppercase text-xs font-black tracking-widest">Form</th><th className="p-4 text-right uppercase text-xs font-black tracking-widest">Expiry</th><th className="p-4 text-right uppercase text-xs font-black tracking-widest">Buy P.</th><th className="p-4 text-right uppercase text-xs font-black tracking-widest">Sell P.</th><th className="p-4 text-center uppercase text-xs font-black tracking-widest">Stock</th><th className="p-4 text-right uppercase text-xs font-black tracking-widest">Asset Value</th></tr></thead><tbody className="divide-y divide-slate-700">{medicines.map((m, i) => (<tr key={i} className="bg-slate-800 hover:bg-slate-750 transition-colors"><td className="p-4 font-black text-white text-base">{m.tradeName} <span className="text-xs font-bold text-slate-500">{m.strength}</span></td><td className="p-4 text-sky-400 text-sm font-bold italic">{m.genericName}</td><td className="p-4 text-slate-400 text-sm font-bold uppercase">{m.formulation}</td><td className="p-4 text-right text-xs font-mono">{m.expiryDate || 'N/A'}</td><td className="p-4 text-right text-slate-300 font-bold">৳{m.unitPriceBuy.toFixed(2)}</td><td className="p-4 text-right text-white font-black">৳{m.unitPriceSell.toFixed(2)}</td><td className={`p-4 text-center font-black text-xl ${m.stock < 10 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>{m.stock}</td><td className="p-4 text-right text-slate-400 font-bold">৳{(m.stock * m.unitPriceBuy).toFixed(2)}</td></tr>))}</tbody></table></div>
          </div>
      );
  };

  const renderMedicineChartTab = () => {
      const filteredDrugs = clinicalDrugs.filter(d => d.brandName.toLowerCase().includes(drugSearch.toLowerCase()) || d.genericName.toLowerCase().includes(drugSearch.toLowerCase()));
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
                  <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 border-b border-slate-700 pb-3 uppercase tracking-tighter"><FileTextIcon className="w-8 h-8 text-blue-400" /> {isEditingDrug ? 'Edit Monograph' : 'Drug Formulary Entry'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Trade Name</label><input className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white font-black focus:border-blue-500 outline-none" value={clinicalDrugForm.brandName} onChange={e=>setClinicalDrugForm({...clinicalDrugForm, brandName:e.target.value})}/></div>
                      <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Generic Name</label><input className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white font-black focus:border-blue-500 outline-none" value={clinicalDrugForm.genericName} onChange={e=>setClinicalDrugForm({...clinicalDrugForm, genericName:e.target.value})}/></div>
                      <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Preg. Category</label><select className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white font-black focus:border-blue-500 outline-none" value={clinicalDrugForm.pregnancyCategory} onChange={e=>setClinicalDrugForm({...clinicalDrugForm, pregnancyCategory:e.target.value as any})}><option>A</option><option>B</option><option>C</option><option>D</option><option>X</option><option>N/A</option></select></div>
                      <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Strength</label><input className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white font-black focus:border-blue-500 outline-none" value={clinicalDrugForm.strength} onChange={e=>setClinicalDrugForm({...clinicalDrugForm, strength:e.target.value})}/></div>
                  </div>
                  <div className="flex justify-end gap-4"><button onClick={() => { setIsEditingDrug(false); setClinicalDrugForm({ id: '', brandName: '', genericName: '', strength: '', formulation: 'Tab', company: '', pregnancyCategory: 'B', indications: [], sideEffects: [], adultDose: '' }); }} className="px-8 py-3 bg-slate-700 text-white rounded-xl font-bold transition-all">Reset</button><button onClick={handleSaveClinicalDrug} className="px-16 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-500 shadow-xl transition-all uppercase tracking-widest">{isEditingDrug ? 'Update' : 'Save Drug'}</button></div>
              </div>
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
                <div className="mb-6 flex justify-between items-center border-b border-slate-700 pb-3"><h3 className="text-xl font-black text-white uppercase tracking-tighter">Pharmacy Database</h3><div className="relative w-72"><input type="text" placeholder="Filter Brands..." value={drugSearch} onChange={e=>setDrugSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-full px-5 py-2 text-sm text-white focus:border-blue-500 outline-none"/></div></div>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-300 border-collapse"><thead className="bg-slate-700 text-slate-100"><tr><th className="p-4 uppercase text-xs font-black tracking-widest">Brand Name</th><th className="p-4 uppercase text-xs font-black tracking-widest">Generic</th><th className="p-4 uppercase text-xs font-black text-center tracking-widest">Preg Cat</th><th className="p-4 uppercase text-xs font-black text-center tracking-widest">Action</th></tr></thead><tbody>{filteredDrugs.map(d => (<tr key={d.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"><td className="p-4 font-black text-white text-base">{d.brandName} <span className="text-xs font-bold text-slate-500">{d.strength}</span></td><td className="p-4 italic text-sky-400 font-bold">{d.genericName}</td><td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black shadow-inner ${d.pregnancyCategory==='X'||d.pregnancyCategory==='D'?'bg-red-600 text-white':'bg-emerald-600 text-white'}`}>{d.pregnancyCategory}</span></td><td className="p-4 text-center space-x-3"><button onClick={()=>{setClinicalDrugForm(d); setIsEditingDrug(true); window.scrollTo({top:0, behavior:'smooth'});}} className="text-blue-400 hover:text-white font-bold underline">Edit</button><button onClick={()=>{if(confirm("Delete?")) setClinicalDrugs(prev=>prev.filter(x=>x.id!==d.id))}} className="text-red-500 hover:text-white font-bold underline">Del</button></td></tr>))}</tbody></table></div>
              </div>
          </div>
      );
  };

  const renderHishabTab = () => {
    const filteredPurchases = invoices.filter(inv => {
        if (!inv.invoiceDate) return false;
        const [y, m] = inv.invoiceDate.split('-').map(Number);
        return (m - 1) === selectedMonth && y === selectedYear;
    });
    const filteredSales = salesInvoices.filter(inv => {
        if (!inv.invoiceDate) return false;
        const [y, m] = inv.invoiceDate.split('-').map(Number);
        return (m - 1) === selectedMonth && y === selectedYear;
    });
    const buyTotals = filteredPurchases.reduce((acc, inv) => { acc.val += inv.netPayable; acc.paid += inv.paidAmount; return acc; }, { val: 0, paid: 0 });
    const saleTotals = { total: filteredSales.reduce((sum, inv) => sum + inv.netPayable, 0) };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl">
                <h3 className="text-2xl font-black text-white font-bengali tracking-tighter uppercase flex items-center gap-3"><span className="w-3 h-3 bg-amber-500 rounded-full"></span> Medicine Ledger analysis / হিসাব</h3>
                <div className="flex gap-4">
                    <button onClick={handlePrintHishab} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"><FileTextIcon className="w-4 h-4"/> Print A4 Sheet</button>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-2 text-white font-black">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-2 text-white font-black">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 flex flex-col items-center">
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Purchase (Buy)</span>
                    <span className="text-2xl font-black text-rose-400">৳ {buyTotals.val.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 flex flex-col items-center">
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Sales (Sell)</span>
                    <span className="text-2xl font-black text-emerald-400">৳ {saleTotals.total.toLocaleString()}</span>
                </div>
                <div className={`bg-slate-900 p-6 rounded-2xl border-2 flex flex-col items-center ${saleTotals.total - buyTotals.val >= 0 ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Net Balance</span>
                    <span className={`text-3xl font-black ${saleTotals.total - buyTotals.val >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                        ৳ {(saleTotals.total - buyTotals.val).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <h4 className="text-xl font-black text-blue-400 border-b-2 border-blue-900/50 pb-2 uppercase tracking-widest">Stock Purchase Ledger</h4>
                    <div className="overflow-x-auto rounded-2xl border-2 border-slate-700 shadow-2xl"><table className="w-full text-left border-collapse text-xs"><thead className="bg-slate-700 text-slate-100"><tr><th className="p-4 border-r border-slate-600">Date</th><th className="p-4 border-r border-slate-600">Supplier</th><th className="p-4 text-right">Bill</th><th className="p-4 text-right">Paid</th></tr></thead><tbody className="bg-slate-800 divide-y divide-slate-700">{filteredPurchases.map((inv) => (<tr key={inv.invoiceId}><td className="p-4 border-r border-slate-700 text-slate-400 font-mono">{inv.invoiceDate}</td><td className="p-4 border-r border-slate-700 font-black text-white">{inv.source}</td><td className="p-4 text-right font-black text-slate-300">৳{inv.netPayable.toLocaleString()}</td><td className="p-4 text-right text-emerald-400 font-black">৳{inv.paidAmount.toLocaleString()}</td></tr>))}</tbody><tfoot className="bg-slate-900 text-white font-black"><tr><td colSpan={2} className="p-4 text-right text-xs">MONTH TOTAL:</td><td className="p-4 text-right">৳{buyTotals.val.toLocaleString()}</td><td className="p-4 text-right text-emerald-400">৳{buyTotals.paid.toLocaleString()}</td></tr></tfoot></table></div>
                </div>
                <div className="space-y-4">
                    <h4 className="text-xl font-black text-emerald-400 border-b-2 border-emerald-900/50 pb-2 uppercase tracking-widest">Outdoor Sales Journal</h4>
                    <div className="overflow-x-auto rounded-2xl border-2 border-slate-700 shadow-2xl"><table className="w-full text-left border-collapse text-xs"><thead className="bg-slate-700 text-slate-100"><tr><th className="p-4 border-r border-slate-600">Date</th><th className="p-4 border-r border-slate-600">Category</th><th className="p-4 text-right">Sales Amt</th></tr></thead><tbody className="bg-slate-800 divide-y divide-slate-700">{filteredSales.map((inv) => (<tr key={inv.invoiceId}><td className="p-4 border-r border-slate-700 text-slate-400 font-mono">{inv.invoiceDate}</td><td className="p-4 border-r border-slate-700 text-emerald-300 font-black">Outdoor Sale</td><td className="p-4 text-right font-black text-emerald-400">৳{inv.netPayable.toLocaleString()}</td></tr>))}</tbody><tfoot className="bg-slate-900 text-white font-black"><tr><td colSpan={2} className="p-4 text-right text-xs">GRAND REVENUE:</td><td className="p-4 text-right text-emerald-400">৳{saleTotals.total.toLocaleString()}</td></tr></tfoot></table></div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {successMessage && <div className="fixed top-24 right-8 z-[150] bg-green-600 border-2 border-green-400 text-white px-10 py-5 rounded-2xl shadow-2xl font-black text-xl animate-fade-in-down">✅ {successMessage}</div>}
      
      {/* SUPPLIER PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-800 border-2 border-slate-600 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-scale-in">
                <h3 className="text-3xl font-black text-white mb-2 uppercase text-center tracking-tighter">Supplier Due Payment</h3>
                <p className="text-center text-slate-400 text-sm mb-8">Paying to: <span className="text-sky-400 font-black">{paymentData.supplierName}</span></p>
                <div className="space-y-6">
                    <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 flex justify-between items-center shadow-inner"><span className="text-slate-500 font-black uppercase text-xs tracking-widest">Current Debt</span><span className="text-red-500 font-black text-4xl">৳{paymentData.currentDue.toFixed(2)}</span></div>
                    <div><label className="block text-xs font-black text-slate-500 mb-1 uppercase ml-2 tracking-widest">Payment Amount</label><input type="number" value={paymentData.payAmount} onChange={e=>setPaymentData({...paymentData, payAmount: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-3xl p-5 text-white font-black text-4xl outline-none text-center shadow-2xl" placeholder="0.00" autoFocus/></div>
                </div>
                <div className="grid grid-cols-2 gap-5 mt-10"><button onClick={()=>setShowPaymentModal(false)} className="py-5 bg-slate-700 text-white rounded-3xl font-black hover:bg-slate-600 transition-all uppercase tracking-widest">Cancel</button><button onClick={handleProcessDuePayment} className="py-5 bg-emerald-600 text-white rounded-3xl font-black hover:bg-emerald-500 shadow-2xl transition-all uppercase tracking-widest">Confirm Pay</button></div>
            </div>
        </div>
      )}

      {/* HEADER WITH ADDRESS */}
      <header className="bg-slate-800 shadow-2xl border-b border-slate-700 z-20 relative">
        <div className="max-w-7xl mx-auto py-6 px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col">
                    <h1 className="text-2xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-blue-400 leading-tight tracking-tighter uppercase drop-shadow-lg">Niramoy Clinic & Diagnostic</h1>
                    <div className="flex items-center gap-2 text-slate-400 text-sm md:text-base font-bold mt-1 ml-1">
                        <MapPinIcon className="w-5 h-5 text-sky-500" />
                        <span>এনায়েতপুর মন্ডলপাড়া, এনায়েতপুর, সিরাজগঞ্জ</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/60 px-8 py-4 rounded-full border border-slate-600/50 shadow-inner backdrop-blur-md">
                    <PhoneIcon className="w-6 h-6 text-amber-400" />
                    <span className="text-xl font-black tracking-widest font-mono text-white">01730 923007</span>
                </div>
            </div>
        </div>
      </header>
      
      <div className="container mx-auto px-6 pt-8 pb-4 z-10"><button onClick={onBack} className="flex items-center text-slate-500 hover:text-white transition-all group font-black uppercase text-sm tracking-widest"><div className="p-2 rounded-full group-hover:bg-slate-800 transition-all mr-2"><BackIcon className="w-6 h-6" /></div>Back to Home</button></div>
      
      <div className="flex justify-center items-center z-10 relative mb-8"><div className="flex items-center bg-slate-800 px-16 py-6 rounded-[3rem] border-2 border-rose-500/40 shadow-2xl scale-105"><MedicineIcon className="w-12 h-12 text-rose-500 mr-5 drop-shadow-xl" /><h2 className="text-2xl md:text-4xl font-black text-rose-500 font-bengali uppercase tracking-tighter">মেডিসিন ডিপার্টমেন্ট / Medicine Department</h2></div></div>
      
      <div className="container mx-auto px-6 pb-12 z-10">
        <div className="flex flex-nowrap overflow-x-auto gap-4 mb-10 p-4 bg-slate-800/40 rounded-[2rem] border border-slate-700/50 shadow-3xl backdrop-blur-2xl custom-scrollbar">
          <MenuButton label="Medicine_Buy" isActive={activeTab === 'buy'} onClick={() => { setActiveTab('buy'); setBuyViewMode('list'); }} />
          <MenuButton label="Due Paid" isActive={activeTab === 'due_paid'} onClick={() => setActiveTab('due_paid')} />
          <MenuButton label="Medicine_Sell" isActive={activeTab === 'sell'} onClick={() => { setActiveTab('sell'); setSellViewMode('list'); }} />
          <MenuButton label="Medicine_Store" isActive={activeTab === 'store'} onClick={() => setActiveTab('store')} />
          <MenuButton label="Medicine_Chart" isActive={activeTab === 'chart'} onClick={() => setActiveTab('chart')} />
          <MenuButton label="Medicine_Hishab" isActive={activeTab === 'hishab'} onClick={() => setActiveTab('hishab')} />
        </div>
        
        <div className="bg-slate-800/80 p-10 rounded-[3rem] border border-slate-700 shadow-[0_40px_120px_rgba(0,0,0,0.6)] min-h-[650px] transition-all duration-700 backdrop-blur-sm">
          {activeTab === 'chart' && renderMedicineChartTab()}
          {activeTab === 'buy' && renderBuyTab()}
          {activeTab === 'sell' && renderSellTab()}
          {activeTab === 'store' && renderStoreTab()}
          {activeTab === 'due_paid' && renderDuePaidTab()}
          {activeTab === 'hishab' && renderHishabTab()}
        </div>
      </div>
    </div>
  );
};

const MenuButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button onClick={onClick} className={`px-6 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-500 focus:outline-none flex-1 min-w-[160px] whitespace-nowrap ${isActive ? 'bg-blue-600 text-white shadow-2xl transform scale-105' : 'bg-slate-900/60 text-slate-500 hover:bg-slate-700 hover:text-slate-200'}`}>{label}</button>
);

export default MedicinePage;
