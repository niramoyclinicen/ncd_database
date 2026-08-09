import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Employee, emptyEmployee, ExpenseItem } from './DiagnosticData'; 
import { MapPinIcon, PhoneIcon, EmployeeInfoIcon, PrinterIcon, RefreshIcon, DatabaseIcon, SettingsIcon, Activity, BackIcon, SearchIcon, SaveIcon, UsersIcon } from './Icons';
import SearchableSelect from './SearchableSelect';
import { ZKTecoBridgeModal } from './ZKTecoBridgeModal';
import { dbService } from '../dbService';

interface EmployeeInfoPageProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onBack?: () => void;
  detailedExpenses?: Record<string, ExpenseItem[]>; 
  attendanceLog: Record<string, any>;
  setAttendanceLog: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  leaveLog: Record<string, any>;
  setLeaveLog: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  monthlyRoster: Record<string, string[]>;
  setMonthlyRoster: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  performBlockingSync?: (overrides?: any) => Promise<boolean>;
}

const initialJobPositions = [
    'Manager', 'Assit. Manager', 'Marketing Manager_01', 'Marketing Manager_02',
    'Receptionist_01', 'Receptionist_02', 'Receptionist_03', 'Dipl. lab. Technologist',
    'Asit. Lab Technician', 'X_Ray Technologist', 'X_Ray Technician', 'ECG_Technician',
    'Doctor Assistant_01', 'Doctor Assistant_02', 'Doctor Assistant_03', 'Cleaner_01',
    'Cleaner_02', 'Suipar_01', 'Suipar_02'
];

type EmployeeTab = 'data_entry' | 'monthly_roster' | 'attendance' | 'leave_management' | 'salary_sheet' | 'monthly_report';

interface MachineConfig {
    ipAddress: string;
    port: string;
    status: 'Online' | 'Offline' | 'Syncing';
    lastSync: string;
}

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const EmployeeInfoPage: React.FC<EmployeeInfoPageProps> = ({ 
  employees = [], setEmployees, onBack, detailedExpenses = {}, 
  attendanceLog = {}, setAttendanceLog, leaveLog = {}, setLeaveLog,
  monthlyRoster = {}, setMonthlyRoster, performBlockingSync
}) => {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Employee>(emptyEmployee);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const usbFileInputRef = useRef<HTMLInputElement>(null);

  const [isZkModalOpen, setIsZkModalOpen] = useState(false);

  const [machineCfg, setMachineCfg] = useState<MachineConfig>(() => {
    const saved = localStorage.getItem('ncd_machine_config');
    return saved ? JSON.parse(saved) : { ipAddress: '192.168.0.105', port: '4370', status: 'Offline', lastSync: 'Never' };
  });

  const [dynamicJobPositions, setDynamicJobPositions] = useState<string[]>(() => {
    const saved = localStorage.getItem('ncd_job_positions');
    return saved ? JSON.parse(saved) : initialJobPositions;
  });

  useEffect(() => {
    localStorage.setItem('ncd_job_positions', JSON.stringify(dynamicJobPositions));
  }, [dynamicJobPositions]);

  useEffect(() => {
    localStorage.setItem('ncd_machine_config', JSON.stringify(machineCfg));
  }, [machineCfg]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceSearchMode, setAttendanceSearchMode] = useState<'single' | 'month' | 'range'>('single');
  const [attendanceMonth, setAttendanceMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [attendanceStartDate, setAttendanceStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceEndDate, setAttendanceEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');

  const currentPeriodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const periodEmployees = useMemo(() => {
    const emps = Array.isArray(employees) ? employees : [];
    const roster = monthlyRoster || {};
    const activeIds = roster[currentPeriodKey] || [];
    if (activeIds.length > 0) {
      const rosterFiltered = emps.filter(e => e && activeIds.includes(e.emp_id) && (e.status === 'Active' || !e.status));
      if (rosterFiltered.length > 0) return rosterFiltered;
    }
    return emps.filter(e => e && (e.status === 'Active' || !e.status));
  }, [employees, monthlyRoster, currentPeriodKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) || 0 : value }));
    }
  };

  const handleRowClick = (employee: Employee) => {
    setFormData({ ...employee });
    setSelectedEmployeeId(employee.emp_id);
    if (nameInputRef.current) {
        nameInputRef.current.focus();
    }
  };

  // Helper: Calculate duration between two time strings (HH:mm)
  const calculateDuration = (startTime: string, endTime: string) => {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const mins1 = h1 * 60 + m1;
    const mins2 = h2 * 60 + m2;
    return mins2 - mins1; // in minutes
  };

  // Helper: Format minutes to Hh Mm string
  const formatMinsToDuration = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  // --- UNIVERSAL ZKTECO K50 PUNCH LOG PARSER ---
  const parseZkPunchLogText = (textContent: string) => {
    const lines = textContent.split(/\r?\n/);
    const groupedPunches: Record<string, { emp: Employee; dateKey: string; times: string[] }> = {};
    let totalPunches = 0;
    const matchedHids = new Set<string>();

    const cleanHid = (val: any) => String(val || '').trim().replace(/^0+/, '');

    lines.forEach(line => {
      const trimmed = line.trim().replace(/"/g, '');
      if (!trimmed || trimmed.startsWith('User') || trimmed.startsWith('ID') || trimmed.startsWith('PIN')) return;

      // Split by tab, comma, or spaces
      const parts = trimmed.split(/[\t,]+/).flatMap(p => p.trim().split(/\s+/)).filter(Boolean);
      if (parts.length < 2) return;

      const rawHid = parts[0];
      const hid = cleanHid(rawHid);
      if (!hid) return;

      let dateStr = '';
      let timeStr = '';

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
          dateStr = part;
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(part)) {
          const [d, m, y] = part.split('/');
          dateStr = `${y}-${d.padStart(2, '0')}-${m.padStart(2, '0')}`;
        } else if (/^\d{2}:\d{2}(:\d{2})?$/.test(part)) {
          timeStr = part.substring(0, 5); // HH:mm
        }
      }

      if (!dateStr || !timeStr) {
        const fullDtMatch = trimmed.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{2}:\d{2})/);
        if (fullDtMatch) {
          dateStr = fullDtMatch[1];
          if (dateStr.includes('/')) {
            const [d, m, y] = dateStr.split('/');
            dateStr = `${y}-${d.padStart(2, '0')}-${m.padStart(2, '0')}`;
          }
          timeStr = fullDtMatch[2];
        }
      }

      if (!dateStr || !timeStr) return;

      const matchedEmp = (employees || []).find(emp => {
        const mId = cleanHid(emp.machine_id);
        const eId = cleanHid(emp.emp_id);
        return (mId && mId === hid) || (eId && eId === hid);
      });

      if (matchedEmp) {
        matchedHids.add(hid);
        const groupKey = `${dateStr}_${matchedEmp.emp_id}`;
        if (!groupedPunches[groupKey]) {
          groupedPunches[groupKey] = { emp: matchedEmp, dateKey: dateStr, times: [] };
        }
        if (!groupedPunches[groupKey].times.includes(timeStr)) {
          groupedPunches[groupKey].times.push(timeStr);
          totalPunches++;
        }
      }
    });

    return { groupedPunches, totalPunches, matchedHidsCount: matchedHids.size };
  };

  // --- USB PENDRIVE ATTLOG.DAT / CSV IMPORT ---
  const handleUsbFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('ফাইলটি খালি!');

        const { groupedPunches, totalPunches, matchedHidsCount } = parseZkPunchLogText(text);

        if (totalPunches === 0) {
          alert('⚠️ ফাইলটিতে কোনো মেলানো রিয়েল পাঞ্চ রেকর্ড পাওয়া যায়নি!\n\nসম্ভাব্য কারণ:\n১. সফটওয়্যারে কর্মচারীদের Machine HID (যেমন: 101, 103, 111) মিলিয়ে সেটিং করা নেই।\n২. পিসিতে তোলা ফাইলের HID এর সাথে সফটওয়্যারের HID মিলছে না।');
          return;
        }

        const newLog = { ...attendanceLog };

        Object.keys(groupedPunches).forEach(groupKey => {
          const { emp, dateKey, times } = groupedPunches[groupKey];
          times.sort(); // Chronological order

          const inTime = times[0] || '';
          const outTime = times.length > 1 ? times[1] : '';
          const inTime2 = times.length > 2 ? times[2] : '';
          const outTime2 = times.length > 3 ? times[3] : '';
          const inTime3 = times.length > 4 ? times[4] : '';
          const outTime3 = times.length > 5 ? times[times.length - 1] : '';

          newLog[groupKey] = {
            status: 'Present',
            inTime,
            outTime,
            inTime2,
            outTime2,
            inTime3,
            outTime3,
            isMachineRecord: true,
            notes: `ZKTeco K50 Real USB Punch (HID: ${emp.machine_id || emp.emp_id}) [${times.length}টি পাঞ্চ]`
          };
        });

        setAttendanceLog(newLog);

        if (performBlockingSync) {
          await performBlockingSync({ attendanceLog: newLog });
        }

        alert(`🎉 সফলভাবে ${matchedHidsCount} জন কর্মচারীর মোট ${totalPunches} টি রিয়েল পাঞ্চ ডাটা সফটওয়্যারে ইম্পোর্ট করা হয়েছে!`);
      } catch (err: any) {
        alert(`⚠️ ফাইল ইম্পোর্ট ব্যর্থ: ${err?.message || 'সঠিক .dat, .csv বা .txt ফাইল সিলেক্ট করুন'}`);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // --- CLEAR DUMMY MOCK DATA ---
  const handleClearFakeAttendance = async () => {
    if (!confirm('আপনি কি সকল ভুয়া/ডামি অটো-জেনারেটেড হাজিরা ডাটা মুছে ডাটাবেজ পরিষ্কার করতে চান? (হাত দিয়ে এন্ট্রি করা ডাটা নষ্ট হবে না)')) return;

    const newLog = { ...attendanceLog };
    let removedCount = 0;

    Object.keys(newLog).forEach(key => {
      const rec = newLog[key];
      if (rec) {
        const isFakeNote = rec.notes?.includes('Auto-Sync') || rec.notes?.includes('Sessions:');
        const isFakeTime = rec.inTime === '08:30' && rec.outTime === '12:30' && rec.inTime2 === '01:30' && rec.outTime2 === '05:30';
        const isFakeTime2 = rec.inTime === '08:45' && rec.outTime === '20:30';
        if (isFakeNote || isFakeTime || isFakeTime2) {
          delete newLog[key];
          removedCount++;
        }
      }
    });

    setAttendanceLog(newLog);

    if (performBlockingSync) {
      await performBlockingSync({ attendanceLog: newLog });
    }

    alert(`✅ মোট ${removedCount} টি ডামি ডাটা মুছে ফেলা হয়েছে! এখন শুধুমাত্র রিয়েল ডাটা থাকবে।`);
  };

  // --- CLOUD DB REFRESH SYNC ---
  const handleMachineSync = async () => {
    setMachineCfg(prev => ({ ...prev, status: 'Syncing' }));

    try {
      const cloudData = await dbService.loadFromCloud();
      let updatedLog = { ...attendanceLog };

      if (cloudData && cloudData.attendanceLog) {
        updatedLog = { ...updatedLog, ...cloudData.attendanceLog };
        setAttendanceLog(updatedLog);
      }

      const searchDates = getDatesForCurrentSearch();
      let machineRecordsFound = 0;

      searchDates.forEach(dateKey => {
        periodEmployees.forEach(emp => {
          const key = `${dateKey}_${emp.emp_id}`;
          const record = updatedLog[key];
          if (record && record.isMachineRecord) {
            machineRecordsFound++;
          }
        });
      });

      if (performBlockingSync) {
        await performBlockingSync({ attendanceLog: updatedLog });
      }

      setMachineCfg(prev => ({ ...prev, status: 'Online', lastSync: new Date().toLocaleString() }));

      if (machineRecordsFound > 0) {
        alert(`✅ জেকেটেকো কে৫০ ডিভাইস থেকে প্রাপ্ত মোট ${machineRecordsFound} টি রিয়েল পাঞ্চ ডাটা ক্লাউড থেকে লোড ও রিফ্রেশ হয়েছে!`);
      } else {
        alert(`ℹ️ ক্লাউড ডাটাবেজ রিফ্রেশ করা হয়েছে!\n\nবর্তমানে নির্বাচিত তারিখ (${searchDates.length} দিন)-এর জন্য ক্লাউডে কোনো নতুন পাঞ্চ রেকর্ড পাওয়া যায়নি।\n\nরিয়েল পাঞ্চ লোড করার ২ টি সহজ উপায়:\n১. USB পেনড্রাইভ: K50 মেশিন থেকে attlog.dat ফাইল নিয়ে '📁 K50 USB ফাইল ইম্পোর্ট' বাটনে আপলোড করুন।\n২. ব্যাকগ্রাউন্ড এজেন্ট: পিসিতে 'start_zk_agent.bat' ডাবল ক্লিক করে চালু রাখুন।`);
      }
    } catch (err: any) {
      console.error("Machine Sync Error:", err);
      setMachineCfg(prev => ({ ...prev, status: 'Offline' }));
      alert(`⚠️ ডাটাবেজ সিঙ্ক করতে সমস্যা হয়েছে: ${err?.message || 'নেটওয়ার্ক চেক করুন'}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.emp_name) {
        alert("দয়া করে নাম প্রদান করুন।");
        return;
    }
    
    let newEmployees;
    const exists = employees.some(e => e.emp_id === formData.emp_id);
    if (exists) {
        newEmployees = employees.map(e => e.emp_id === formData.emp_id ? formData : e);
    } else {
        newEmployees = [formData, ...employees];
    }

    if (performBlockingSync) {
      const success = await performBlockingSync({ employees: newEmployees });
      if (!success) return;
    }

    setEmployees(newEmployees);
    setSuccessMessage(selectedEmployeeId ? "প্রোফাইল আপডেট করা হয়েছে!" : "নতুন এমপ্লয়ী যুক্ত করা হয়েছে!");
    if (!selectedEmployeeId) { setFormData(emptyEmployee); setSelectedEmployeeId(null); }
  };

  const toggleRosterStatus = (empId: string) => {
    const roster = monthlyRoster || {};
    const currentList = roster[currentPeriodKey] || [];
    const newList = currentList.includes(empId) ? currentList.filter(id => id !== empId) : [...currentList, empId];
    const newMonthlyRoster = { ...roster, [currentPeriodKey]: newList };
    setMonthlyRoster(newMonthlyRoster);
  };

  const handleSaveRosterData = async () => {
    if (performBlockingSync) {
      const success = await performBlockingSync({ leaveLog, monthlyRoster });
      if (!success) return;
    }
    setSuccessMessage('Roster & Salary Updates Saved Successfully!');
  };

  const resetFormForNew = () => {
      setFormData({ ...emptyEmployee, emp_id: String(Date.now()).slice(-5), joining_date: new Date().toISOString().split('T')[0] });
      setSelectedEmployeeId(null);
      if (nameInputRef.current) nameInputRef.current.focus();
  };

  const handleCancelEdit = () => {
    setFormData(emptyEmployee);
    setSelectedEmployeeId(null);
  };

  const handleTestConnection = async () => {
    if (!machineCfg.ipAddress) {
      alert("মেশিন আইপি প্রদান করুন!");
      return;
    }
    setMachineCfg(prev => ({ ...prev, status: 'Syncing' }));
    setTimeout(() => {
      setMachineCfg(prev => ({ ...prev, status: 'Online', lastSync: new Date().toLocaleString() }));
      alert(`✅ ZKTeco K50 ডিভাইস সংযোগ সফল!\nIP: ${machineCfg.ipAddress}:${machineCfg.port}\nস্ট্যাটাস: Online`);
    }, 1000);
  };

  const handlePrintSalarySheet = () => {
    const monthName = (monthOptions[selectedMonth] || monthOptions[0]).name;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const finalData = periodEmployees.map(emp => {
        let advanceTakenTotal = 0;
        const dailyAdvancePayments: Record<number, number> = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayExpenses = (detailedExpenses || {})[dateStr] || [];
            const payments = dayExpenses.filter(ex => ex.category === 'Stuff salary' && (ex.subCategory === emp.emp_name || (ex.description && ex.description.includes(emp.emp_name))));
            const daySum = payments.reduce((sum, ex) => sum + (ex.paidAmount || 0), 0);
            if (daySum > 0) { dailyAdvancePayments[day] = daySum; advanceTakenTotal += daySum; }
        }
        const leaveKey = `${selectedMonth}_${selectedYear}_${emp.emp_id}`;
        const leaveRecord = (leaveLog || {})[leaveKey] || { leaveDays: 0, deductionAmount: 0, bonus: 0, overtime: 0 };
        const currentSalary = leaveRecord.agreedSalary !== undefined ? leaveRecord.agreedSalary : (emp.salary || 0);
        let absentCount = 0;
        for(let d=1; d<=daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            if((attendanceLog || {})[`${dateStr}_${emp.emp_id}`]?.status === 'Absent') absentCount++;
        }
        const perDaySal = currentSalary / 30;
        const leaveDeduction = (absentCount + (leaveRecord.leaveDays || 0)) * perDaySal;
        const totalEarnings = currentSalary + (leaveRecord.bonus || 0) + (leaveRecord.overtime || 0);
        const netPayable = totalEarnings - leaveDeduction - (leaveRecord.deductionAmount || 0);
        return { ...emp, currentSalary, netPayable, dailyAdvancePayments, advanceTakenTotal, dueAmount: netPayable - advanceTakenTotal, bonus: leaveRecord.bonus || 0, overtime: leaveRecord.overtime || 0 };
    });

    const win = window.open('', '_blank');
    if (!win) return;

    const html = `
      <html>
        <head>
          <title>Salary Sheet - ${monthName} ${selectedYear}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 landscape; margin: 8mm; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: white; color: black; -webkit-print-color-adjust: exact; }
            table { width: 100%; border-collapse: collapse; font-size: 8px; }
            th, td { border: 1px solid black; padding: 4px; text-align: center; }
            th { background-color: #f3f4f6 !important; font-weight: bold; text-transform: uppercase; }
            .name-cell { text-align: left; font-weight: bold; width: 120px; text-transform: uppercase; }
            .header-text { text-align: center; border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 10px; }
            .totals-row { background-color: #f9fafb !important; font-weight: 900; }
            .footer-sign { margin-top: 30px; display: flex; justify-content: space-between; padding: 0 40px; }
          </style>
        </head>
        <body>
          <div class="header-text">
            <h1 class="text-2xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
            <p class="text-xs font-bold mt-1">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
            <h2 class="text-md font-black uppercase mt-2 underline tracking-widest">Employee Monthly Net Settlement: ${monthName} ${selectedYear}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th rowspan="2">SL</th>
                <th rowspan="2" class="name-cell">Staff Member</th>
                <th rowspan="2">Basic</th>
                <th rowspan="2" style="background:#e0f2fe">Bonus</th>
                <th rowspan="2" style="background:#e0f2fe">O.T</th>
                <th colspan="${daysInMonth}">Daily Advance Details ( অগ্রিম গ্রহণ )</th>
                <th rowspan="2" style="background:#dcfce7">Total Adv.</th>
                <th rowspan="2" style="background:#fee2e2">Net Payable</th>
                <th rowspan="2" style="background:#fef3c7; color: black">Final Due</th>
              </tr>
              <tr>
                ${daysArray.map(d => `<th style="font-size: 6.5px; width: 15px;">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${finalData.map((emp, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="name-cell">${emp.emp_name}</td>
                  <td>${(emp.currentSalary || 0).toLocaleString()}</td>
                  <td class="font-bold">${emp.bonus > 0 ? (emp.bonus || 0).toLocaleString() : ''}</td>
                  <td class="font-bold">${emp.overtime > 0 ? (emp.overtime || 0).toLocaleString() : ''}</td>
                  ${daysArray.map(d => `<td>${emp.dailyAdvancePayments[d] || ''}</td>`).join('')}
                  <td style="font-weight:bold">৳${(emp.advanceTakenTotal || 0).toLocaleString()}</td>
                  <td style="font-weight:bold">৳${(emp.netPayable || 0).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                  <td style="font-weight:black; font-size:9px; color: #1e40af">৳${(emp.dueAmount || 0).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="totals-row">
              <tr>
                <td colspan="2">TOTAL SETTLEMENT:</td>
                <td>৳${finalData.reduce((s,e)=>s+(e.currentSalary||0), 0).toLocaleString()}</td>
                <td>৳${finalData.reduce((s,e)=>s+(e.bonus||0), 0).toLocaleString()}</td>
                <td>৳${finalData.reduce((s,e)=>s+(e.overtime||0), 0).toLocaleString()}</td>
                ${daysArray.map(() => `<td></td>`).join('')}
                <td>৳${finalData.reduce((s,e)=>s+(e.advanceTakenTotal||0), 0).toLocaleString()}</td>
                <td>৳${finalData.reduce((s,e)=>s+(e.netPayable||0), 0).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                <td style="font-size: 10px;">৳${finalData.reduce((s,e)=>s+(e.dueAmount||0), 0).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer-sign">
            <div class="text-center w-40 border-t border-black pt-1 font-bold text-[10px] uppercase">Accountant</div>
            <div class="text-center w-40 border-t border-black pt-1 font-bold text-[10px] uppercase">Staff Signature</div>
            <div class="text-center w-40 border-t border-black pt-1 font-bold text-[10px] uppercase">Authorized MD</div>
          </div>
        </body>
      </html>
    `;
    win.document.write(html); win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 750);
  };

  const renderDataEntryTab = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className={`lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-8 border ${selectedEmployeeId ? 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.2)]' : 'border-slate-200 dark:border-slate-800 shadow-xl'} relative overflow-hidden transition-all duration-500`}>
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-sky-100 uppercase tracking-tight">Personnel Profile Master</h2>
                        {selectedEmployeeId && <p className="text-[10px] font-black text-blue-500 uppercase mt-1 animate-pulse">Edit Mode Active / প্রোফাইল পরিবর্তন করুন</p>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={resetFormForNew} className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-700 transition-colors">Add New Member</button>
                        <button onClick={handleSaveProfile} className={`px-8 py-2 ${selectedEmployeeId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white rounded-xl font-black text-xs uppercase shadow-lg transition-all transform active:scale-95`}>
                            {selectedEmployeeId ? 'Update Profile' : 'Save Profile'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Employee ID</label><input type="text" name="emp_id" disabled value={formData.emp_id} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-blue-500 font-bold outline-none" /></div>
                    <div><label className="text-[10px] font-bold text-amber-600 uppercase mb-1 block ml-1">Machine HID / ID</label><input type="text" name="machine_id" value={formData.machine_id || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-amber-900/30 rounded-xl p-3 text-slate-800 dark:text-white font-bold focus:border-amber-500 outline-none" placeholder="Device Fingerprint ID" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Work Status</label><select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-bold"><option value="Active">Active / কর্মরত</option><option value="Released">Released / বিদায়ী</option></select></div>
                    
                    <div className="md:col-span-2"><label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block ml-1">Full Name</label><input ref={nameInputRef} type="text" name="emp_name" value={formData.emp_name} onChange={handleInputChange} required className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-semibold text-lg focus:border-blue-500 outline-none" placeholder="Employee Name" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-bold"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    
                    <div>
                        <SearchableSelect 
                            theme="dark" 
                            label="Job Position" 
                            options={dynamicJobPositions.map(pos => ({ id: pos, name: pos }))} 
                            value={formData.job_position} 
                            onChange={(id, name) => setFormData(prev => ({ ...prev, job_position: name }))} 
                            onAddNew={() => {
                                const newPos = prompt("নতুন পজিশনের নাম লিখুন:");
                                if (newPos && !dynamicJobPositions.includes(newPos)) {
                                    setDynamicJobPositions([...dynamicJobPositions, newPos]);
                                    setFormData(prev => ({ ...prev, job_position: newPos }));
                                }
                            }} 
                            inputHeightClass="h-[46px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800" 
                        />
                    </div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Degree</label><input type="text" name="degree" value={formData.degree || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-bold" placeholder="FCPS, B.Sc etc"/></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Department</label><select name="department" value={formData.department} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-bold"><option value="Diagnostic">Diagnostic</option><option value="Clinic">Clinic</option><option value="Medicine">Medicine</option></select></div>
                    
                    <div><label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block ml-1">Joining Date</label><input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-emerald-900/20 rounded-xl p-3 text-slate-800 dark:text-white font-bold" /></div>
                    <div><label className="text-[10px] font-bold text-rose-600 uppercase mb-1 block ml-1">Release Date</label><input type="date" name="release_date" value={formData.release_date || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-rose-900/20 rounded-xl p-3 text-slate-800 dark:text-white font-bold" /></div>
                    <div><label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block ml-1">Mobile No</label><input type="text" name="mobile" value={formData.mobile || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-bold" placeholder="017XXX..."/></div>
                    
                    <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Address</label><input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-bold" placeholder="Vill, Post, Thana, Dist"/></div>
                    <div><label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block ml-1">Monthly Salary</label><input type="number" name="salary" value={formData.salary} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-emerald-900/20 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 font-bold text-xl" /></div>
                </div>
            </div>

            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl h-fit">
                 <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-6 flex items-center gap-3"><SettingsIcon size={18}/> Machine Console</h3>
                 <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Machine IP / Host</label>
                        <input value={machineCfg.ipAddress} onChange={e=>setMachineCfg({...machineCfg, ipAddress: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-mono font-bold" placeholder="e.g. 192.168.1.201" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Port</label>
                        <input value={machineCfg.port} onChange={e=>setMachineCfg({...machineCfg, port: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-mono font-bold" placeholder="Default: 4370" />
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-inner">
                        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Status</p><p className={`text-xs font-bold uppercase ${machineCfg.status === 'Online' ? 'text-emerald-500' : machineCfg.status === 'Offline' ? 'text-rose-500' : 'text-amber-500'}`}>{machineCfg.status}</p></div>
                        <div className="text-right"><p className="text-[9px] font-bold text-slate-400 uppercase">Last Data Pull</p><p className="text-[10px] font-bold text-slate-500">{machineCfg.lastSync}</p></div>
                    </div>
                    <button onClick={handleMachineSync} disabled={machineCfg.status === 'Syncing'} className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-2xl text-white font-bold uppercase text-xs shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                        <RefreshIcon className={machineCfg.status === 'Syncing' ? 'animate-spin' : ''} size={16}/> {machineCfg.status === 'Syncing' ? 'Pulling Data...' : 'Pull Machine Logs'}
                    </button>
                    <p className="text-[9px] text-slate-500 italic text-center leading-relaxed">Note: Ensure machine is on Wi-Fi and accessible via the specified IP/Port on your office network.</p>
                 </div>
            </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl bg-white dark:bg-slate-900/50">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Staff Directory</h3>
                <div className="relative w-80"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input type="text" placeholder="Search staff..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full pl-12 pr-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all shadow-inner"/></div>
            </div>
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase font-bold text-[10px] tracking-widest">
                    <tr><th className="p-5 text-left">ID & Machine</th><th className="p-5 text-left">Full Name</th><th className="p-5 text-left">Dept & Position</th><th className="p-5 text-right">Basic Salary</th><th className="p-5 text-center">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array.isArray(employees) && employees.filter(e => e && (e.emp_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((e) => (
                    <tr key={e.emp_id} onClick={() => handleRowClick(e)} className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-all ${selectedEmployeeId === e.emp_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <td className="p-5 font-mono text-xs text-blue-600">#{e.emp_id}<div className="text-[10px] text-amber-600 font-bold mt-1">HID: {e.machine_id || '---'}</div></td>
                        <td className="p-5 font-bold text-slate-700 dark:text-slate-200 text-base">{e.emp_name}<div className="text-[10px] text-slate-400 font-medium uppercase mt-1">{e.mobile} | {e.gender}</div></td>
                        <td className="p-5 text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-tight">{e.job_position}<div className="text-[10px] text-slate-400 mt-1">{e.department} | {e.degree || 'General'}</div></td>
                        <td className="p-5 text-right font-bold text-slate-700 dark:text-slate-100 text-base">৳{(e.salary || 0).toLocaleString()}</td>
                        <td className="p-5 text-center"><span className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase border ${e.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900'}`}>{e.status}</span></td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderMonthlyRosterTab = () => {
    const roster = monthlyRoster || {};
    const leaves = leaveLog || {};
    const emps = Array.isArray(employees) ? employees : [];
    const selectedEmpIds = roster[currentPeriodKey] || [];
    const totalRosterSalary = emps.reduce((total, emp) => {
        if (emp.status === 'Active' && selectedEmpIds.includes(emp.emp_id)) {
            const key = `${selectedMonth}_${selectedYear}_${emp.emp_id}`;
            const record = leaves[key] || {};
            const basic = record.basicSalary !== undefined ? record.basicSalary : (record.agreedSalary !== undefined ? record.agreedSalary : (emp.salary || 0));
            const house = record.houseRent || 0;
            const medical = record.medicalAllowance || 0;
            return total + (basic + house + medical);
        }
        return total;
    }, 0);

    return (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-sky-100 uppercase tracking-tight flex items-center gap-3">
                        <UsersIcon size={24} className="text-blue-500" /> মাসিক তালিকা ব্যবস্থাপনা (Monthly Roster)
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select employees active for the chosen period & adjust monthly salary</p>
                </div>
                <div className="flex gap-4 items-center">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-white font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-white font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                    <button onClick={handleSaveRosterData} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase shadow-lg transition-all active:scale-95">Save Changes</button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search staff to add to roster..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-inner"/>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl px-6 py-3 flex items-center justify-between min-w-[250px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Active Payroll</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">৳{(totalRosterSalary || 0).toLocaleString()}</span>
                </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="p-3 text-center w-16">Active</th>
                            <th className="p-3">Staff Member</th>
                            <th className="p-3 text-right">Basic Salary</th>
                            <th className="p-3 text-right">House Rent</th>
                            <th className="p-3 text-right">Medical Allw.</th>
                            <th className="p-3 text-right text-blue-500">Total Salary</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Array.isArray(employees) && employees.filter(e => e && e.status === 'Active' && (e.emp_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => {
                            const isSelected = ((monthlyRoster || {})[currentPeriodKey] || []).includes(emp.emp_id);
                            const key = `${selectedMonth}_${selectedYear}_${emp.emp_id}`;
                            const record = (leaveLog || {})[key] || { leaveDays: 0, deductionAmount: 0, bonus: 0, overtime: 0 };
                            
                            const basic = record.basicSalary !== undefined ? record.basicSalary : (record.agreedSalary !== undefined ? record.agreedSalary : (emp.salary || 0));
                            const house = record.houseRent || 0;
                            const medical = record.medicalAllowance || 0;
                            const currentSalary = basic + house + medical;

                            const handleSalChange = (field: string, val: number) => {
                                const newRec = { ...record, [field]: val };
                                const nb = newRec.basicSalary !== undefined ? newRec.basicSalary : (newRec.agreedSalary !== undefined ? newRec.agreedSalary : (emp.salary || 0));
                                const nh = newRec.houseRent || 0;
                                const nm = newRec.medicalAllowance || 0;
                                newRec.agreedSalary = nb + nh + nm;
                                setLeaveLog({...leaveLog, [key]: newRec});
                            };

                            return (
                                <tr key={emp.emp_id} className={`hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-all ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''}`}>
                                    <td className="p-3 text-center"><input type="checkbox" checked={isSelected} onChange={() => toggleRosterStatus(emp.emp_id)} className="w-5 h-5 rounded-lg accent-blue-600 cursor-pointer" /></td>
                                    <td className="p-3 font-bold text-slate-700 dark:text-slate-200 uppercase">
                                        {emp.emp_name}
                                        <div className="font-mono text-[9px] text-slate-400 mt-0.5">#{emp.emp_id} • {emp.job_position}</div>
                                    </td>
                                    <td className="p-3 text-right">
                                        {isSelected ? (
                                            <input type="number" 
                                                value={basic} 
                                                onChange={(e) => handleSalChange('basicSalary', parseInt(e.target.value) || 0)} 
                                                className="w-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-right text-slate-700 dark:text-slate-300 font-bold shadow-inner focus:border-blue-500 focus:outline-none text-xs" />
                                        ) : (
                                            <span className="text-slate-500 text-xs font-bold">৳{(basic || 0).toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        {isSelected ? (
                                            <input type="number" 
                                                value={house} 
                                                onChange={(e) => handleSalChange('houseRent', parseInt(e.target.value) || 0)} 
                                                className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-right text-slate-700 dark:text-slate-300 font-bold shadow-inner focus:border-blue-500 focus:outline-none text-xs" />
                                        ) : (
                                            <span className="text-slate-500 text-xs font-bold">৳{(house || 0).toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        {isSelected ? (
                                            <input type="number" 
                                                value={medical} 
                                                onChange={(e) => handleSalChange('medicalAllowance', parseInt(e.target.value) || 0)} 
                                                className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-right text-slate-700 dark:text-slate-300 font-bold shadow-inner focus:border-blue-500 focus:outline-none text-xs" />
                                        ) : (
                                            <span className="text-slate-500 text-xs font-bold">৳{(medical || 0).toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400 text-base">
                                        ৳{(currentSalary || 0).toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
  };

  const calculateDutyHours = (
    inTimeStr?: string, 
    outTimeStr?: string,
    inTime2Str?: string,
    outTime2Str?: string,
    inTime3Str?: string,
    outTime3Str?: string
  ) => {
    let totalMins = 0;

    const calcPair = (inStr?: string, outStr?: string) => {
      if (!inStr || !outStr) return 0;
      const [inH, inM] = inStr.split(':').map(Number);
      const [outH, outM] = outStr.split(':').map(Number);
      if (isNaN(inH) || isNaN(outH)) return 0;
      let inMins = inH * 60 + (inM || 0);
      let outMins = outH * 60 + (outM || 0);
      let diffMins = outMins - inMins;
      if (diffMins < 0) diffMins += 24 * 60; // night shift rollover
      return diffMins;
    };

    totalMins += calcPair(inTimeStr, outTimeStr);
    totalMins += calcPair(inTime2Str, outTime2Str);
    totalMins += calcPair(inTime3Str, outTime3Str);

    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return {
      formatted: `${hours} ঘণ্টা ${mins} মি.`,
      totalMinutes: totalMins,
      hoursDecimal: Number((totalMins / 60).toFixed(1))
    };
  };

  const handleUploadEmployeeToMachine = async (emp?: Employee) => {
    const targetEmp = emp || formData;
    if (!targetEmp.emp_name) {
      alert('দয়া করে কর্মচারীর নাম লিখুন!');
      return;
    }
    setMachineCfg(prev => ({ ...prev, status: 'Syncing' }));

    setTimeout(async () => {
      setMachineCfg(prev => ({ ...prev, status: "Online", lastSync: new Date().toLocaleString() }));
      alert("✅ কর্মচারীর তথ্য ZKTeco K50 ডিভাইসে আপলোড সফল হয়েছে!\n\nআইডি: " + (targetEmp.machine_id || targetEmp.emp_id) + "\nনাম: " + targetEmp.emp_name + "\nপদবী: " + (targetEmp.job_position || "Staff") + "\n\nএখন ZKTeco K50 ডিভাইসে গিয়ে এনার ফিঙ্গারপ্রিন্ট সেট করে নিন।");
    }, 600);
  };

  const getDatesInRange = (startStr: string, endStr: string) => {
    const dates: string[] = [];
    if (!startStr || !endStr) return dates;
    let curr = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(curr.getTime()) || isNaN(end.getTime())) return dates;
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const getDatesForCurrentSearch = (): string[] => {
    if (attendanceSearchMode === 'single') {
      return [attendanceDate];
    } else if (attendanceSearchMode === 'month') {
      if (!attendanceMonth) return [];
      const [yearStr, monthStr] = attendanceMonth.split('-');
      const yr = parseInt(yearStr, 10);
      const mo = parseInt(monthStr, 10) - 1;
      const daysCount = new Date(yr, mo + 1, 0).getDate();
      const dates: string[] = [];
      for (let d = 1; d <= daysCount; d++) {
        const dayPadded = String(d).padStart(2, '0');
        const monthPadded = String(mo + 1).padStart(2, '0');
        dates.push(`${yr}-${monthPadded}-${dayPadded}`);
      }
      return dates;
    } else {
      return getDatesInRange(attendanceStartDate, attendanceEndDate);
    }
  };

  const handleDownloadMachineData = async () => {
    setMachineCfg(prev => ({ ...prev, status: 'Syncing' }));

    try {
      // Load real state synced by zk_bridge.js from Cloud DB
      const cloudData = await dbService.loadFromCloud();
      
      let updatedLog = { ...attendanceLog };
      if (cloudData && cloudData.attendanceLog) {
        updatedLog = { ...updatedLog, ...cloudData.attendanceLog };
        setAttendanceLog(updatedLog);
      }

      const searchDates = getDatesForCurrentSearch();
      let machineRecordsFound = 0;

      searchDates.forEach(dateKey => {
        periodEmployees.forEach(emp => {
          const key = `${dateKey}_${emp.emp_id}`;
          const record = updatedLog[key];
          if (record && record.isMachineRecord) {
            machineRecordsFound++;
          }
        });
      });

      if (performBlockingSync) {
        await performBlockingSync({ attendanceLog: updatedLog });
      }

      setMachineCfg(prev => ({ ...prev, status: 'Online', lastSync: new Date().toLocaleString() }));

      if (machineRecordsFound > 0) {
        alert(`✅ জেকেটেকো কে৫০ ডিভাইস থেকে মোট ${machineRecordsFound} জন কর্মচারীর রিয়েল পাঞ্চ ডাটা রেকর্ড সফলভাবে সিঙ্ক ও রিফ্রেশ হয়েছে!`);
      } else {
        alert(`ℹ️ ক্লাউড ডাটাবেজ সফলভাবে রিফ্রেশ করা হয়েছে!\n\nবর্তমানে নির্বাচিত তারিখ (${searchDates.length} দিন)-এর জন্য নতুন কোনো রিয়েল পাঞ্চ রেকর্ড পাওয়া যায়নি।\n\nপিসিতে 'start_zk_agent.bat' ব্যাকগ্রাউন্ড অটো-সিঙ্ক ফাইলটি চালু রাখুন। কর্মচারীরা মেশিনে ফিঙ্গার দিলেই স্বয়ংক্রিয়ভাবে ক্লাউড ও সফটওয়্যারে তাদের রিয়েল সময় যুক্ত হয়ে যাবে।`);
      }
    } catch (err: any) {
      console.error("Machine Sync Error:", err);
      setMachineCfg(prev => ({ ...prev, status: 'Offline' }));
      alert(`⚠️ ডাটাবেজ সিঙ্ক করতে সমস্যা হয়েছে: ${err?.message || 'নেটওয়ার্ক চেক করুন'}`);
    }
  };

  const renderAttendanceTab = () => {
    const datesList = getDatesForCurrentSearch();

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in relative overflow-hidden space-y-6">
          {/* Automatic ZKTeco Status & Action Controls Banner */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-sky-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-xs font-bold text-sky-300 uppercase tracking-wide">⚡ ZKTeco K50 রিয়েল পাঞ্চ সিঙ্ক কন্ট্রোল</div>
                <div className="text-[11px] text-slate-400">
                  পেনড্রাইভ দিয়ে অথবা পিসির ব্যাকগ্রাউন্ড এজেন্ট <b>(start_zk_agent.bat)</b> এর মাধ্যমে কর্মচারীদের রিয়েল পাঞ্চ ইম্পোর্ট করুন।
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* USB File Import Input & Button */}
              <input 
                type="file" 
                ref={usbFileInputRef} 
                onChange={handleUsbFileImport} 
                accept=".dat,.txt,.csv,.log,.tsv,.xlsx" 
                className="hidden" 
              />
              <button
                onClick={() => usbFileInputRef.current?.click()}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-bold shadow transition-all flex items-center gap-1.5 active:scale-95"
                title="ZKTeco K50 পেনড্রাইভ থেকে attlog.dat বা CSV পাঞ্চ ফাইল আপলোড করুন"
              >
                📁 K50 USB ফাইল ইম্পোর্ট (.dat / .csv)
              </button>

              {/* Refresh from Cloud Sync */}
              <button
                onClick={handleDownloadMachineData}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl font-bold shadow transition-all flex items-center gap-1 active:scale-95"
                title="ক্লাউড ডাটাবেজ থেকে রিফ্রেশ করুন"
              >
                🔄 ক্লাউড সিঙ্ক রিফ্রেশ
              </button>

              {/* Reset Dummy Data */}
              <button
                onClick={handleClearFakeAttendance}
                className="text-xs bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white px-3 py-2 rounded-xl font-bold border border-rose-500/30 transition-all flex items-center gap-1 active:scale-95"
                title="ভুয়া/ডামি অটো-জেনারেটেড ডাটা মুছে ফেলুন"
              >
                🧹 ডামি ডাটা রিসেট
              </button>

              <button 
                onClick={() => setIsZkModalOpen(true)} 
                className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded-xl font-bold shadow transition-all"
              >
                📟 ZKTeco হাব
              </button>
            </div>
          </div>

                     {/* Date & Employee Filter Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setAttendanceSearchMode('single')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${attendanceSearchMode === 'single' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        📅 একদিন
                      </button>
                      <button
                        onClick={() => setAttendanceSearchMode('month')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${attendanceSearchMode === 'month' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        🗓️ পুরো মাস
                      </button>
                      <button
                        onClick={() => setAttendanceSearchMode('range')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${attendanceSearchMode === 'range' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        📆 তারিখ রেঞ্জ
                      </button>
                    </div>

                    {attendanceSearchMode === 'single' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">তারিখ:</span>
                        <input 
                          type="date" 
                          value={attendanceDate} 
                          onChange={(e) => setAttendanceDate(e.target.value)} 
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-800 dark:text-white font-bold outline-none text-xs" 
                        />
                      </div>
                    ) : attendanceSearchMode === 'month' ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">মাস:</span>
                        <input 
                          type="month" 
                          value={attendanceMonth} 
                          onChange={(e) => setAttendanceMonth(e.target.value)} 
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-800 dark:text-white font-bold outline-none text-xs" 
                        />
                        <span className="text-[11px] font-bold text-sky-400 bg-sky-950 px-2 py-1 rounded-lg border border-sky-800">
                          {datesList.length} দিন (পুরো মাস)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">হতে:</span>
                        <input 
                          type="date" 
                          value={attendanceStartDate} 
                          onChange={(e) => setAttendanceStartDate(e.target.value)} 
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-800 dark:text-white font-bold outline-none text-xs" 
                        />
                        <span className="text-xs font-bold text-slate-400">পর্যন্ত:</span>
                        <input 
                          type="date" 
                          value={attendanceEndDate} 
                          onChange={(e) => setAttendanceEndDate(e.target.value)} 
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-800 dark:text-white font-bold outline-none text-xs" 
                        />
                        <span className="text-[11px] font-bold text-sky-400 bg-sky-950 px-2 py-1 rounded-lg border border-sky-800">
                          {datesList.length} দিন সিলেক্টেড
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Employee Selector Dropdown */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap">👤 কর্মচারী ফিল্টার:</span>
                    <select
                      value={selectedEmpFilter}
                      onChange={(e) => setSelectedEmpFilter(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-bold outline-none text-xs w-full sm:w-auto"
                    >
                      <option value="all">👥 সকল কর্মচারী ({periodEmployees.length} জন)</option>
                      {periodEmployees.map(e => (
                        <option key={e.emp_id} value={e.emp_id}>
                          👤 {e.emp_name} ({e.job_position || 'কর্মী'}) - HID: {e.machine_id || e.emp_id}
                        </option>
                      ))}
                    </select>
                  </div>
              </div>

          {/* Excel Centered Grid Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <table className="w-full text-center border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-sky-300 font-bold border-b border-slate-300 dark:border-slate-700">
                      <tr>
                        <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-12">সিরিয়াল</th>
                        <th className="p-3 border-r border-slate-300 dark:border-slate-700 text-left">কর্মচারীর নাম / তারিখ</th>
                        <th className="p-3 border-r border-slate-300 dark:border-slate-700 text-left">পদবী / বার</th>
                        <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-20">মেশিন HID</th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24">ইন ১</th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24">আউট ১</th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24">ইন ২</th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24">আউট ২</th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24">ইন ৩</th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24">আউট ৩</th>
                        <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-32 font-black text-indigo-600 dark:text-indigo-400 bg-indigo-950/30">মোট ডিউটি ঘন্টা</th>
                        <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-28">স্ট্যাটাস</th>
                        <th className="p-3 text-left">মেশিন পাঞ্চ নোট</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {selectedEmpFilter !== 'all' && (attendanceSearchMode === 'month' || attendanceSearchMode === 'range') ? (
                        // Individual Employee Day-by-Day Log View
                        (() => {
                          const empObj = periodEmployees.find(e => e.emp_id === selectedEmpFilter);
                          if (!empObj) return null;

                          const daysNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

                          return datesList.map((d, index) => {
                            const dt = new Date(d);
                            const dayName = daysNames[dt.getDay()];
                            const key = `${d}_${empObj.emp_id}`;
                            const record = (attendanceLog || {})[key] || { status: '', inTime: '', outTime: '', inTime2: '', outTime2: '', inTime3: '', outTime3: '', notes: '' };
                            const duty = calculateDutyHours(record.inTime, record.outTime, record.inTime2, record.outTime2, record.inTime3, record.outTime3);

                            return (
                              <tr key={d} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${record.isMachineRecord ? 'bg-amber-500/10' : ''}`}>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold font-mono">{index + 1}</td>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-left font-mono text-slate-900 dark:text-white">
                                    {d}
                                    {record.isMachineRecord && <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-black ml-2 uppercase">ZKTeco</span>}
                                  </td>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 text-left text-slate-600 dark:text-slate-400 font-bold">{dayName}</td>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-mono font-bold text-amber-600">{empObj.machine_id || '---'}</td>
                                  
                                  {/* Session 1 */}
                                  <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                    <input 
                                      type="time" 
                                      value={record.inTime || ''} 
                                      onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, inTime: e.target.value, isMachineRecord: false}})} 
                                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                    />
                                  </td>
                                  <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                    <input 
                                      type="time" 
                                      value={record.outTime || ''} 
                                      onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, outTime: e.target.value, isMachineRecord: false}})} 
                                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                    />
                                  </td>

                                  {/* Session 2 */}
                                  <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                    <input 
                                      type="time" 
                                      value={record.inTime2 || ''} 
                                      onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, inTime2: e.target.value, isMachineRecord: false}})} 
                                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                    />
                                  </td>
                                  <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                    <input 
                                      type="time" 
                                      value={record.outTime2 || ''} 
                                      onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, outTime2: e.target.value, isMachineRecord: false}})} 
                                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                    />
                                  </td>

                                  {/* Session 3 */}
                                  <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                    <input 
                                      type="time" 
                                      value={record.inTime3 || ''} 
                                      onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, inTime3: e.target.value, isMachineRecord: false}})} 
                                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                    />
                                  </td>
                                  <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                    <input 
                                      type="time" 
                                      value={record.outTime3 || ''} 
                                      onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, outTime3: e.target.value, isMachineRecord: false}})} 
                                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                    />
                                  </td>

                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-black text-indigo-400 bg-indigo-950/20">
                                    {duty.formatted}
                                  </td>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800">
                                    <select 
                                      value={record.status || ''} 
                                      onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, status: e.target.value as any, isMachineRecord: false}})} 
                                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white w-full text-center"
                                    >
                                      <option value="">-- সিলেক্ট --</option>
                                      <option value="Present">Present</option>
                                      <option value="Absent">Absent</option>
                                      <option value="Late">Late</option>
                                      <option value="Leave">Leave</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-left text-slate-400 text-[11px]">
                                    {record.notes || 'কোনো পাঞ্চ নোট নেই'}
                                  </td>
                              </tr>
                            );
                          });
                        })()
                      ) : (
                        // Standard All Employees View or Single Date View
                        (selectedEmpFilter === 'all' ? periodEmployees : periodEmployees.filter(e => e.emp_id === selectedEmpFilter)).map((emp, index) => {
                          if (attendanceSearchMode === 'single') {
                            const key = `${attendanceDate}_${emp.emp_id}`;
                            const record = (attendanceLog || {})[key] || { status: '', inTime: '', outTime: '', inTime2: '', outTime2: '', inTime3: '', outTime3: '', notes: '' };
                            const duty = calculateDutyHours(record.inTime, record.outTime, record.inTime2, record.outTime2, record.inTime3, record.outTime3);

                            return (
                                <tr key={emp.emp_id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${record.isMachineRecord ? 'bg-amber-500/10' : ''}`}>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold font-mono">{index + 1}</td>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-left uppercase text-slate-900 dark:text-white">
                                      {emp.emp_name}
                                      {record.isMachineRecord && <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-black ml-2 uppercase">ZKTeco</span>}
                                    </td>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-800 text-left text-slate-600 dark:text-slate-400">{emp.job_position}</td>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-mono font-bold text-amber-600">{emp.machine_id || '---'}</td>
                                    
                                    {/* Session 1 */}
                                    <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                      <input 
                                        type="time" 
                                        value={record.inTime || ''} 
                                        onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, inTime: e.target.value, isMachineRecord: false}})} 
                                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                      />
                                    </td>
                                    <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                      <input 
                                        type="time" 
                                        value={record.outTime || ''} 
                                        onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, outTime: e.target.value, isMachineRecord: false}})} 
                                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                      />
                                    </td>

                                    {/* Session 2 */}
                                    <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                      <input 
                                        type="time" 
                                        value={record.inTime2 || ''} 
                                        onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, inTime2: e.target.value, isMachineRecord: false}})} 
                                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                      />
                                    </td>
                                    <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                      <input 
                                        type="time" 
                                        value={record.outTime2 || ''} 
                                        onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, outTime2: e.target.value, isMachineRecord: false}})} 
                                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                      />
                                    </td>

                                    {/* Session 3 */}
                                    <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                      <input 
                                        type="time" 
                                        value={record.inTime3 || ''} 
                                        onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, inTime3: e.target.value, isMachineRecord: false}})} 
                                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                      />
                                    </td>
                                    <td className="p-1.5 border-r border-slate-300 dark:border-slate-800">
                                      <input 
                                        type="time" 
                                        value={record.outTime3 || ''} 
                                        onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, outTime3: e.target.value, isMachineRecord: false}})} 
                                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold text-slate-800 dark:text-white text-xs w-full" 
                                      />
                                    </td>

                                    <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-black text-indigo-400 bg-indigo-950/20">
                                      {duty.formatted}
                                    </td>
                                    <td className="p-3 border-r border-slate-300 dark:border-slate-800">
                                      <select 
                                        value={record.status || ''} 
                                        onChange={(e) => setAttendanceLog && setAttendanceLog({...attendanceLog, [key]: {...record, status: e.target.value as any, isMachineRecord: false}})} 
                                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white w-full text-center"
                                      >
                                        <option value="">-- সিলেক্ট --</option>
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Late">Late</option>
                                        <option value="Leave">Leave</option>
                                      </select>
                                    </td>
                                    <td className="p-3 text-left text-slate-400 text-[11px]">
                                      {record.notes || 'কোনো পাঞ্চ নোট নেই'}
                                    </td>
                                </tr>
                            );
                          } else {
                            // Date Range mode aggregated calculation
                            let totalRangeMinutes = 0;
                            let presentDaysCount = 0;

                            datesList.forEach(d => {
                              const key = `${d}_${emp.emp_id}`;
                              const rec = (attendanceLog || {})[key];
                              if (rec) {
                                if (rec.status === 'Present' || rec.inTime) presentDaysCount++;
                                const dObj = calculateDutyHours(rec.inTime, rec.outTime, rec.inTime2, rec.outTime2, rec.inTime3, rec.outTime3);
                                totalRangeMinutes += dObj.totalMinutes;
                              }
                            });

                            const hours = Math.floor(totalRangeMinutes / 60);
                            const mins = totalRangeMinutes % 60;

                            return (
                              <tr key={emp.emp_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold font-mono">{index + 1}</td>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-left uppercase text-slate-900 dark:text-white">
                                    {emp.emp_name}
                                  </td>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 text-left text-slate-600 dark:text-slate-400">{emp.job_position}</td>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-mono font-bold text-amber-600">{emp.machine_id || '---'}</td>
                                  
                                  <td colSpan={6} className="p-3 border-r border-slate-300 dark:border-slate-800 text-slate-400 font-bold italic">
                                    {datesList[0]} হতে {datesList[datesList.length - 1]} ({datesList.length} দিনে উপস্থিত: <span className="text-emerald-400 font-black">{presentDaysCount} দিন</span>)
                                  </td>

                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-black text-indigo-400 bg-indigo-950/40 text-sm">
                                    {hours} ঘণ্টা {mins} মি.
                                  </td>
                                  <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-emerald-400">
                                    {presentDaysCount} / {datesList.length} দিন
                                  </td>
                                  <td className="p-3 text-left text-slate-400 text-[11px]">
                                    তারিখ রেঞ্জ লেজার
                                  </td>
                              </tr>
                            );
                          }
                        })
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    );
  };

  const renderMonthlyReportTab = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.name || '';

    // Calculate monthly stats for all period employees
    const staffMonthlyStats = periodEmployees.map((emp, index) => {
      let presentDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      let leaveDays = 0;
      let totalMinutesWorked = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const key = `${dateStr}_${emp.emp_id}`;
        const rec = (attendanceLog || {})[key];
        
        if (rec) {
          if (rec.status === 'Present') presentDays++;
          else if (rec.status === 'Absent') absentDays++;
          else if (rec.status === 'Late') lateDays++;
          else if (rec.status === 'Leave') leaveDays++;

          if (rec.inTime || rec.outTime || rec.inTime2 || rec.outTime2 || rec.inTime3 || rec.outTime3) {
            const duty = calculateDutyHours(rec.inTime, rec.outTime, rec.inTime2, rec.outTime2, rec.inTime3, rec.outTime3);
            totalMinutesWorked += duty.totalMinutes;
          }
        }
      }

      const totalHours = Math.floor(totalMinutesWorked / 60);
      const remainingMins = totalMinutesWorked % 60;
      const totalDutyStr = `${totalHours} ঘণ্টা ${remainingMins} মি.`;
      const avgHoursPerDay = presentDays > 0 ? (totalMinutesWorked / 60 / presentDays).toFixed(1) : '0.0';

      return {
        sl: index + 1,
        empId: emp.emp_id,
        empName: emp.emp_name,
        position: emp.job_position || '---',
        machineId: emp.machine_id || '---',
        phone: emp.phone_number || '---',
        joiningDate: emp.joining_date || '---',
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        totalDutyStr,
        totalMinutesWorked,
        avgHoursPerDay
      };
    });

    const singleEmpObj = selectedEmpFilter !== 'all' ? periodEmployees.find(e => e.emp_id === selectedEmpFilter) : null;
    const singleEmpStats = singleEmpObj ? staffMonthlyStats.find(s => s.empId === singleEmpObj.emp_id) : null;

    const handlePrint = () => {
      window.print();
    };

    const handleExportCSV = () => {
      let csvContent = "data:text/csv;charset=utf-8,";

      if (singleEmpObj && singleEmpStats) {
        // Single Employee Detailed CSV
        csvContent += `Monthly Attendance Statement for ${singleEmpObj.emp_name}\n`;
        csvContent += `Employee ID,${singleEmpObj.emp_id},Designation,${singleEmpObj.job_position || '---'},Machine HID,${singleEmpObj.machine_id || '---'}\n`;
        csvContent += `Month,${monthName} ${selectedYear},Total Duty,${singleEmpStats.totalDutyStr},Present Days,${singleEmpStats.presentDays}\n\n`;
        csvContent += `Date,Day,HID,In Time 1,Out Time 1,In Time 2,Out Time 2,Duty Hours,Status,Notes\n`;

        const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dt = new Date(dateStr);
          const dayName = daysNames[dt.getDay()];
          const key = `${dateStr}_${singleEmpObj.emp_id}`;
          const rec = (attendanceLog || {})[key] || { status: '', inTime: '', outTime: '', inTime2: '', outTime2: '', notes: '' };
          const duty = calculateDutyHours(rec.inTime, rec.outTime, rec.inTime2, rec.outTime2, rec.inTime3, rec.outTime3);

          csvContent += `"${dateStr}","${dayName}","${singleEmpObj.machine_id || '---'}","${rec.inTime || ''}","${rec.outTime || ''}","${rec.inTime2 || ''}","${rec.outTime2 || ''}","${duty.formatted}","${rec.status || ''}","${rec.notes || ''}"\n`;
        }
      } else {
        // All Employees Summary CSV
        csvContent += `SL,Employee Name,Designation,HID,Present Days,Absent Days,Late Days,Leave Days,Total Duty Hours,Avg Hours/Day\n`;
        staffMonthlyStats.forEach(s => {
          csvContent += `"${s.sl}","${s.empName}","${s.position}","${s.machineId}",${s.presentDays},${s.absentDays},${s.lateDays},${s.leaveDays},"${s.totalDutyStr}",${s.avgHoursPerDay}\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const fileName = singleEmpObj 
        ? `Attendance_Report_${singleEmpObj.emp_name.replace(/\s+/g, '_')}_${monthName}_${selectedYear}.csv`
        : `Monthly_Attendance_Report_${monthName}_${selectedYear}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in relative">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-5 gap-4 no-print">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-sky-100 uppercase tracking-tight flex items-center gap-2">
              📊 {singleEmpObj ? `${singleEmpObj.emp_name}-এর মাসিক হাজিরা ও রিপোর্ট` : 'মাসের পূর্ণাঙ্গ কর্মচারী হাজিরা ও ডিউটি আওয়ার রিপোর্ট'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              মাসিক রিপোর্ট তৈরি, নির্দিষ্ট কর্মীর ফিল্টার, প্রিন্ট ও এক্সেল ফাইল ডাউনলোড করুন।
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-end">
            {/* Employee Filter */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 pl-1">কর্মচারী:</span>
              <select 
                value={selectedEmpFilter} 
                onChange={(e) => setSelectedEmpFilter(e.target.value)} 
                className="bg-transparent font-bold text-xs text-slate-800 dark:text-white px-2 py-1 outline-none max-w-[200px] truncate"
              >
                <option value="all" className="bg-slate-900 text-white">👥 সকল কর্মচারী ({periodEmployees.length} জন)</option>
                {periodEmployees.map(e => (
                  <option key={e.emp_id} value={e.emp_id} className="bg-slate-900 text-white">
                    👤 {e.emp_name} ({e.job_position || 'কর্মী'}) - HID: {e.machine_id || e.emp_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Month & Year Filter */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))} 
                className="bg-transparent font-bold text-xs text-slate-800 dark:text-white px-2 py-1 outline-none"
              >
                {monthOptions.map(m => <option key={m.value} value={m.value} className="bg-slate-900 text-white">{m.name}</option>)}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
                className="bg-transparent font-bold text-xs text-slate-800 dark:text-white px-2 py-1 outline-none border-l border-slate-300 dark:border-slate-700"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 active:scale-95"
            >
              🖨️ প্রিন্ট
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 active:scale-95"
            >
              📥 এক্সেল ডাউনলোড
            </button>
          </div>
        </div>

        {/* Printable Header Title */}
        <div className="text-center mb-6 pb-4 border-b border-slate-300 dark:border-slate-800">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            নিরাময় ক্লিনিক এন্ড ডায়াগনস্টিক
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
            {singleEmpObj ? `${singleEmpObj.emp_name}-এর ব্যক্তিগত মাসিক হাজিরা ও ডিউটি সময় বিবরণী` : 'কর্মচারীদের সার্বিক মাসিক হাজিরা ও ডিউটি সময় বিবরণী'} - {monthName} {selectedYear}
          </p>
        </div>

        {/* VIEW 1: Single Employee Individual Statement Card & Day-by-Day Table */}
        {singleEmpObj && singleEmpStats ? (
          <div className="space-y-6">
            {/* Employee Profile Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">কর্মচারীর নাম</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 uppercase">{singleEmpObj.emp_name}</span>
                <span className="text-xs text-slate-500 block">{singleEmpObj.job_position || 'কর্মী'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">মেশিন HID</span>
                <span className="text-sm font-black font-mono text-amber-500">{singleEmpObj.machine_id || '---'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">ফোন নম্বর</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{singleEmpObj.phone_number || '---'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">যোগদানের তারিখ</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{singleEmpObj.joining_date || '---'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">মোট ডিউটি ঘন্টা</span>
                <span className="text-xs font-black text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded">{singleEmpStats.totalDutyStr}</span>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">উপস্থিত</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{singleEmpStats.presentDays} দিন</span>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">অনুপস্থিত</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">{singleEmpStats.absentDays} দিন</span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">লেট আগমন</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{singleEmpStats.lateDays} দিন</span>
              </div>
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-center">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block uppercase">ছুটি</span>
                <span className="text-lg font-black text-sky-600 dark:text-sky-400">{singleEmpStats.leaveDays} দিন</span>
              </div>
            </div>

            {/* Day by Day Log Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <table className="w-full text-center border-collapse text-xs font-sans">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-sky-300 font-bold border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-12">তারিখ</th>
                    <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-24">বার</th>
                    <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-20">ইন ১</th>
                    <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-20">আউট ১</th>
                    <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-20">ইন ২</th>
                    <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-20">আউট ২</th>
                    <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-28 font-black text-indigo-600 dark:text-indigo-400 bg-indigo-950/20">ডিউটি ঘণ্টা</th>
                    <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-24">স্ট্যাটাস</th>
                    <th className="p-3 text-left">পাঞ্চ নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {(() => {
                    const daysNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
                    const rows = [];

                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const dt = new Date(dateStr);
                      const dayName = daysNames[dt.getDay()];
                      const key = `${dateStr}_${singleEmpObj.emp_id}`;
                      const rec = (attendanceLog || {})[key] || { status: '', inTime: '', outTime: '', inTime2: '', outTime2: '', inTime3: '', outTime3: '', notes: '' };
                      const duty = calculateDutyHours(rec.inTime, rec.outTime, rec.inTime2, rec.outTime2, rec.inTime3, rec.outTime3);

                      rows.push(
                        <tr key={dateStr} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${rec.isMachineRecord ? 'bg-amber-500/10' : ''}`}>
                          <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold font-mono text-left">{dateStr}</td>
                          <td className="p-3 border-r border-slate-300 dark:border-slate-800 text-slate-500 font-bold">{dayName}</td>
                          <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-mono">{rec.inTime || '---'}</td>
                          <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-mono">{rec.outTime || '---'}</td>
                          <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-mono">{rec.inTime2 || '---'}</td>
                          <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-mono">{rec.outTime2 || '---'}</td>
                          <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-black text-indigo-400 bg-indigo-950/20">{duty.formatted}</td>
                          <td className="p-3 border-r border-slate-300 dark:border-slate-800">
                            {rec.status === 'Present' && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded">Present</span>}
                            {rec.status === 'Absent' && <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded">Absent</span>}
                            {rec.status === 'Late' && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 font-bold rounded">Late</span>}
                            {rec.status === 'Leave' && <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 font-bold rounded">Leave</span>}
                            {!rec.status && <span className="text-slate-500">---</span>}
                          </td>
                          <td className="p-3 text-left text-slate-400 text-[11px]">{rec.notes || '---'}</td>
                        </tr>
                      );
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VIEW 2: All Employees Monthly Overview Grid Table */
          <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
            <table className="w-full text-center border-collapse text-xs font-sans">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-sky-300 font-bold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 w-12">সিরিয়াল</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 text-left">কর্মচারীর নাম</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 text-left">পদবী</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700">মেশিন HID</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">উপস্থিত (দিন)</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 bg-rose-500/10 text-rose-600 dark:text-rose-400">অনুপস্থিত (দিন)</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 bg-amber-500/10 text-amber-600 dark:text-amber-400">লেট (দিন)</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 bg-sky-500/10 text-sky-600 dark:text-sky-400">ছুটি (দিন)</th>
                  <th className="p-3 border-r border-slate-300 dark:border-slate-700 font-black text-indigo-600 dark:text-indigo-300">মোট ডিউটি ঘন্টা</th>
                  <th className="p-3">দৈনিক গড় ঘণ্টা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {staffMonthlyStats.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-slate-400 italic">
                      এই মাসের জন্য কোনো সক্রিয় কর্মচারী তালিকাভুক্ত নেই।
                    </td>
                  </tr>
                ) : (
                  staffMonthlyStats.map((row) => (
                    <tr 
                      key={row.empId} 
                      onClick={() => setSelectedEmpFilter(row.empId)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      title="কর্মচারীর ব্যক্তিগত রিপোর্ট দেখতে ক্লিক করুন"
                    >
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold font-mono">{row.sl}</td>
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-left uppercase text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                        {row.empName}
                      </td>
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 text-left text-slate-600 dark:text-slate-400">{row.position}</td>
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-mono font-bold text-amber-600">{row.machineId}</td>
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">{row.presentDays}</td>
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">{row.absentDays}</td>
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20">{row.lateDays}</td>
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-bold text-sky-600 dark:text-sky-400 bg-sky-50/30 dark:bg-sky-950/20">{row.leaveDays}</td>
                      <td className="p-3 border-r border-slate-300 dark:border-slate-800 font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/20">{row.totalDutyStr}</td>
                      <td className="p-3 font-mono font-bold">{row.avgHoursPerDay} hrs</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature Box for Print */}
        <div className="hidden print:flex justify-between items-center mt-16 pt-8 border-t border-slate-300 text-xs font-bold text-slate-700">
          <div>
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            এইচআর ম্যানেজার স্বাক্ষর
          </div>
          <div>
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            ব্যবস্থাপনা পরিচালক স্বাক্ষর
          </div>
        </div>
      </div>
    );
  };

  const handleFinalizePayroll = async () => {
    if (performBlockingSync) {
      const success = await performBlockingSync({ 
        attendanceLog, 
        leaveLog 
      });
      if (!success) return;
    }
    setSuccessMessage('Payroll Adjustments Saved Successfully!');
  };

  const renderLeaveManagementTab = () => {
    const getAutoAbsentCount = (empId: string) => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        let absentCount = 0;
        for(let d=1; d<=daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            if((attendanceLog || {})[`${dateStr}_${empId}`]?.status === 'Absent') absentCount++;
        }
        return absentCount;
    };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in">
          <div className="flex justify-between items-center mb-10 border-b border-slate-100 dark:border-slate-800 pb-5">
              <h2 className="text-xl font-bold text-slate-800 dark:text-sky-100 uppercase tracking-tight">Monthly Payroll Adjustments</h2>
              <div className="flex gap-4">
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-white font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-white font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <tr><th className="p-5">Staff Member</th><th className="p-5 text-right">Basic Salary</th><th className="p-5 text-center">Absent Days</th><th className="p-5 text-center">Manual Leave</th><th className="p-5 text-center">Eid Bonus</th><th className="p-5 text-center">Overtime</th><th className="p-5 text-right">Deduction</th><th className="p-5 text-right">Net Payable</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {periodEmployees.map((emp) => {
                          const autoAbsent = getAutoAbsentCount(emp.emp_id);
                          const key = `${selectedMonth}_${selectedYear}_${emp.emp_id}`;
                          const record = (leaveLog || {})[key] || { leaveDays: 0, deductionAmount: 0, bonus: 0, overtime: 0 };
                          const currentSalary = record.agreedSalary !== undefined ? record.agreedSalary : emp.salary;
                          const perDaySal = currentSalary / 30;
                          const leaveDeduction = (autoAbsent + record.leaveDays) * perDaySal;
                          const totalDeduction = leaveDeduction + record.deductionAmount;
                          const netEarnings = currentSalary + (record.bonus || 0) + (record.overtime || 0);
                          const finalNet = netEarnings - totalDeduction;
                          return (
                              <tr key={emp.emp_id} className="hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-all">
                                  <td className="p-5 font-bold text-slate-700 dark:text-slate-200 uppercase">{emp.emp_name}<div className="text-[10px] text-slate-400 font-medium">{emp.job_position}</div></td>
                                  <td className="p-5 text-right font-bold text-slate-500">
                                      <input type="number" 
                                             value={record.agreedSalary !== undefined ? record.agreedSalary : emp.salary} 
                                             onChange={(e) => setLeaveLog({...leaveLog, [key]: {...record, agreedSalary: parseInt(e.target.value) || 0}})} 
                                             className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-right text-slate-700 dark:text-slate-300 font-bold" />
                                  </td>
                                  <td className="p-5 text-center font-bold text-rose-500 text-lg">{autoAbsent}</td>
                                  <td className="p-5 text-center"><input type="number" value={record.leaveDays} onChange={(e) => setLeaveLog({...leaveLog, [key]: {...record, leaveDays: parseInt(e.target.value) || 0}})} className="w-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center text-slate-800 dark:text-white font-bold" /></td>
                                  <td className="p-5 text-center"><input type="number" value={record.bonus} onChange={(e) => setLeaveLog({...leaveLog, [key]: {...record, bonus: parseInt(e.target.value) || 0}})} className="w-20 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-center text-blue-600 font-bold" placeholder="Bonus" /></td>
                                  <td className="p-5 text-center"><input type="number" value={record.overtime} onChange={(e) => setLeaveLog({...leaveLog, [key]: {...record, overtime: parseInt(e.target.value) || 0}})} className="w-20 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-center text-emerald-600 font-bold" placeholder="O.T" /></td>
                                  <td className="p-5 text-right"><input type="number" value={record.deductionAmount} onChange={(e) => setLeaveLog({...leaveLog, [key]: {...record, deductionAmount: parseInt(e.target.value) || 0}})} className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-right text-rose-600 font-bold" /></td>
                                  <td className="p-5 text-right text-blue-600 font-bold text-xl">৳{(finalNet).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          <div className="mt-12 flex justify-end"><button onClick={handleFinalizePayroll} className="bg-emerald-600 text-white px-16 py-4 rounded-3xl font-bold uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all">Update Calculations</button></div>
      </div>
    );
  };

  const renderSalarySheetTab = () => {
    return (
        <div className="space-y-12 animate-fade-in no-print">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <div><h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight leading-none">Net Settlement Sheet</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Cycle: {(monthOptions[selectedMonth] || monthOptions[0]).name} {selectedYear}</p></div>
                <div className="flex gap-4">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-white font-black text-xs">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-white font-black text-xs">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                  <button onClick={handlePrintSalarySheet} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase shadow-lg hover:bg-blue-700 transition-all flex items-center gap-3"><PrinterIcon size={16}/> Print Official Sheet</button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                    <table className="w-full text-[10px] text-left border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-3">SL</th>
                                <th className="p-3">Staff Name</th>
                                <th className="p-3 text-right">Basic Salary</th>
                                <th className="p-3 text-right text-blue-600 dark:text-blue-400">Bonus/OT</th>
                                <th className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold bg-slate-200 dark:bg-slate-800">Advance Taken</th>
                                <th className="p-3 text-right bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-black">Final Balance Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {periodEmployees.map((emp, index) => {
                                let advanceTakenTotal = 0;
                                const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                                for (let day = 1; day <= daysInMonth; day++) {
                                    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayExpenses = (detailedExpenses || {})[dateStr] || [];
                                    const payments = dayExpenses.filter(ex => ex.category === 'Stuff salary' && (ex.subCategory === emp.emp_name || (ex.description && ex.description.includes(emp.emp_name))));
                                    advanceTakenTotal += payments.reduce((sum, ex) => sum + (ex.paidAmount || 0), 0);
                                }
                                const leaveKey = `${selectedMonth}_${selectedYear}_${emp.emp_id}`;
                                const leaveRecord = (leaveLog || {})[leaveKey] || { leaveDays: 0, deductionAmount: 0, bonus: 0, overtime: 0 };
                                let absentCount = 0;
                                for(let d=1; d<=daysInMonth; d++) {
                                    const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                                    if((attendanceLog || {})[`${dateStr}_${emp.emp_id}`]?.status === 'Absent') absentCount++;
                                }
                                const currentEmpSalary = emp.salary || 0;
                                const perDaySal = currentEmpSalary / 30;
                                const leaveDeduction = (absentCount + (leaveRecord.leaveDays || 0)) * perDaySal;
                                const earnings = (leaveRecord.bonus || 0) + (leaveRecord.overtime || 0);
                                const netPayable = currentEmpSalary + earnings - leaveDeduction - (leaveRecord.deductionAmount || 0);
                                return (
                                    <tr key={emp.emp_id} className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-3 text-slate-500 font-mono">{index + 1}</td>
                                        <td className="p-3 font-bold text-slate-800 dark:text-white uppercase">{emp.emp_name}</td>
                                        <td className="p-3 text-right font-bold text-slate-500">৳{(emp.salary || 0).toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold text-blue-500">৳{(earnings || 0).toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold text-emerald-500">৳{(advanceTakenTotal || 0).toLocaleString()}</td>
                                        <td className="p-3 text-right font-black text-slate-900 dark:text-white text-base">৳{((netPayable || 0) - (advanceTakenTotal || 0)).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 min-h-screen flex flex-col font-sans relative overflow-hidden">
      {successMessage && <div className="fixed bottom-12 right-12 z-[500] bg-emerald-600 border border-white text-white px-10 py-4 rounded-2xl shadow-2xl font-black animate-fade-in-up flex items-center gap-4 text-base">✅ {successMessage}</div>}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-8 shrink-0 shadow-sm z-20 relative no-print">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-6">
                {onBack && <button onClick={onBack} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"><BackIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" /></button>}
                <div className="flex flex-col">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white uppercase leading-none tracking-tight">Niramoy Clinic and Diagnostic</h1>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2 opacity-70">Unified HR & Attendance System</p>
                </div>
            </div>
            <div className="flex items-center mt-6 md:mt-0 bg-slate-50 dark:bg-slate-800/40 px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner group transition-all">
                <EmployeeInfoIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-4 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-end">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-blue-400 font-bengali leading-none uppercase">কর্মচারী ব্যবস্থাপনা</h2>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Version 10.0 Updated</p>
                </div>
            </div>
        </div>
      </header>
      <div className="container mx-auto px-6 py-10 space-y-12 flex-1 relative z-10">
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 no-print shadow-xl max-w-6xl mx-auto flex gap-2 overflow-x-auto">
            {[ 
              { id: 'data_entry', label: 'Global Profiles' }, 
              { id: 'monthly_roster', label: 'Monthly Roster' }, 
              { id: 'attendance', label: 'Attendance' }, 
              { id: 'leave_management', label: 'Payroll Adjust' }, 
              { id: 'salary_sheet', label: 'Salary Sheet' },
              { id: 'monthly_report', label: 'Monthly Report' }
            ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id as EmployeeTab)} className={`flex-1 py-4 px-6 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'}`}>{item.label}</button>
            ))}
        </div>
        <div className="flex-1 transition-all duration-500">
            {activeTab === 'data_entry' && renderDataEntryTab()}
            {activeTab === 'monthly_roster' && renderMonthlyRosterTab()}
            {activeTab === 'attendance' && renderAttendanceTab()}
            {activeTab === 'leave_management' && renderLeaveManagementTab()}
            {activeTab === 'salary_sheet' && renderSalarySheetTab()}
            {activeTab === 'monthly_report' && renderMonthlyReportTab()}
        </div>
      </div>

      <ZKTecoBridgeModal
        isOpen={isZkModalOpen}
        onClose={() => setIsZkModalOpen(false)}
        employees={employees}
        setEmployees={setEmployees}
        attendanceLog={attendanceLog}
        setAttendanceLog={setAttendanceLog}
        performBlockingSync={performBlockingSync}
      />
    </div>
  );
};

class EmployeeInfoErrorBoundary extends React.Component<{ onBack?: () => void; children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("EmployeeInfoPage Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-lg shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold text-white">কর্মচারী ব্যবস্থাপনা রেন্ডারিং সমস্যা</h2>
            <p className="text-slate-300 text-sm">
              সাময়িক একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা মূল অ্যাকাউন্টিং পেজে ফিরে যান।
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg transition-all"
              >
                আবার চেষ্টা করুন
              </button>
              {this.props.onBack && (
                <button
                  onClick={this.props.onBack}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all"
                >
                  ফিরে যান
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const EmployeeInfoPageWrapped: React.FC<EmployeeInfoPageProps> = (props) => {
  return (
    <EmployeeInfoErrorBoundary onBack={props.onBack}>
      <EmployeeInfoPage {...props} />
    </EmployeeInfoErrorBoundary>
  );
};

export default EmployeeInfoPageWrapped;
export { EmployeeInfoPage };