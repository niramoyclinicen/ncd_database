
import React, { useState, useEffect, useRef } from 'react';
import { Patient, Doctor, Referrar, LabInvoice } from './DiagnosticData'; 
import { formatDateTime } from '../utils/dateUtils'; 
import SearchableSelect from './SearchableSelect';
import PatientInfoPage from './PatientInfoPage';
import DoctorInfoPage from './DoctorInfoPage';
import ReferrerInfoPage from './ReferrerInfoPage';

// Define the Appointment interface
interface Appointment {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  referrar_id?: string;
  referrar_name?: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  doctor_fee: number; // New field for doctor fee
  status: 'Scheduled' | 'Completed' | 'Cancelled' | '';
  notes: string;
}

const emptyAppointment: Appointment = {
  appointment_id: '',
  patient_id: '',
  patient_name: '',
  doctor_id: '',
  doctor_name: '',
  referrar_id: '',
  referrar_name: '',
  appointment_date: '',
  appointment_time: '',
  reason: '',
  doctor_fee: 0, // Default to 0
  status: 'Scheduled', // Default status to 'Scheduled' to pass validation for new appointments.
  notes: '',
};

// Comprehensive list of Appointment Reasons
const appointmentReasons = [
  "General Checkup / সাধারণ চেকআপ",
  "Fever / জ্বর",
  "Cold & Cough / সর্দি ও কাশি",
  "Headache / মাথাব্যথা",
  "Abdominal Pain / পেটে ব্যথা",
  "Chest Pain / বুকে ব্যথা",
  "Breathing Trouble / শ্বাসকষ্ট",
  "Vomiting / বমি",
  "Loose Motion / পাতলা পায়খানা",
  "Weakness / দুর্বলতা",
  "Dizziness / মাথা ঘোরা",
  "Body Ache / শরীরে ব্যথা",
  "Joint Pain / গিরায় ব্যথা",
  "Back Pain / কোমরে ব্যথা",
  "Skin Rash / এলার্জি বা চর্মরোগ",
  "Injury/Cut / আঘাত বা কেটে যাওয়া",
  "Burn / পুড়ে যাওয়া",
  "High Blood Pressure / উচ্চ রক্তচাপ",
  "Diabetes Checkup / ডায়াবেটিস চেকআপ",
  "Pregnancy Checkup / গর্ভকালীন সেবা",
  "Gynecology Problem / গাইনি সমস্যা",
  "Eye Problem / চোখের সমস্যা",
  "Ear Pain / কানে ব্যথা",
  "Throat Pain / গলায় ব্যথা",
  "Toothache / দাঁতে ব্যথা",
  "Urinary Problem / প্রস্রাবে সমস্যা",
  "Follow-up / ফলো-আপ",
  "Report Show / রিপোর্ট দেখানো",
  "Vaccination / টিকা",
  "Dressing / ড্রেসিং"
];

const initialAppointments: Appointment[] = [];

interface DoctorAppointmentPageProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  referrars: Referrar[];
  setReferrars: React.Dispatch<React.SetStateAction<Referrar[]>>;
  // Added invoices for barcode searching across history
  invoices?: LabInvoice[];
}

const DoctorAppointmentPage: React.FC<DoctorAppointmentPageProps> = ({ patients, setPatients, doctors, setDoctors, referrars, setReferrars, invoices = [] }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(initialAppointments);
  const [formData, setFormData] = useState<Appointment>(emptyAppointment);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [showNewDoctorForm, setShowNewDoctorForm] = useState(false);
  const [showNewReferrarForm, setShowNewReferrarForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Doctor Fee Report States
  const [selectedDoctorDailyFeeTotal, setSelectedDoctorDailyFeeTotal] = useState<number>(0);
  const [selectedDoctorMonthlyFeeTotal, setSelectedDoctorMonthlyFeeTotal] = useState<number>(0);
  const [allDoctorsDailyFeeTotal, setAllDoctorsDailyFeeTotal] = useState<number>(0);
  const [allDoctorsMonthlyFeeTotal, setAllDoctorsMonthlyFeeTotal] = useState<number>(0);

  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDateForDailyReport, setSelectedDateForDailyReport] = useState<string>(todayDateString);

  // Common styling for inputs, selects, and textareas
  const commonInputClasses = "py-2 px-3 mt-1 block w-full border border-sky-800 rounded-md shadow-sm sm:text-sm bg-sky-900/50 text-sky-200 placeholder-sky-400 transition-colors duration-200 ease-in-out focus:bg-sky-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const commonLabelClasses = "block text-sm font-semibold text-sky-300";

  useEffect(() => {
    if (successMessage) {
        const timer = setTimeout(() => setSuccessMessage(''), 5000); // Hide after 5 seconds
        return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Update filteredAppointments based on searchTerm
  useEffect(() => {
    const results = appointments.filter(appt =>
      appt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appt.referrar_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.appointment_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAppointments(results);
  }, [searchTerm, appointments]);

  // Calculate daily and monthly fee totals
  useEffect(() => {
    const calculateTotals = () => {
      let currentDoctorDailySum = 0;
      let currentDoctorMonthlySum = 0;
      let allDoctorsDailySum = 0;
      let allDoctorsMonthlySum = 0;

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const selectedDoctorId = formData.doctor_id;

      appointments.forEach(appt => {
        if (appt.status === 'Completed') {
          if (appt.appointment_date === todayDateString) {
            allDoctorsDailySum += appt.doctor_fee;
          }

          const apptDate = new Date(appt.appointment_date);
          if (apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear) {
            allDoctorsMonthlySum += appt.doctor_fee;
          }

          if (selectedDoctorId && appt.doctor_id === selectedDoctorId) {
            if (appt.appointment_date === todayDateString) {
              currentDoctorDailySum += appt.doctor_fee;
            }
            if (apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear) {
              currentDoctorMonthlySum += appt.doctor_fee;
            }
          }
        }
      });
      setSelectedDoctorDailyFeeTotal(currentDoctorDailySum);
      setSelectedDoctorMonthlyFeeTotal(currentDoctorMonthlySum);
      setAllDoctorsDailyFeeTotal(allDoctorsDailySum);
      setAllDoctorsMonthlyFeeTotal(allDoctorsMonthlySum);
    };

    calculateTotals();
  }, [appointments, formData.doctor_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFocusSelect = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleDoctorFeeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setFormData(prev => ({ ...prev, doctor_fee: 0 }));
    }
  };

  const resetForm = () => {
    setFormData(emptyAppointment);
    setSelectedAppointmentId(null);
    setIsEditing(false);
    setShowNewPatientForm(false);
    setShowNewDoctorForm(false);
    setShowNewReferrarForm(false);
    setBarcodeInput('');
  };

  const handleGetNewId = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const apptsTodayCount = appointments.filter(a => a.appointment_id.startsWith(`APP-${year}-${month}-${day}`)).length;
    const newSerial = String(apptsTodayCount + 1).padStart(3, '0');

    const newId = `APP-${year}-${month}-${day}-${newSerial}`;

    setFormData({
        ...emptyAppointment,
        appointment_id: newId,
        appointment_date: `${year}-${month}-${day}`,
        status: 'Scheduled' 
    });

    setSelectedAppointmentId(null);
    setIsEditing(false);
    setShowNewPatientForm(false);
    setShowNewDoctorForm(false);
    setShowNewReferrarForm(false);
  };

  const handlePatientSelect = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      patient_id: id,
      patient_name: name,
    }));
    setShowNewPatientForm(false); 
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = barcodeInput.trim();
      if (!code) return;

      // 1. Search by Patient ID
      let targetPatient = patients.find(p => p.pt_id === code);
      
      // 2. If not found, search by Invoice ID
      if (!targetPatient && invoices) {
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
        alert("এই বারকোড দিয়ে কোনো রোগী বা ইনভয়েস পাওয়া যায়নি।");
      }
    }
  };

  const handleDoctorSelect = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      doctor_id: id,
      doctor_name: name,
    }));
    setShowNewDoctorForm(false);
  };

  const handleReferrarSelect = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      referrar_id: id,
      referrar_name: name,
    }));
    setShowNewReferrarForm(false);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.appointment_id || !formData.patient_id || !formData.doctor_id || !formData.appointment_date || !formData.appointment_time || !formData.reason || !formData.status) {
      alert('Error: Please fill in all required fields (Appointment ID, Patient, Doctor, Date, Time, Reason, and Status).');
      return;
    }
    if (formData.doctor_fee < 0) {
        alert('Error: Doctor Fee cannot be negative.');
        return;
    }

    if (isEditing) {
      setAppointments(prev => prev.map(a => a.appointment_id === formData.appointment_id ? formData : a));
      setSuccessMessage('Appointment updated successfully!');
    } else {
      if (appointments.some(a => a.appointment_id === formData.appointment_id)) {
        alert('Error: Appointment ID already exists. Please get a new ID.');
        return;
      }
      setAppointments(prev => [formData, ...prev]);
      setSuccessMessage('New appointment created successfully!');
    }
    resetForm();
  };

  const handleEditAppointment = () => {
    if (!selectedAppointmentId) {
      alert("Please select an appointment from the table to edit.");
      return;
    }
    const appointmentToEdit = appointments.find(a => a.appointment_id === selectedAppointmentId);
    if (appointmentToEdit) {
      setFormData(appointmentToEdit);
      setIsEditing(true);
    }
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointmentId) {
      alert("Please select an appointment to cancel.");
      return;
    }
    const appointmentToCancel = appointments.find(a => a.appointment_id === selectedAppointmentId);
    if (appointmentToCancel && appointmentToCancel.status === 'Scheduled') {
      if (window.confirm(`Are you sure you want to cancel appointment ${appointmentToCancel.appointment_id}?`)) {
        setAppointments(prevAppointments =>
          prevAppointments.map(a =>
            a.appointment_id === selectedAppointmentId ? { ...a, status: 'Cancelled' } : a
          )
        );
        resetForm();
        setSuccessMessage('Appointment cancelled successfully.');
      }
    } else if (appointmentToCancel) {
      alert(`Appointment cannot be cancelled. Current status is '${appointmentToCancel.status}'. Only 'Scheduled' appointments can be cancelled.`);
    }
  };

  const handleRowClick = (appointment: Appointment) => {
    setFormData(appointment);
    setSelectedAppointmentId(appointment.appointment_id);
    setIsEditing(false);
    setShowNewPatientForm(false);
    setShowNewDoctorForm(false);
    setShowNewReferrarForm(false);
  };

  const handlePrintAppointment = () => {
    if (!selectedAppointmentId) {
        alert("Please select an appointment from the table to print.");
        return;
    }
    const apptToPrint = appointments.find(a => a.appointment_id === selectedAppointmentId);
    if (!apptToPrint) {
        alert("Selected appointment not found.");
        return;
    }

    const patient = patients.find(p => p.pt_id === apptToPrint.patient_id);
    const doctor = doctors.find(d => d.doctor_id === apptToPrint.doctor_id);

    const getSlipHtml = (type: string) => `
        <div class="content-box">
            <div class="header">
                <h1>Niramoy Clinic & Diagnostic</h1>
                <p>Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                <div class="header-line"></div>
                <div style="display: flex; justify-content: center; align-items: center; margin-top: 15px;">
                    <p style="font-weight: 900; font-size: 11px; text-decoration: underline; margin: 0;">APPOINTMENT SLIP (${type})</p>
                </div>
            </div>

            <div class="content-row">
                <div class="token-box">TOKEN ID: ${apptToPrint.appointment_id.split('-').pop()}</div>
                <div class="date-time">
                    <b>Date:</b> ${apptToPrint.appointment_date} | <b>Time:</b> ${apptToPrint.appointment_time}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <table class="info-table" style="flex: 1;">
                    <tr>
                        <td class="label">Patient:</td><td class="val name-val">${apptToPrint.patient_name}</td>
                    </tr>
                    <tr>
                        <td class="label">Age/Sex:</td><td class="val">${patient?.ageY}Y / ${patient?.gender}</td>
                    </tr>
                    <tr>
                        <td class="label">Address:</td><td class="val">${patient?.address || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Reason:</td><td class="val">${apptToPrint.reason}</td>
                    </tr>
                    <tr>
                        <td class="label">Fee:</td><td class="val">BDT ${apptToPrint.doctor_fee.toFixed(2)}</td>
                    </tr>
                </table>
                <div style="margin-left: 10px; text-align: right; min-width: 90px; padding-top: 5px;">
                    <img 
                        src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(apptToPrint.patient_id)}&scale=1&height=10&incltext=false" 
                        alt="BC" 
                        style="height: 35px; width: auto; max-width: 100%;"
                    />
                    <div style="font-size: 8px; font-family: monospace; margin-top: 2px; font-weight: bold;">${apptToPrint.patient_id}</div>
                </div>
            </div>

            <div class="doc-box">
                <div class="doc-name">Consultant: ${doctor?.doctor_name}</div>
                <div class="doc-deg">${doctor?.degree}</div>
            </div>
            <div class="footer">Printed on ${formatDateTime(new Date())}</div>
        </div>
    `;

    const printContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Appointment Slip Print</title>
            <style>
                @page { 
                    size: 8.4in 5.8in; 
                    margin: 0; 
                }
                body { margin: 0; padding: 0; background: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .page-container { 
                    width: 8.4in; 
                    height: 5.8in; 
                    display: flex;
                    flex-direction: row;
                    box-sizing: border-box; 
                    overflow: hidden;
                }
                .slip-column {
                    width: 50%;
                    height: 5.8in;
                    box-sizing: border-box;
                    padding: 0.4in 0.4in;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }
                .slip-column:first-child {
                    border-right: 1.5px dashed #444;
                }
                .content-box { height: 100%; display: flex; flex-direction: column; }
                .header { text-align: center; margin-bottom: 5px; }
                .header h1 { margin: 0; font-size: 20px; font-weight: 900; color: #000; text-transform: uppercase; }
                .header p { margin: 1px 0; font-size: 10px; font-weight: bold; }
                .header-line { width: 100%; height: 1.5px; background: black; margin-top: 8px; }
                .content-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; margin-top: 10px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
                .token-box { font-size: 18px; font-weight: bold; border: 2.5px solid #000; padding: 3px 12px; border-radius: 4px; }
                .date-time { font-size: 11px; }
                .info-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                .info-table td { padding: 4px 0; }
                .label { font-weight: bold; width: 60px; color: #333; text-transform: uppercase; font-size: 9px; vertical-align: top; }
                .val { font-weight: 800; color: #000; }
                .name-val { white-space: nowrap; font-size: 14px; text-transform: uppercase; }
                .doc-box { margin-top: auto; border-top: 1.2px dashed #999; padding-top: 8px; text-align: right; }
                .doc-name { font-size: 13px; font-weight: bold; }
                .doc-deg { font-size: 10px; color: #444; }
                .footer { position: absolute; bottom: 0.3in; left: 0.4in; right: 0.4in; text-align: center; font-size: 8px; color: #777; border-top: 1px solid #eee; padding-top: 2px; }
            </style>
        </head>
        <body>
            <div class="page-container">
                <div class="slip-column">${getSlipHtml('Patient Copy')}</div>
                <div class="slip-column">${getSlipHtml('Office Copy')}</div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    } else {
        alert("Please allow pop-ups for printing.");
    }
  };

  const isAppointmentSelected = selectedAppointmentId !== null;
  const selectedAppointmentStatus = appointments.find(a => a.appointment_id === selectedAppointmentId)?.status;
  const canCancel = isAppointmentSelected && selectedAppointmentStatus === 'Scheduled';

  return (
    <div className="bg-slate-900 text-slate-200 rounded-xl p-4 sm:p-6 space-y-8">
      {successMessage && (
          <div className="fixed bottom-5 right-5 z-[9999] bg-green-900/95 border border-green-500 text-green-100 px-6 py-3 rounded-lg shadow-2xl flex items-center transition-transform animate-fade-in-up backdrop-blur-sm">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage('')} className="ml-4 text-green-300 font-bold">&times;</button>
          </div>
      )}
      <div className="bg-sky-950 rounded-xl p-4 sm:p-6 border border-sky-800">
        <h2 className="text-2xl font-bold text-sky-100 mb-6 border-b border-sky-800 pb-4">Doctor Appointment</h2>

        <div className="flex flex-wrap items-center justify-start gap-4 border-b border-sky-800 pb-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="appointment_id" className="font-semibold text-sky-300 whitespace-nowrap">Appt. Id:</label>
                <input type="text" id="appointment_id" name="appointment_id" disabled value={formData.appointment_id} className="w-48 border border-sky-800 rounded-md shadow-sm sm:text-sm px-3 py-2 bg-sky-900 text-sky-400 cursor-not-allowed" />
                <button type="button" onClick={handleGetNewId} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-blue-500">
                    Get New Appt. ID
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button type="submit" form="appointment-form" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-green-500">Save Appointment</button>
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-sky-200 bg-slate-600 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-slate-500">Cancel</button>
                <button type="button" onClick={handleEditAppointment} disabled={!isAppointmentSelected} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed">Edit Appointment</button>
                <button type="button" onClick={handleCancelAppointment} disabled={!canCancel} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">Cancel Appointment</button>
                <button type="button" onClick={handlePrintAppointment} disabled={!isAppointmentSelected} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Print Slip</button>
            </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
                <label htmlFor="search_appointment" className="font-semibold text-sky-300 whitespace-nowrap">Search Appt:</label>
                <input
                type="text"
                id="search_appointment"
                name="search_appointment"
                placeholder="Search by Patient/Doctor Name or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 py-2 px-3 border border-sky-800 bg-sky-900 text-sky-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-sky-500/30 shadow-inner">
                <div className="bg-sky-600 p-1.5 rounded-md text-white shadow-lg animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>
                </div>
                <label htmlFor="barcode_scanner" className="font-black text-xs text-sky-400 uppercase tracking-tighter whitespace-nowrap">Scanner Mode:</label>
                <input
                    type="text"
                    id="barcode_scanner"
                    placeholder="Scan Patient ID or Previous Invoice..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeScan}
                    className="flex-1 py-2 px-3 border-2 border-sky-500/50 bg-slate-950 text-white rounded-md shadow-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 sm:text-sm font-mono"
                    autoComplete="off"
                />
            </div>
        </div>

        <form id="appointment-form" onSubmit={handleSaveAppointment} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            <div>
                <SearchableSelect
                    theme="dark"
                    label="Patient"
                    options={patients.map(p => ({ 
                        id: p.pt_id, 
                        name: p.pt_name, 
                        details: `${p.gender}, ${p.ageY}Y, ${p.co_pref} ${p.co_name}, Add: ${p.address}, Mob: ${p.mobile}` 
                    }))}
                    value={formData.patient_id}
                    onChange={handlePatientSelect}
                    onAddNew={() => setShowNewPatientForm(true)}
                    placeholder="Search or add new patient"
                    required
                />
            </div>
            <div>
                <SearchableSelect
                theme="dark"
                label="Select Doctor"
                options={doctors.map(d => ({ id: d.doctor_id, name: d.doctor_name, details: d.degree }))}
                value={formData.doctor_id || ''}
                onChange={handleDoctorSelect}
                onAddNew={() => setShowNewDoctorForm(true)}
                placeholder="Search or add new doctor"
                required
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
                />
            </div>
            <div>
                <label htmlFor="appointment_date" className={commonLabelClasses}>Appointment Date</label>
                <input type="date" id="appointment_date" name="appointment_date" value={formData.appointment_date} onChange={handleInputChange} required className={commonInputClasses} />
            </div>
            <div>
                <label htmlFor="appointment_time" className={commonLabelClasses}>Appointment Time</label>
                <input type="time" id="appointment_time" name="appointment_time" value={formData.appointment_time} onChange={handleInputChange} required className={commonInputClasses} />
            </div>
            <div>
                <label htmlFor="doctor_fee" className={commonLabelClasses}>Doctor Fee (BDT)</label>
                <input
                    type="number"
                    id="doctor_fee"
                    name="doctor_fee"
                    value={formData.doctor_fee}
                    onChange={handleInputChange}
                    onFocus={handleFocusSelect}
                    onBlur={handleDoctorFeeBlur}
                    required
                    min="0"
                    step="10"
                    className={commonInputClasses}
                />
            </div>
            <div className="lg:col-span-1">
                <label htmlFor="reason" className={commonLabelClasses}>Reason for Appointment</label>
                <input 
                  list="reasonOptions" 
                  id="reason" 
                  name="reason" 
                  value={formData.reason} 
                  onChange={handleInputChange} 
                  required 
                  className={commonInputClasses} 
                  placeholder="Select or type reason..."
                  autoComplete="off"
                />
                <datalist id="reasonOptions">
                   {appointmentReasons.map(r => <option key={r} value={r} />)}
                </datalist>
            </div>
            <div className="lg:col-span-1">
                <label htmlFor="status" className={commonLabelClasses}>Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleInputChange} required className={commonInputClasses}>
                <option value="" disabled hidden>Select Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                </select>
            </div>
            <div className="lg:col-span-1">
                <label htmlFor="notes" className={commonLabelClasses}>Notes (Optional)</label>
                <input 
                  type="text"
                  id="notes" 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  className={commonInputClasses} 
                  placeholder="Any additional notes..."
                />
            </div>
            </div>
        </form>
      </div>
      
      <div className="mt-8 border-t border-slate-700 pt-6">
          <h3 className="text-xl font-bold text-slate-100 mb-4">Today's Appointments</h3>
          <div className="overflow-x-auto border border-slate-700 rounded-lg">
              <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Appt. ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date/Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Patient Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Doctor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                      </tr>
                  </thead>
                  <tbody className="bg-slate-900 divide-y divide-slate-700">
                      {filteredAppointments.map((appt) => (
                          <tr 
                            key={appt.appointment_id} 
                            className={`hover:bg-slate-800/50 ${selectedAppointmentId === appt.appointment_id ? 'bg-blue-900/30' : ''}`}
                            onClick={() => handleRowClick(appt)}
                          >
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{appt.appointment_id}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{appt.appointment_date} <span className="text-xs text-slate-500">({appt.appointment_time})</span></td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-200">{appt.patient_name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{appt.doctor_name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{appt.reason}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      appt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                      appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'
                                  }`}>
                                      {appt.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {showNewPatientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-slate-600 bg-slate-900 relative">
                <button onClick={() => setShowNewPatientForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 bg-slate-800 rounded-full p-1 hover:bg-slate-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                <div className="p-2"><PatientInfoPage patients={patients} setPatients={setPatients} isEmbedded onClose={() => setShowNewPatientForm(false)} onSaveAndSelect={handlePatientSelect} /></div>
            </div>
        </div>
      )}

      {showNewDoctorForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-slate-600 bg-slate-900 relative">
                <button onClick={() => setShowNewDoctorForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 bg-slate-800 rounded-full p-1 hover:bg-slate-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                <div className="p-2"><DoctorInfoPage doctors={doctors} setDoctors={setDoctors} isEmbedded onClose={() => setShowNewDoctorForm(false)} onSaveAndSelect={handleDoctorSelect} /></div>
            </div>
        </div>
      )}

      {showNewReferrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-slate-600 bg-slate-900 relative">
                <button onClick={() => setShowNewReferrarForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 bg-slate-800 rounded-full p-1 hover:bg-slate-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                <div className="p-2"><ReferrerInfoPage referrars={referrars} setReferrars={setReferrars} isEmbedded onClose={() => setShowNewReferrarForm(false)} onSaveAndSelect={handleReferrarSelect} /></div>
            </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-700">
        <h3 className="text-xl font-bold text-slate-100 mb-4">Doctor Fee Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-sky-900 rounded-lg p-5 shadow-sm border border-sky-700">
            <h4 className="text-lg font-semibold text-sky-300 mb-2">{formData.doctor_name || 'Selected Doctor'}'s Daily Fee</h4>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">Date:</label>
              <input type="date" value={selectedDateForDailyReport} onChange={(e) => setSelectedDateForDailyReport(e.target.value)} className="w-40 py-2 px-3 border border-sky-700 rounded-md shadow-sm sm:text-sm bg-sky-800 text-sky-200" />
            </div>
            {formData.doctor_id ? ( <p className="text-3xl font-bold text-sky-200">BDT {selectedDoctorDailyFeeTotal.toFixed(2)}</p> ) : ( <p className="text-lg text-sky-400">Select a Doctor</p> )}
          </div>
          <div className="bg-emerald-900 rounded-lg p-5 shadow-sm border border-emerald-700">
            <h4 className="text-lg font-semibold text-emerald-300 mb-2">{formData.doctor_name || 'Selected Doctor'}'s Monthly Fee</h4>
            <p className="text-sm text-slate-400 mb-3">For {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            {formData.doctor_id ? ( <p className="text-3xl font-bold text-emerald-200">BDT {selectedDoctorMonthlyFeeTotal.toFixed(2)}</p> ) : ( <p className="text-lg text-sky-400">Select a Doctor</p> )}
          </div>
          <div className="bg-purple-900 rounded-lg p-5 shadow-sm border border-purple-700">
            <h4 className="text-lg font-semibold text-purple-300 mb-2">All Doctors Daily Fee</h4>
            <p className="text-sm text-slate-400 mb-3">Date: {selectedDateForDailyReport}</p>
            <p className="text-3xl font-bold text-purple-200">BDT {allDoctorsDailyFeeTotal.toFixed(2)}</p>
          </div>
          <div className="bg-amber-900 rounded-lg p-5 shadow-sm border border-amber-700">
            <h4 className="text-lg font-semibold text-amber-300 mb-2">All Doctors Monthly Fee</h4>
            <p className="text-sm text-slate-400 mb-3">For {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            <p className="text-3xl font-bold text-amber-200">BDT {allDoctorsMonthlyFeeTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentPage;
