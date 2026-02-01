import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Patient, Doctor, Employee, LabInvoice, LabInvoiceItem, emptyLabInvoice, Referrar, Reagent, Test, testCategories, DiagnosticSubPage } from './DiagnosticData';
import { formatDateTime } from '../utils/dateUtils';
import SearchableSelect from './SearchableSelect';
import PatientInfoPage from './PatientInfoPage';
import DoctorInfoPage from './DoctorInfoPage';
import ReferrerInfoPage from './ReferrerInfoPage';
import TestInfoPage from './TestInfoPage';

interface LabInvoicingPageProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  referrars: Referrar[];
  setReferrars: React.Dispatch<React.SetStateAction<Referrar[]>>;
  tests: Test[];
  reagents: Reagent[];
  setTests: React.Dispatch<React.SetStateAction<Test[]>>; // To update test availability
  employees: Employee[];
  onNavigateSubPage: (page: DiagnosticSubPage) => void;
  invoices: LabInvoice[];
  setInvoices: React.Dispatch<React.SetStateAction<LabInvoice[]>>;
  monthlyRoster: Record<string, string[]>;
}

const LabInvoicingPage: React.FC<LabInvoicingPageProps> = ({
  patients,
  setPatients,
  doctors,
  setDoctors,
  referrars,
  setReferrars,
  tests,
  reagents,
  setTests,
  employees,
  onNavigateSubPage,
  invoices,
  setInvoices,
  monthlyRoster
}) => {
  const [filteredInvoices, setFilteredInvoices] = useState<LabInvoice[]>(invoices);
  const [formData, setFormData] = useState<LabInvoice>(emptyLabInvoice);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedTestCategory, setSelectedTestCategory] = useState('All');
  const [applyPC, setApplyPC] = useState(false); // State for Apply PC checkbox
  const [successMessage, setSuccessMessage] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // New state for confirmation modal
  const [errors, setErrors] = useState<Record<string, boolean>>({}); // State for validation errors

  // Local state for the "Paid Amount (BDT)" input to allow free typing
  const [displayPaidAmount, setDisplayPaidAmount] = useState<string>('');
  const [displayDiscountPercentage, setDisplayDiscountPercentage] = useState<string>('');
  const [displayDiscountAmount, setDisplayDiscountAmount] = useState<string>('');

  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [reportDate, setReportDate] = useState<string>(todayDateString);

  // State for embedded forms
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [showNewDoctorForm, setShowNewDoctorForm] = useState(false);
  const [showNewReferrarForm, setShowNewReferrarForm] = useState(false);
  const [showNewTestForm, setShowNewTestForm] = useState(false);

  // Common styling for inputs, selects, and textareas
  const commonInputClasses = "py-2 px-3 mt-1 block w-full border border-sky-800 rounded-md shadow-sm sm:text-sm bg-sky-900/50 text-sky-200 placeholder-sky-400 transition-colors duration-200 ease-in-out focus:bg-sky-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const commonLabelClasses = "block text-sm font-semibold text-sky-300";
  const totalsInputClasses = "w-28 bg-slate-700 border border-slate-600 rounded p-1 text-right text-white font-bold focus:ring-1 focus:ring-blue-500 outline-none";

  // Derive currentPeriodKey from the invoice date dynamically
  const currentPeriodKey = useMemo(() => {
    return formData.invoice_date.substring(0, 7); // "YYYY-MM" format
  }, [formData.invoice_date]);

  const activeEmployees = useMemo(() => {
    const activeIds = monthlyRoster[currentPeriodKey] || [];
    return employees.filter(emp => activeIds.includes(emp.emp_id) && emp.status === 'Active');
  }, [employees, monthlyRoster, currentPeriodKey]);
  
  useEffect(() => {
    if (successMessage) {
        const timer = setTimeout(() => setSuccessMessage(''), 4000); 
        return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Effect to synchronize `displayPaidAmount` with `formData.paid_amount`
  useEffect(() => {
    setDisplayPaidAmount(formData.paid_amount.toFixed(2));
  }, [formData.paid_amount]);

  useEffect(() => {
    setDisplayDiscountPercentage(formData.discount_percentage.toFixed(2));
  }, [formData.discount_percentage]);

  useEffect(() => {
    setDisplayDiscountAmount(formData.discount_amount.toFixed(2));
  }, [formData.discount_amount]);

  // Calculation Logic
  const totals = useMemo(() => {
    const totalAmount = formData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const netPayable = totalAmount - formData.discount_amount;
    const dueAmount = netPayable - formData.paid_amount;
    const status: LabInvoice['status'] = formData.status === 'Returned' ? 'Returned' : (dueAmount > 0.005 ? 'Due' : 'Paid');

    const tComm100 = applyPC ? formData.items.reduce((sum, item) => sum + (item.test_commission * item.quantity), 0) : 0;
    const commAfterDisc = applyPC ? tComm100 - formData.discount_amount : 0;
    const payableComm = applyPC ? (commAfterDisc + formData.special_commission) - dueAmount : 0;
    const commDue = applyPC ? payableComm - formData.commission_paid : 0;

    return { totalAmount, netPayable, dueAmount, status, tComm100, commAfterDisc, payableComm, commDue };
  }, [formData.items, formData.paid_amount, formData.discount_amount, formData.special_commission, formData.commission_paid, applyPC, formData.status]);
  
  // Filter invoices when search term or invoices state changes
  useEffect(() => {
    const results = invoices.filter(invoice =>
      invoice.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.doctor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.referrar_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(results);
  }, [searchTerm, invoices]);


  const filteredTestsForSelect = useMemo(() => {
    if (selectedTestCategory === 'All') {
      return tests;
    }
    return tests.filter(test => test.category === selectedTestCategory);
  }, [tests, selectedTestCategory]);

  const getTestAvailability = (test: Test, currentReagents: Reagent[]): boolean => {
    if (test.reagents_required.length === 0) {
      return true; // No reagents required, always available
    }
    return test.reagents_required.every(req => {
      const reagent = currentReagents.find(r => r.reagent_id === req.reagent_id);
      if (!reagent || !reagent.availability) {
        return false;
      }
      return reagent.quantity >= req.quantity_per_test;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: number | string = value;
    if (type === 'number') {
        parsedValue = parseFloat(value) || 0;
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const handleApplyPCChange = (isChecked: boolean) => {
    setApplyPC(isChecked);
  };

  const handleFocusSelect = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayPaidAmount(e.target.value);
  };

  const handlePaidAmountInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handlePaidAmountInputBlur = () => {
    let valueToParse = displayPaidAmount.trim();
    if (valueToParse === '') valueToParse = '0';
    const parsedValue = parseFloat(valueToParse);
    
    if (!isNaN(parsedValue)) {
        const formattedValue = parsedValue.toFixed(2);
        setDisplayPaidAmount(formattedValue);
        setFormData(prev => ({ ...prev, paid_amount: parseFloat(formattedValue) }));
    } else {
        setDisplayPaidAmount('0.00');
        setFormData(prev => ({ ...prev, paid_amount: 0.00 }));
    }
  };

  const handleDiscountPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayDiscountPercentage(e.target.value);
  };

  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayDiscountAmount(e.target.value);
  };

  const handleDiscountPercentageBlur = () => {
    let value = displayDiscountPercentage.trim();
    if (value === '') value = '0';
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      const calculatedAmount = parseFloat((totals.totalAmount * (parsedValue / 100)).toFixed(2));
      setFormData(prev => ({ ...prev, discount_percentage: parsedValue, discount_amount: calculatedAmount }));
      setDisplayDiscountPercentage(parsedValue.toFixed(2));
      setDisplayDiscountAmount(calculatedAmount.toFixed(2));
    } else {
      setDisplayDiscountPercentage(formData.discount_percentage.toFixed(2));
    }
  };

  const handleDiscountAmountBlur = () => {
    let value = displayDiscountAmount.trim();
    if (value === '') value = '0';
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      const calculatedPercentage = totals.totalAmount > 0 ? parseFloat(((parsedValue / totals.totalAmount) * 100).toFixed(2)) : 0;
      setFormData(prev => ({ ...prev, discount_amount: parsedValue, discount_percentage: calculatedPercentage }));
      setDisplayDiscountAmount(parsedValue.toFixed(2));
      setDisplayDiscountPercentage(calculatedPercentage.toFixed(2));
    } else {
      setDisplayDiscountAmount(formData.discount_amount.toFixed(2));
    }
  };

  const resetForm = () => {
    setFormData({ ...emptyLabInvoice, invoice_date: formatDateTime(new Date()).split(' ')[0], paid_amount: 0.00 });
    setDisplayPaidAmount('0.00');
    setSelectedInvoiceId(null);
    setIsEditing(false);
    setShowNewPatientForm(false);
    setShowNewDoctorForm(false);
    setShowNewReferrarForm(false);
    setShowNewTestForm(false);
    setApplyPC(false);
    setBarcodeInput('');
    setErrors({});
  };

  const handleGetNewId = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const invoicesTodayCount = invoices.filter(inv => inv.invoice_id.startsWith(`INV-${year}-${month}-${day}`)).length;
    const newSerial = String(invoicesTodayCount + 1).padStart(3, '0');
    const newId = `INV-${year}-${month}-${day}-${newSerial}`;
    resetForm();
    setFormData(prev => ({
      ...prev,
      invoice_id: newId,
      invoice_date: `${year}-${month}-${day}`,
      date_created: formatDateTime(today),
      last_modified: formatDateTime(today),
    }));
  };

  const handlePatientSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, patient_id: id, patient_name: name }));
    if (errors.patient_id) setErrors(prev => ({ ...prev, patient_id: false }));
    setShowNewPatientForm(false);
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = barcodeInput.trim();
      if (!code) return;

      // 1. Search by Patient ID
      let targetPatient = patients.find(p => p.pt_id === code);
      
      // 2. If not found, search by Invoice ID
      if (!targetPatient) {
        const matchingInvoice = invoices.find(inv => inv.invoice_id === code);
        if (matchingInvoice) {
          targetPatient = patients.find(p => p.pt_id === matchingInvoice.patient_id);
        }
      }

      if (targetPatient) {
        handlePatientSelect(targetPatient.pt_id, targetPatient.pt_name);
        setSuccessMessage(`পেশেন্ট "${targetPatient.pt_name}" সফলভাবে বারকোড দ্বারা সিলেক্ট করা হয়েছে।`);
        setBarcodeInput('');
      } else {
        alert("এই বারকোড দিয়ে কোনো রোগী বা ইনভয়েস পাওয়া যায়নি।");
      }
    }
  };

  const handleDoctorSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, doctor_id: id, doctor_name: name }));
    setShowNewDoctorForm(false);
  };

  const handleReferrarSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, referrar_id: id, referrar_name: name }));
    setShowNewReferrarForm(false);
  };

  const handleEmployeeSelect = (field: 'bill_created_by' | 'bill_paid_by', id: string, name: string) => {
    setFormData(prev => ({ ...prev, [field]: name }));
    if (field === 'bill_created_by' && errors.bill_created_by) {
      setErrors(prev => ({ ...prev, bill_created_by: false }));
    }
  };

  const handleTestSelect = (testId: string, testName: string) => {
    const selectedTest = tests.find(t => t.test_id === testId);
    if (selectedTest) {
      if (!getTestAvailability(selectedTest, reagents)) {
        alert(`Test "${selectedTest.test_name}" is currently unavailable due to insufficient reagent stock.`);
        return;
      }
      const existingItem = formData.items.find(item => item.test_id === testId);
      if (existingItem) {
        alert('This test is already added to the invoice.');
        return;
      }
      const newItem: LabInvoiceItem = {
        test_id: selectedTest.test_id,
        test_name: selectedTest.test_name,
        price: selectedTest.price,
        quantity: 1,
        test_commission: selectedTest.test_commission,
        usg_exam_charge: selectedTest.usg_exam_charge,
        subtotal: selectedTest.price * 1,
      };
      setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
      if (errors.items) setErrors(prev => ({...prev, items: false}));
    }
  };

  const handleRemoveItem = (testId: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.test_id !== testId) }));
  };
  
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: Record<string, boolean> = {};
    if (!formData.invoice_id) validationErrors.invoice_id = true;
    if (!formData.patient_id) validationErrors.patient_id = true;
    if (formData.items.length === 0) validationErrors.items = true;
    if (!formData.bill_created_by) validationErrors.bill_created_by = true;

    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        alert('Please fill all required fields highlighted in red.');
        return;
    }
    if (totals.dueAmount < -0.001) {
        alert('Paid amount cannot be greater than Net Payable.');
        return;
    }
    setIsConfirmModalOpen(true);
  };
  
  const executeSave = () => {
    const currentDateTime = formatDateTime(new Date());
    const invoiceToSave = { 
      ...formData, 
      last_modified: currentDateTime,
      total_amount: totals.totalAmount,
      net_payable: totals.netPayable,
      due_amount: totals.dueAmount,
      status: totals.status
    };

    if (isEditing) {
      setInvoices(invoices.map(inv => inv.invoice_id === invoiceToSave.invoice_id ? invoiceToSave : inv));
    } else {
      if (invoices.some(inv => inv.invoice_id === invoiceToSave.invoice_id)) {
        alert('Invoice ID already exists. Please get a new ID.');
        return;
      }
      setInvoices([invoiceToSave, ...invoices]);
    }
    setSuccessMessage('ইনভয়েস ডাটা সফলভাবে সেভ করা হয়েছে!');
    resetForm();
  };


  const handleEditInvoice = () => {
    if (!selectedInvoiceId) return alert("Please select an invoice.");
    const invoiceToEdit = invoices.find(inv => inv.invoice_id === selectedInvoiceId);
    if (invoiceToEdit) {
      setFormData(invoiceToEdit);
      setIsEditing(true);
      setErrors({});
    }
  };

  const handleCancelInvoice = () => {
    if (!selectedInvoiceId) return alert("Please select an invoice.");
    const invoiceToCancel = invoices.find(inv => inv.invoice_id === selectedInvoiceId);
    if (invoiceToCancel && invoiceToCancel.status !== 'Cancelled') {
      if (window.confirm(`Are you sure you want to cancel invoice ${invoiceToCancel.invoice_id}?`)) {
        setInvoices(prevInvoices => prevInvoices.map(inv => inv.invoice_id === selectedInvoiceId ? { ...inv, status: 'Cancelled' } : inv));
        resetForm();
        setSuccessMessage('Invoice cancelled successfully.');
      }
    }
  };

  const handleRowClick = (invoice: LabInvoice) => {
    setFormData(invoice);
    setSelectedInvoiceId(invoice.invoice_id);
    setIsEditing(false);
    setErrors({});
  };

  const handleReturnInvoice = () => {
    if (!selectedInvoiceId) return alert("Please select an invoice.");
    const invoiceToReturn = invoices.find(inv => inv.invoice_id === selectedInvoiceId);
    if (invoiceToReturn && invoiceToReturn.status !== 'Returned') {
      if (window.confirm(`আপনি কি এই ইনভয়েসের (${invoiceToReturn.invoice_id}) টাকা রিফান্ড বা রিটার্ন করতে চান? এটি আজকের হিসাব থেকে মাইনাস হবে।`)) {
        setInvoices(prevInvoices => prevInvoices.map(inv => inv.invoice_id === selectedInvoiceId ? { ...inv, status: 'Returned', return_date: todayDateString } : inv));
        resetForm();
        setSuccessMessage('Invoice marked as Returned/Refunded.');
      }
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedInvoiceId) return;
    const inv = invoices.find(i => i.invoice_id === selectedInvoiceId);
    if (!inv) return;
    const patient = patients.find(p => p.pt_id === inv.patient_id);
    const doctor = doctors.find(d => d.doctor_id === inv.doctor_id);

    const itemsHtml = inv.items.map((item, idx) => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: left;">${idx + 1}. ${item.test_name}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right;">${item.price.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const getSlipHtml = (copyType: string, isLast: boolean) => `
        <div class="slip-column" style="width: 148.5mm; height: 210mm; padding: 12mm 15mm; box-sizing: border-box; display: flex; flex-direction: column; ${!isLast ? 'border-right: 1.5px dashed #666;' : ''} overflow: hidden; position: relative;">
            <div class="header" style="text-align: center; margin-bottom: 8px;">
                <h1 style="margin:0; font-size: 22px; font-weight: 900; color: #000; text-transform: uppercase; line-height: 1.1;">Niramoy Clinic & Diagnostic</h1>
                <p style="margin:2px 0; font-size: 11px; font-weight: bold;">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                <p style="margin:0; font-size: 9px; font-weight: bold; color: #555;">Govt. License: HSM41671</p>
                <div class="copy-label" style="display: inline-block; border: 1.5px solid #000; padding: 2px 10px; margin-top: 5px; font-size: 10px; font-weight: 900; text-transform: uppercase;">${copyType}</div>
            </div>

            <table style="width:100%; border-collapse: collapse; margin-bottom: 5px; margin-top: 8px; font-size: 11px; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 4px; width: 40%;"><b>Invoice ID:</b> ${inv.invoice_id}</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 35%;"><b>Date:</b> ${inv.invoice_date}</td>
                    <td rowspan="2" style="border: 1px solid #000; padding: 4px; width: 25%; text-align: center; vertical-align: middle; background: #fff;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <img 
                                src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(inv.patient_id)}&scale=1&height=8&incltext=false" 
                                alt="BC" 
                                style="height: 35px; width: auto; max-width: 100%;"
                            />
                            <div style="font-size: 8px; font-family: monospace; margin-top: 2px; font-weight: bold;">${inv.patient_id}</div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 4px;"><b>Patient Name:</b> ${patient?.pt_name || 'N/A'}</td>
                    <td style="border: 1px solid #000; padding: 4px;"><b>Age/Sex:</b> ${patient?.ageY}Y / ${patient?.gender}</td>
                </tr>
                <tr>
                    <td colspan="3" style="border: 1px solid #000; padding: 4px;"><b>Consultant:</b> ${doctor?.doctor_name || 'Self/Walk-in'} ${doctor?.degree ? `(${doctor.degree})` : ''}</td>
                </tr>
                <tr>
                    <td colspan="3" style="border: 1px solid #000; padding: 4px;"><b>Address:</b> ${patient?.address || 'N/A'} | <b>Mob:</b> ${patient?.mobile || 'N/A'}</td>
                </tr>
            </table>

            <div style="height: 15px;"></div>
            
            <div style="text-align: center; font-weight: 900; font-size: 14px; text-decoration: underline; margin-bottom: 5px; font-family: 'Arial', sans-serif;">Test Invoice</div>

            <div class="table-container" style="display: block; overflow: hidden;">
                <table style="width:100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background:#f3f3f3;">
                            <th style="border: 1px solid #000; padding: 4px; text-align: left;">Test Name</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: right;">Price</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Qty</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>

                <div class="footer-summary" style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <div class="totals" style="width: 160px; font-size: 11px;">
                        <div style="display: flex; justify-content: space-between; line-height: 1.1;"><span>Total:</span> <span>${inv.total_amount.toFixed(2)}</span></div>
                        <div style="display: flex; justify-content: space-between; line-height: 1.1;"><span>Discount:</span> <span>${inv.discount_amount.toFixed(2)}</span></div>
                        <div style="display: flex; justify-content: space-between; line-height: 1.2; font-weight: 900; border-top: 1.2px solid #000; padding-top: 2px; margin-top: 2px;"><span>Net Payable:</span> <span>${inv.net_payable.toFixed(2)}</span></div>
                        <div style="display: flex; justify-content: space-between; line-height: 1.1;"><span>Paid:</span> <span>${inv.paid_amount.toFixed(2)}</span></div>
                        <div style="display: flex; justify-content: space-between; line-height: 1.1;"><span>Due:</span> <span style="font-weight:900; color: #d00;">${inv.due_amount.toFixed(2)}</span></div>
                        ${inv.status === 'Returned' ? '<div style="color: #d00; text-align: center; border: 1.5px solid #d00; margin-top: 5px; font-weight: 900; padding: 2px;">RETURNED / REFUNDED</div>' : ''}
                    </div>
                </div>

                <div style="margin-top: 10px; font-size: 11px; border-top: 1px solid #eee; padding-top: 5px;">
                    <b>Expected Report Delivery:</b> ${inv.expected_delivery_time || 'As per schedule'}
                </div>
            </div>

            <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px;">
                <div class="signature" style="width: 100px; border-top: 1.2px solid #000; text-align: center; font-size: 10px; font-weight: bold; padding-top: 3px;">Authorized Sign</div>
                <div style="text-align:center; font-size: 8px; color: #666;">System Printed at ${formatDateTime(new Date())}</div>
            </div>
        </div>
    `;

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { size: A4 landscape; margin: 0; }
                * { box-sizing: border-box; }
                html, body { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    width: 297mm; 
                    height: 210mm;
                    overflow: hidden !important; 
                    background: white; 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .page-container { 
                    width: 297mm; 
                    height: 210mm; 
                    display: flex; 
                    flex-direction: row; 
                    margin: 0; 
                    padding: 0;
                }
            </style>
        </head>
        <body>
            <div class="page-container">${getSlipHtml('Patient Copy', false)}${getSlipHtml('Office Copy', true)}</div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
      }, 750);
    }
  };

  const dailyReport = useMemo(() => {
    const collections = invoices.filter(inv => inv.invoice_date === reportDate && inv.status !== 'Cancelled');
    const refunds = invoices.filter(inv => inv.return_date === reportDate && inv.status === 'Returned');
    
    const summary = collections.reduce((acc, inv) => {
      acc.totalBill += inv.total_amount;
      acc.totalDiscount += inv.discount_amount;
      acc.netPayable += inv.net_payable;
      acc.paidAmount += inv.paid_amount;
      acc.dueAmount += inv.due_amount;
      return acc;
    }, { totalBill: 0, totalDiscount: 0, netPayable: 0, paidAmount: 0, dueAmount: 0 });

    const totalRefunded = refunds.reduce((sum, inv) => sum + inv.paid_amount, 0);
    summary.paidAmount -= totalRefunded; // Deduct refunds from today's cash

    return summary;
  }, [invoices, reportDate]);

  const monthlyReport = useMemo(() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const collections = invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear && inv.status !== 'Cancelled';
    });

    const refunds = invoices.filter(inv => {
        if (!inv.return_date) return false;
        const retDate = new Date(inv.return_date);
        return retDate.getMonth() === currentMonth && retDate.getFullYear() === currentYear && inv.status === 'Returned';
    });

    const summary = collections.reduce((acc, inv) => {
      acc.totalBill += inv.total_amount;
      acc.totalDiscount += inv.discount_amount;
      acc.netPayable += inv.net_payable;
      acc.paidAmount += inv.paid_amount;
      acc.dueAmount += inv.due_amount;
      return acc;
    }, { totalBill: 0, totalDiscount: 0, netPayable: 0, paidAmount: 0, dueAmount: 0 });

    const totalRefunded = refunds.reduce((sum, inv) => sum + inv.paid_amount, 0);
    summary.paidAmount -= totalRefunded;

    return summary;
  }, [invoices, today]);

  return (
    <div className="bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 text-slate-300">
        {/* IMPROVED SUCCESS MESSAGE UI */}
        {successMessage && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                <div className="bg-emerald-600 border-2 border-white text-white px-10 py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 text-2xl font-black shadow-lg">✓</div>
                    <span className="text-xl font-black uppercase tracking-widest">{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="pointer-events-auto mt-2 text-emerald-200 text-xs underline font-bold">dismiss</button>
                </div>
            </div>
        )}

        {isConfirmModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
                    <h3 className="text-lg font-semibold text-slate-100">Confirm Save</h3>
                    <p className="mt-2 text-slate-400">Apni ki sottoy ei invoice data save korte chassen?</p>
                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 rounded-md">No</button>
                        <button onClick={() => { executeSave(); setIsConfirmModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md">Yes</button>
                    </div>
                </div>
            </div>
        )}
        
        <div className="border-b border-slate-700 pb-4 mb-4">
            <div className="max-w-5xl flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                    <label htmlFor="invoice_id" className="font-semibold text-slate-300 whitespace-nowrap text-xs">Invoice Id:</label>
                    <input type="text" id="invoice_id" name="invoice_id" disabled value={formData.invoice_id} className={`w-36 border rounded-md shadow-sm text-xs px-2 py-1 bg-slate-700 text-slate-400 ${errors.invoice_id ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-600'}`} />
                </div>
                <button type="button" onClick={handleGetNewId} className="px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 uppercase tracking-tighter shadow-md">Get New Invoice</button>
                <button type="submit" form="invoice-form" className="px-3 py-1.5 text-[10px] font-bold text-white bg-green-600 rounded-md hover:bg-green-500 uppercase tracking-tighter shadow-md">Save Invoice</button>
                <button type="button" onClick={resetForm} className="px-3 py-1.5 text-[10px] font-bold text-slate-200 bg-slate-600 rounded-md hover:bg-slate-500 uppercase tracking-tighter shadow-md">Cancel</button>
                <button type="button" onClick={handleEditInvoice} disabled={!selectedInvoiceId} className="px-3 py-1.5 text-[10px] font-bold text-white bg-yellow-500 rounded-md hover:bg-yellow-400 uppercase tracking-tighter shadow-md disabled:opacity-50">Edit</button>
                <button type="button" onClick={handleCancelInvoice} disabled={!selectedInvoiceId || invoices.find(inv => inv.invoice_id === selectedInvoiceId)?.status === 'Cancelled'} className="px-3 py-1.5 text-[10px] font-bold text-white bg-red-600 rounded-md hover:bg-red-700 uppercase tracking-tighter shadow-md disabled:opacity-50">Cancel</button>
                <button type="button" onClick={handleReturnInvoice} disabled={!selectedInvoiceId || invoices.find(inv => inv.invoice_id === selectedInvoiceId)?.status === 'Returned'} className="px-3 py-1.5 text-[10px] font-bold text-white bg-rose-600 rounded-md hover:bg-rose-700 uppercase tracking-tighter shadow-md disabled:opacity-50">Return / Refund</button>
                <button type="button" onClick={handlePrintInvoice} disabled={!selectedInvoiceId} className="px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 uppercase tracking-tighter shadow-md disabled:opacity-50">Print</button>
            </div>
        </div>


      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
            <label htmlFor="search_invoice" className="font-semibold text-slate-300 whitespace-nowrap">Search Invoice:</label>
            <input
            type="text"
            id="search_invoice"
            name="search_invoice"
            placeholder="Search by ID, Patient or Doctor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-700 text-slate-200 py-2 px-3" />
        </div>

        <div className="flex items-center gap-2 bg-slate-700/50 p-1.5 rounded-lg border border-sky-500/30">
            <div className="bg-sky-600 p-1.5 rounded-md text-white shadow-lg animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>
            </div>
            <label htmlFor="barcode_scanner_inv" className="font-black text-xs text-sky-400 uppercase tracking-tighter whitespace-nowrap">Scanner Mode:</label>
            <input
                type="text"
                id="barcode_scanner_inv"
                placeholder="Scan Patient or Previous Invoice ID..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeScan}
                className="flex-1 py-1.5 px-3 border-2 border-sky-500/50 bg-slate-900 text-white rounded-md shadow-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 sm:text-sm font-mono"
                autoComplete="off"
            />
        </div>
      </div>

      {showNewPatientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-slate-600 bg-slate-900 relative">
                <button onClick={() => setShowNewPatientForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">&times;</button>
                <div className="p-2"><PatientInfoPage patients={patients} setPatients={setPatients} isEmbedded onClose={() => setShowNewPatientForm(false)} onSaveAndSelect={handlePatientSelect} /></div>
            </div>
        </div>
      )}

      {showNewDoctorForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-slate-600 bg-slate-900 relative">
                <button onClick={() => setShowNewDoctorForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">&times;</button>
                <div className="p-2"><DoctorInfoPage doctors={doctors} setDoctors={setDoctors} isEmbedded onClose={() => setShowNewDoctorForm(false)} onSaveAndSelect={handleDoctorSelect} /></div>
            </div>
        </div>
      )}

      {showNewReferrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-slate-600 bg-slate-900 relative">
                <button onClick={() => setShowNewReferrarForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">&times;</button>
                <div className="p-2"><ReferrerInfoPage referrars={referrars} setReferrars={setReferrars} isEmbedded onClose={() => setShowNewReferrarForm(false)} onSaveAndSelect={handleReferrarSelect} /></div>
            </div>
        </div>
      )}

      {showNewTestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-slate-600 bg-slate-900 relative">
                <button onClick={() => setShowNewTestForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">&times;</button>
                <div className="p-4"><TestInfoPage reagents={reagents} tests={tests} setTests={setTests} /></div>
            </div>
        </div>
      )}

    <div className="bg-sky-950 text-sky-200 p-6 rounded-xl mb-8 border border-sky-800">
      <h2 className="text-2xl font-bold text-sky-100 mb-6 border-b border-sky-800 pb-2">Lab Invoice</h2>
      <form id="invoice-form" onSubmit={handleSaveInvoice}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-5">
          <div>
            <label htmlFor="invoice_date" className={commonLabelClasses}>Invoice Date</label>
            <input type="date" id="invoice_date" name="invoice_date" value={formData.invoice_date} onChange={handleInputChange} required className={`${commonInputClasses} h-10`} />
          </div>
          <div className={`rounded-md ${errors.patient_id ? 'ring-2 ring-red-500' : ''}`}>
             <SearchableSelect
                theme="dark"
                label="Patient"
                options={patients.map(p => ({ id: p.pt_id, name: p.pt_name, details: `${p.gender}, ${p.ageY}Y, C/O: ${p.co_pref} ${p.co_name}, Add: ${p.address}, Mob: ${p.mobile}` }))}
                value={formData.patient_id}
                onChange={handlePatientSelect}
                onAddNew={() => setShowNewPatientForm(true)}
                placeholder="Search or add new patient"
                required
                inputHeightClass="h-10"
                />
          </div>
          <div>
            <SearchableSelect
              theme="dark"
              label="Consulting Doctor"
              options={doctors.map(d => ({ id: d.doctor_id, name: d.doctor_name, details: d.degree }))}
              value={formData.doctor_id || ''}
              onChange={handleDoctorSelect}
              onAddNew={() => setShowNewDoctorForm(true)}
              placeholder="Search or add new doctor"
              inputHeightClass="h-10"
            />
          </div>
          <div>
            <SearchableSelect
              theme="dark"
              label="Referrar (Optional)"
              options={referrars.map(r => ({ id: r.ref_id, name: r.ref_name, details: r.ref_degrees }))}
              value={formData.referrar_id || ''}
              onChange={handleReferrarSelect}
              onAddNew={() => setShowNewReferrarForm(true)}
              placeholder="Search or add new referrar"
              inputHeightClass="h-10"
            />
          </div>
          <div>
            <label htmlFor="expected_delivery_time" className={commonLabelClasses}>Expected Delivery</label>
            <input type="text" id="expected_delivery_time" name="expected_delivery_time" value={formData.expected_delivery_time} onChange={handleInputChange} className={`${commonInputClasses} h-10`} placeholder="e.g. Tomorrow 5 PM" />
          </div>
        </div>

        <div className="mt-5 border-t border-sky-800 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2">
                <h3 className="text-base font-semibold text-sky-200">Add Test Items</h3>
                <div className="flex flex-wrap gap-2">
                    {['All', ...testCategories].map(category => (
                        <button key={category} type="button" onClick={() => setSelectedTestCategory(category)} className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${selectedTestCategory === category ? 'bg-blue-600 text-white shadow' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{category}</button>
                    ))}
                </div>
            </div>
             <div className="bg-slate-100 p-2 rounded-xl border border-gray-300 shadow-inner">
                <SearchableSelect
                  theme="light" label=""
                  options={filteredTestsForSelect.map(t => ({ id: t.test_id, name: t.test_name, details: `${t.category} - BDT ${t.price.toFixed(2)} ${!getTestAvailability(t, reagents) ? '(Unavailable)' : ''}` }))}
                  value="" 
                  onChange={handleTestSelect}
                  onAddNew={() => setShowNewTestForm(true)}
                  placeholder="Search and add tests to invoice"
                  inputHeightClass="h-10"
                />
            </div>
        </div>

        <div className={`bg-slate-900/40 p-4 rounded-xl mt-6 border ${errors.items ? 'border-red-500 ring-2 ring-red-500' : 'border-sky-900/50'}`}>
          <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-sky-200">Invoice Items</h3>
              <div className="flex items-center">
                <input type="checkbox" id="apply_pc" name="apply_pc" checked={applyPC} onChange={(e) => handleApplyPCChange(e.target.checked)} className="h-4 w-4 text-blue-600 border-slate-500 rounded focus:ring-blue-500 bg-slate-700" />
                <label htmlFor="apply_pc" className="ml-2 text-sm font-medium text-sky-300">Apply PC</label>
              </div>
          </div>
          {formData.items.length === 0 ? (
            <div className="text-center py-8 bg-slate-800 rounded-lg border border-slate-700"><p className="text-slate-500">No tests added yet.</p></div>
          ) : (
            <div className="overflow-x-auto border border-slate-700 rounded-lg bg-sky-950">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">SL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Test Name</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase">Service price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase">Commission (BDT)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase">Subtotal (BDT)</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900 divide-y divide-slate-700">
                  {formData.items.map((item, idx) => (
                    <tr key={item.test_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200 font-medium">{item.test_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">{item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">{applyPC ? item.test_commission.toFixed(2) : '0.00'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200 font-medium text-right">{item.subtotal.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"><button type="button" onClick={() => handleRemoveItem(item.test_id)} className="text-red-400 hover:text-red-300 transition-colors">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-6 border-t border-sky-800 pt-6">
          <div className="space-y-4">
             <div><label htmlFor="notes" className={commonLabelClasses}>Notes (Optional)</label><textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} className={commonInputClasses}></textarea></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div className={`rounded-md ${errors.bill_created_by ? 'ring-2 ring-red-500' : ''}`}><SearchableSelect theme="dark" label="Bill_Create_By" options={activeEmployees.map(emp => ({ id: emp.emp_name, name: emp.emp_name, details: emp.job_position }))} value={formData.bill_created_by || ''} onChange={(id, name) => handleEmployeeSelect('bill_created_by', id, name)} onAddNew={() => onNavigateSubPage('employee_info' as DiagnosticSubPage)} placeholder="Select Employee" inputHeightClass="h-10" /></div>
                <div><SearchableSelect theme="dark" label="Bill_Paid_By" options={activeEmployees.map(emp => ({ id: emp.emp_name, name: emp.emp_name, details: emp.job_position }))} value={formData.bill_paid_by || ''} onChange={(id, name) => handleEmployeeSelect('bill_paid_by', id, name)} onAddNew={() => onNavigateSubPage('employee_info' as DiagnosticSubPage)} placeholder="Select Employee" inputHeightClass="h-10" /></div>
             </div>
             <div><label htmlFor="payment_method" className={commonLabelClasses}>Payment Method</label><select id="payment_method" name="payment_method" value={formData.payment_method} onChange={handleInputChange} className={commonInputClasses}><option value="Cash">Cash</option><option value="Card">Card</option><option value="Mobile Banking">Mobile Banking</option></select></div>
          </div>
          <div className="space-y-2 bg-slate-800 p-4 rounded-lg border border-slate-700 text-slate-300">
            <div className="flex justify-between items-center text-md font-medium"><span>Total Amount:</span><span>{totals.totalAmount.toFixed(2)} BDT</span></div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex items-center gap-2"><label htmlFor="discount_percentage" className="text-sm font-medium">Discount (%):</label><input type="text" id="discount_percentage" name="discount_percentage" value={displayDiscountPercentage} onChange={handleDiscountPercentageChange} onBlur={handleDiscountPercentageBlur} onFocus={handleFocusSelect} className={totalsInputClasses} /></div>
                <div className="flex items-center gap-2 justify-end flex-grow"><label htmlFor="discount_amount" className="text-sm font-medium">Discount Amount:</label><input type="text" id="discount_amount" name="discount_amount" value={displayDiscountAmount} onChange={handleDiscountAmountChange} onBlur={handleDiscountAmountBlur} onFocus={handleFocusSelect} className={totalsInputClasses} /></div>
            </div>
            <div className="flex justify-between items-center text-xl font-bold text-slate-100 mt-2 pt-2 border-t border-slate-600"><span>Net Payable:</span><span className="text-blue-400">{totals.netPayable.toFixed(2)} BDT</span></div>
             <div className="flex justify-between items-center mt-4"><label htmlFor="paid_amount" className="text-sm font-medium">Paid Amount (BDT):</label><input type="text" id="paid_amount" name="paid_amount" value={displayPaidAmount} onChange={handlePaidAmountChange} onFocus={handlePaidAmountInputFocus} onBlur={handlePaidAmountInputBlur} className={totalsInputClasses} /></div>
            <div className="flex justify-between items-center text-lg font-semibold mt-1"><span>Due Amount:</span><span className={`${totals.dueAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>{totals.dueAmount.toFixed(2)} BDT</span></div>
            {applyPC && (
                <div className="mt-4 pt-4 border-t border-slate-600 space-y-2">
                    <div className="flex justify-between items-center text-sm"><span>Commission (If 100% paid):</span><input type="text" readOnly value={totals.tComm100.toFixed(2)} className={`${totalsInputClasses} !bg-slate-800 border-0`} /></div>
                    <div className="flex justify-between items-center text-sm"><span>Commission (After Discount):</span><input type="text" readOnly value={totals.commAfterDisc.toFixed(2)} className={`${totalsInputClasses} !bg-slate-800 border-0`} /></div>
                    <div className="flex justify-between items-center text-sm"><label htmlFor="special_commission" className="font-medium">special commission:</label><input type="number" id="special_commission" name="special_commission" value={formData.special_commission} onChange={handleInputChange} onFocus={handleFocusSelect} className={totalsInputClasses} placeholder="Enter amount" /></div>
                    <div className="flex justify-between items-center text-sm"><span>Payable Commission:</span><input type="text" id="payable_commission" readOnly value={totals.payableComm.toFixed(2)} className={`${totalsInputClasses} !bg-slate-800 border-0 transition-colors duration-500 ${totals.payableComm < 0 ? 'text-red-400 font-bold' : ''}`} /></div>
                    <div className="flex justify-between items-center text-sm"><label htmlFor="commission_paid" className="font-medium">Commission Paid:</label><input type="number" id="commission_paid" name="commission_paid" value={formData.commission_paid} onChange={handleInputChange} onFocus={handleFocusSelect} className={totalsInputClasses} placeholder="Enter amount" /></div>
                    <div className="flex justify-between items-center text-sm"><span>Commission Due:</span><input type="text" readOnly value={totals.commDue.toFixed(2)} className={`${totalsInputClasses} !bg-slate-800 border-0 font-bold transition-colors duration-500 ${totals.commDue < 0 ? 'text-red-400' : 'text-green-400'}`} /></div>
                </div>
            )}
          </div>
        </div>
      </form>
    </div>


      <div className="mt-8 pt-6 border-t border-slate-700">
        <h3 className="text-xl font-bold text-slate-100 mb-4 text-center">Daily & Monthly Hishab</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white text-gray-800 rounded-lg p-5 shadow-md border border-gray-200">
            <div className="flex justify-center items-center mb-3"><input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="py-1 px-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-50 text-gray-900" /></div>
            <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Total Bill:</span> <span className="font-bold">{dailyReport.totalBill.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Total Discount:</span> <span className="font-bold">{dailyReport.totalDiscount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Net Payable:</span> <span className="font-bold">{dailyReport.netPayable.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-green-600">Paid Amount:</span> <span className="font-bold text-green-600">{dailyReport.paidAmount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-red-600">Due Amount:</span> <span className="font-bold text-red-600">{dailyReport.dueAmount.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="bg-white text-gray-800 rounded-lg p-5 shadow-md border border-gray-200">
            <p className="text-base font-semibold text-gray-700 mb-3 text-center">For {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Total Bill:</span> <span className="font-bold">{monthlyReport.totalBill.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Total Discount:</span> <span className="font-bold">{monthlyReport.totalDiscount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Net Payable:</span> <span className="font-bold">{monthlyReport.netPayable.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-green-600">Paid Amount:</span> <span className="font-bold text-green-600">{monthlyReport.paidAmount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-red-600">Due Amount:</span> <span className="font-bold text-red-600">{monthlyReport.dueAmount.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mt-8 pt-6 border-t border-slate-700">
        <h3 className="text-xl font-bold text-slate-100 mb-4">All Invoices</h3>
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Invoice ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Patient Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Doctor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Referrar</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Total (BDT)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Paid (BDT)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Due (BDT)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Last Modified</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.invoice_id} onClick={() => handleRowClick(invoice)} className={`cursor-pointer hover:bg-slate-700/50 ${selectedInvoiceId === invoice.invoice_id ? 'bg-blue-900/40' : ''}`} aria-selected={selectedInvoiceId === invoice.invoice_id} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleRowClick(invoice)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.invoice_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.invoice_date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.patient_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.doctor_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.referrar_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">{invoice.total_amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">{invoice.paid_amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-right">{invoice.due_amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'Paid' ? 'bg-green-900/50 text-green-300' : invoice.status === 'Due' ? 'bg-orange-900/50 text-orange-300' : invoice.status === 'Returned' ? 'bg-blue-900/50 text-blue-300' : 'bg-red-900/50 text-red-300'}`}>{invoice.status}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.last_modified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabInvoicingPage;