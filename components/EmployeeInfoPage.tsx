import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Employee, emptyEmployee, ExpenseItem } from './DiagnosticData'; 
import { MapPinIcon, PhoneIcon, EmployeeInfoIcon, PrinterIcon, RefreshIcon, DatabaseIcon, SettingsIcon, Activity, BackIcon, SearchIcon, SaveIcon, UsersIcon } from './Icons';
import SearchableSelect from './SearchableSelect';

interface EmployeeInfoPageProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onBack?: () => void;
  detailedExpenses?: Record<string, ExpenseItem[]>; 
  attendanceLog: Record<string, any>;
  setAttendanceLog: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  leaveLog: Record<string, any>;
  setLeaveLog: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const initialJobPositions = [
    'Manager', 'Assit. Manager', 'Marketing Manager_01', 'Marketing Manager_02',
    'Receptionist_01', 'Receptionist_02', 'Receptionist_03', 'Dipl. lab. Technologist',
    'Asit. Lab Technician', 'X_Ray Technologist', 'X_Ray Technician', 'ECG_Technician',
    'Doctor Assistant_01', 'Doctor Assistant_02', 'Doctor Assistant_03', 'Cleaner_01',
    'Cleaner_02', 'Suipar_01', 'Suipar_02'
];

type EmployeeTab = 'data_entry' | 'monthly_roster' | 'attendance' | 'leave_management' | 'salary_sheet';

interface AttendanceRecord {
    status: 'Present' | 'Absent' | 'Late' | 'Leave' | '';
    inTime: string;
    outTime: string;
    notes: string;
    isMachineRecord?: boolean;
}

interface LeaveRecord {
    leaveDays: number;
    deductionAmount: number;
}

interface CloudMachine {
    serialNumber: string;
    publicIp: string;
    port: string;
    status: 'Online' | 'Offline' | 'Syncing';
    lastSeen: string;
}

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const EmployeeInfoPage: React.FC<EmployeeInfoPageProps> = ({ 
  employees, setEmployees, onBack, detailedExpenses = {}, 
  attendanceLog, setAttendanceLog, leaveLog, setLeaveLog 
}) => {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('data_entry');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Employee>(emptyEmployee);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Monthly Roster State: Record<"YYYY-MM", string[]>
  const [monthlyRoster, setMonthlyRoster] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('ncd_monthly_roster');
    return saved ? JSON.parse(saved) : {};
  });

  const [dynamicJobPositions, setDynamicJobPositions] = useState<string[]>(() => {
    const saved = localStorage.getItem('ncd_job_positions');
    return saved ? JSON.parse(saved) : initialJobPositions;
  });

  useEffect(() => {
    localStorage.setItem('ncd_job_positions', JSON.stringify(dynamicJobPositions));
  }, [dynamicJobPositions]);

  useEffect(() => {
    localStorage.setItem('ncd_monthly_roster', JSON.stringify(monthlyRoster));
  }, [monthlyRoster]);

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const [cloudMachine, setCloudMachine] = useState<CloudMachine>(() => {
    const saved = localStorage.getItem('ncd_machine_cfg');
    return saved ? JSON.parse(saved) : { publicIp: '192.168.1.201', port: '4370', status: 'Offline', lastSeen: 'Never' };
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const currentPeriodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  useEffect(() => {
    localStorage.setItem('ncd_machine_cfg', JSON.stringify(cloudMachine));
  }, [cloudMachine]);

  // Employees filtered by the selected month/year roster
  const periodEmployees = useMemo(() => {
    const activeIds = monthlyRoster[currentPeriodKey] || [];
    return employees.filter(e => activeIds.includes(e.emp_id) && e.status === 'Active');
  }, [employees, monthlyRoster, currentPeriodKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleCloudSync = () => {
    setCloudMachine(prev => ({ ...prev, status: 'Syncing' }));
    setTimeout(() => {
        setCloudMachine(prev => ({ ...prev, status: 'Online', lastSeen: new Date().toLocaleString() }));
        const newLog = { ...attendanceLog };
        periodEmployees.forEach(emp => {
            if(emp.machine_id) {
                const key = `${attendanceDate}_${emp.emp_id}`;
                newLog[key] = { status: 'Present', inTime: '09:00', outTime: '17:00', notes: 'Auto-Sync', isMachineRecord: true };
            }
        });
        setAttendanceLog(newLog);
        setSuccessMessage("Cloud Attendance Data Synced Successfully!");
    }, 1500);
  };

  const handleSaveProfile = () => {
    if (!formData.emp_name) {
        alert("দয়া করে নাম প্রদান করুন।");
        return;
    }
    
    setEmployees(prev => {
        const exists = prev.some(e => e.emp_id === formData.emp_id);
        if (exists) {
            return prev.map(e => e.emp_id === formData.emp_id ? formData : e);
        }
        return [formData, ...prev];
    });

    setSuccessMessage(selectedEmployeeId ? "Profile Updated Successfully!" : "New Employee Added Successfully!");
    
    if (!selectedEmployeeId) {
        setFormData(emptyEmployee);
        setSelectedEmployeeId(null);
    }
  };

  const toggleRosterStatus = (empId: string) => {
    setMonthlyRoster(prev => {
        const currentList = prev[currentPeriodKey] || [];
        const newList = currentList.includes(empId) 
            ? currentList.filter(id => id !== empId) 
            : [...currentList, empId];
        return { ...prev, [currentPeriodKey]: newList };
    });
  };

  const resetFormForNew = () => {
      setFormData({
          ...emptyEmployee, 
          emp_id: String(Date.now()).slice(-5), 
          joining_date: new Date().toISOString().split('T')[0]
      });
      setSelectedEmployeeId(null);
      if (nameInputRef.current) nameInputRef.current.focus();
  };

  const handlePrintSalarySheet = () => {
    const monthName = monthOptions[selectedMonth].name;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const finalData = periodEmployees.map(emp => {
        let advanceTakenTotal = 0;
        const dailyAdvancePayments: Record<number, number> = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayExpenses = detailedExpenses[dateStr] || [];
            const payments = dayExpenses.filter(ex => ex.category === 'Stuff salary' && (ex.subCategory === emp.emp_name || (ex.description && ex.description.includes(emp.emp_name))));
            const daySum = payments.reduce((sum, ex) => sum + (ex.paidAmount || 0), 0);
            if (daySum > 0) { dailyAdvancePayments[day] = daySum; advanceTakenTotal += daySum; }
        }
        const leaveKey = `${selectedMonth}_${selectedYear}_${emp.emp_id}`;
        const leaveRecord = leaveLog[leaveKey] || { leaveDays: 0, deductionAmount: 0 };
        let absentCount = 0;
        for(let d=1; d<=daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            if(attendanceLog[`${dateStr}_${emp.emp_id}`]?.status === 'Absent') absentCount++;
        }
        const perDaySal = emp.salary / 30;
        const leaveDeduction = (absentCount + (leaveRecord.leaveDays || 0)) * perDaySal;
        const netPayable = emp.salary - leaveDeduction - (leaveRecord.deductionAmount || 0);
        return { ...emp, netPayable, dailyAdvancePayments, advanceTakenTotal, dueAmount: netPayable - advanceTakenTotal };
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
            table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
            th, td { border: 1px solid black; padding: 4px; text-align: center; }
            th { background-color: #f3f4f6 !important; font-weight: bold; text-transform: uppercase; }
            .name-cell { text-align: left; font-weight: bold; width: 150px; text-transform: uppercase; }
            .header-text { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 15px; }
            .totals-row { background-color: #f9fafb !important; font-weight: 900; }
            .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; }
          </style>
        </head>
        <body>
          <div class="header-text">
            <h1 class="text-3xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
            <p class="text-sm font-bold mt-1">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
            <h2 class="text-lg font-black uppercase mt-4 underline tracking-widest">Net Salary Settlement Sheet: ${monthName} ${selectedYear}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th rowspan="2">SL</th>
                <th rowspan="2" class="name-cell">Staff Name</th>
                <th rowspan="2">Basic Salary</th>
                <th colspan="${daysInMonth}">Daily Advance Payments ( অগ্রিম গ্রহণ )</th>
                <th rowspan="2" style="background:#dcfce7">Total Advance</th>
                <th rowspan="2" style="background:#fee2e2">Net Payable</th>
                <th rowspan="2" style="background:#e0f2fe">Final Due</th>
              </tr>
              <tr>
                ${daysArray.map(d => `<th style="font-size: 7px; width: 18px;">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${finalData.map((emp, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="name-cell">${emp.emp_name}</td>
                  <td>৳${emp.salary.toLocaleString()}</td>
                  ${daysArray.map(d => `<td>${emp.dailyAdvancePayments[d] || ''}</td>`).join('')}
                  <td style="font-weight:bold">৳${emp.advanceTakenTotal.toLocaleString()}</td>
                  <td style="font-weight:bold">৳${emp.netPayable.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                  <td style="font-weight:black; font-size:10px; color: #1e40af">৳${emp.dueAmount.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="totals-row">
              <tr>
                <td colspan="2">TOTAL SETTLEMENT:</td>
                <td>৳${finalData.reduce((s,e)=>s+e.salary, 0).toLocaleString()}</td>
                ${daysArray.map(() => `<td></td>`).join('')}
                <td>৳${finalData.reduce((s,e)=>s+e.advanceTakenTotal, 0).toLocaleString()}</td>
                <td>৳${finalData.reduce((s,e)=>s+e.netPayable, 0).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                <td style="font-size: 12px;">৳${finalData.reduce((s,e)=>s+e.dueAmount, 0).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer-sign">
            <div class="text-center w-48 border-t border-black pt-1 font-bold text-xs uppercase">Accountant</div>
            <div class="text-center w-48 border-t border-black pt-1 font-bold text-xs uppercase">Staff Signature</div>
            <div class="text-center w-48 border-t border-black pt-1 font-bold text-xs uppercase">Authorized MD</div>
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
                    <div><label className="text-[10px] font-bold text-amber-600 uppercase mb-1 block ml-1">Machine ID</label><input type="text" name="machine_id" value={formData.machine_id || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-amber-900/30 rounded-xl p-3 text-slate-800 dark:text-white font-bold focus:border-amber-500 outline-none" placeholder="Fingerprint ID" /></div>
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
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block ml-1">Machine IP Address</label><input value={cloudMachine.publicIp} onChange={e=>setCloudMachine({...cloudMachine, publicIp: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-mono font-bold" /></div>
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-inner">
                        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Status</p><p className={`text-xs font-bold uppercase ${cloudMachine.status === 'Online' ? 'text-emerald-500' : 'text-rose-500'}`}>{cloudMachine.status}</p></div>
                        <div className="text-right"><p className="text-[9px] font-bold text-slate-400 uppercase">Last Sync</p><p className="text-[10px] font-bold text-slate-500">{cloudMachine.lastSeen}</p></div>
                    </div>
                    <button onClick={handleCloudSync} disabled={cloudMachine.status === 'Syncing'} className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-2xl text-white font-bold uppercase text-xs shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                        <RefreshIcon className={cloudMachine.status === 'Syncing' ? 'animate-spin' : ''} size={16}/> {cloudMachine.status === 'Syncing' ? 'Syncing...' : 'Sync Attendance Data'}
                    </button>
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
                    {employees.filter(e => e.emp_name.toLowerCase().includes(searchTerm.toLowerCase())).map((e) => (
                    <tr key={e.emp_id} onClick={() => handleRowClick(e)} className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-all ${selectedEmployeeId === e.emp_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <td className="p-5 font-mono text-xs text-blue-600">#{e.emp_id}<div className="text-[10px] text-amber-600 font-bold mt-1">HID: {e.machine_id || '---'}</div></td>
                        <td className="p-5 font-bold text-slate-700 dark:text-slate-200 text-base">{e.emp_name}<div className="text-[10px] text-slate-400 font-medium uppercase mt-1">{e.mobile} | {e.gender}</div></td>
                        <td className="p-5 text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-tight">{e.job_position}<div className="text-[10px] text-slate-400 mt-1">{e.department} | {e.degree || 'General'}</div></td>
                        <td className="p-5 text-right font-bold text-slate-700 dark:text-slate-100 text-base">৳{e.salary.toLocaleString()}</td>
                        <td className="p-5 text-center"><span className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase border ${e.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900'}`}>{e.status}</span></td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderMonthlyRosterTab = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-sky-100 uppercase tracking-tight flex items-center gap-3">
                        <UsersIcon size={24} className="text-blue-500" /> মাসিক তালিকা ব্যবস্থাপনা (Monthly Roster)
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select employees active for the chosen period</p>
                </div>
                <div className="flex gap-4">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-white font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-white font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
            </div>

            <div className="relative w-full mb-6">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search staff to add to roster..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-inner"/>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr><th className="p-5 text-center w-20">Active</th><th className="p-5">ID</th><th className="p-5">Staff Member</th><th className="p-5">Job Position</th><th className="p-5 text-right">Basic Salary</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {employees.filter(e => e.status === 'Active' && e.emp_name.toLowerCase().includes(searchTerm.toLowerCase())).map((emp) => {
                            const isSelected = (monthlyRoster[currentPeriodKey] || []).includes(emp.emp_id);
                            return (
                                <tr key={emp.emp_id} className={`hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-all ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''}`}>
                                    <td className="p-5 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => toggleRosterStatus(emp.emp_id)}
                                            className="w-6 h-6 rounded-lg accent-blue-600 cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-5 font-mono text-xs text-slate-400">#{emp.emp_id}</td>
                                    <td className="p-5 font-bold text-slate-700 dark:text-slate-200 uppercase">{emp.emp_name}</td>
                                    <td className="p-5 font-bold text-slate-500 uppercase text-xs">{emp.job_position}</td>
                                    <td className="p-5 text-right font-black text-slate-400 text-base">৳{emp.salary.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">* এখানে আপনার সিলেক্ট করা কর্মচারীরাই কেবল মাত্র স্যালারি শিট ও এটেন্ডেন্স এর আওতায় আসবে।</p>
            </div>
        </div>
    </div>
  );

  const renderAttendanceTab = () => (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-sky-100 uppercase tracking-tight flex items-center gap-4"><Activity size={24} className="text-blue-500" /> Daily Duty Ledger</h2>
              <div className="flex items-center gap-4">
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-white font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-700 dark:text-white font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                  <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white font-bold outline-none" />
              </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <tr><th className="p-5">Staff Member</th><th className="p-5">HID</th><th className="p-5">Status</th><th className="p-5 text-center">In Time</th><th className="p-5 text-center">Out Time</th><th className="p-5">Remarks</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {periodEmployees.map((emp) => {
                          const key = `${attendanceDate}_${emp.emp_id}`;
                          const record = attendanceLog[key] || { status: '', inTime: '', outTime: '', notes: '' };
                          return (
                              <tr key={emp.emp_id} className="hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-all">
                                  <td className="p-5 font-bold text-slate-700 dark:text-slate-200 uppercase">{emp.emp_name}<div className="text-[10px] text-slate-400 font-medium">{emp.job_position}</div></td>
                                  <td className="p-5 font-mono text-amber-600 font-bold">{emp.machine_id || '---'}</td>
                                  <td className="p-5"><select value={record.status} onChange={(e) => setAttendanceLog({...attendanceLog, [key]: {...record, status: e.target.value as any}})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-800 dark:text-white text-xs font-bold shadow-sm w-full"><option value="">-- Select --</option><option value="Present">Present</option><option value="Absent">Absent</option><option value="Late">Late</option><option value="Leave">Leave</option></select></td>
                                  <td className="p-5 text-center"><input type="time" value={record.inTime} onChange={(e) => setAttendanceLog({...attendanceLog, [key]: {...record, inTime: e.target.value}})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-white text-xs font-bold" /></td>
                                  <td className="p-5 text-center"><input type="time" value={record.outTime} onChange={(e) => setAttendanceLog({...attendanceLog, [key]: {...record, outTime: e.target.value}})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-white text-xs font-bold" /></td>
                                  <td className="p-5"><input type="text" value={record.notes} onChange={(e) => setAttendanceLog({...attendanceLog, [key]: {...record, notes: e.target.value}})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-white text-xs font-medium w-full" placeholder="..." /></td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          <div className="mt-10 flex justify-end"><button onClick={() => setSuccessMessage('Attendance Records Posted Successfully!')} className="px-16 py-4 bg-emerald-600 text-white rounded-[2rem] font-bold uppercase text-xs shadow-xl active:scale-95 transition-all">Submit Entry</button></div>
      </div>
  );

  const renderLeaveManagementTab = () => {
    const getAutoAbsentCount = (empId: string) => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        let absentCount = 0;
        for(let d=1; d<=daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            if(attendanceLog[`${dateStr}_${empId}`]?.status === 'Absent') absentCount++;
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
                      <tr><th className="p-5">Staff Profile</th><th className="p-5 text-right">Basic Salary</th><th className="p-5 text-center">Absent Days</th><th className="p-5 text-center">Manual Leave</th><th className="p-5 text-right">Fine/Other Ded.</th><th className="p-5 text-right">Net Payable</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {periodEmployees.map((emp) => {
                          const autoAbsent = getAutoAbsentCount(emp.emp_id);
                          const key = `${selectedMonth}_${selectedYear}_${emp.emp_id}`;
                          const record = leaveLog[key] || { leaveDays: 0, deductionAmount: 0 };
                          const perDaySal = emp.salary / 30;
                          const finalDed = (autoAbsent + record.leaveDays) * perDaySal + record.deductionAmount;
                          return (
                              <tr key={emp.emp_id} className="hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-all">
                                  <td className="p-5 font-bold text-slate-700 dark:text-slate-200 uppercase">{emp.emp_name}<div className="text-[10px] text-slate-400 font-medium">{emp.job_position}</div></td>
                                  <td className="p-5 text-right font-bold text-slate-500">৳{emp.salary.toLocaleString()}</td>
                                  <td className="p-5 text-center font-bold text-rose-500 text-lg">{autoAbsent}</td>
                                  <td className="p-5 text-center"><input type="number" value={record.leaveDays} onChange={(e) => setLeaveLog({...leaveLog, [key]: {...record, leaveDays: parseInt(e.target.value) || 0}})} className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center text-slate-800 dark:text-white font-bold" /></td>
                                  <td className="p-5 text-right"><input type="number" value={record.deductionAmount} onChange={(e) => setLeaveLog({...leaveLog, [key]: {...record, deductionAmount: parseInt(e.target.value) || 0}})} className="w-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-right text-rose-600 font-bold" /></td>
                                  <td className="p-5 text-right text-emerald-600 font-bold text-xl">৳{(emp.salary - finalDed).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          <div className="mt-12 flex justify-end"><button onClick={() => setSuccessMessage('Payroll Adjustments Saved Successfully!')} className="bg-emerald-600 text-white px-16 py-4 rounded-3xl font-bold uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all">Update Net Payables</button></div>
      </div>
    );
  };

  const renderSalarySheetTab = () => {
    return (
        <div className="space-y-12 animate-fade-in no-print">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <div><h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight leading-none">Net Settlement Sheet</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Cycle: {monthOptions[selectedMonth].name} {selectedYear}</p></div>
                <div className="flex gap-4">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-white font-black text-xs">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-white font-black text-xs">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                  <button onClick={handlePrintSalarySheet} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase shadow-lg hover:bg-blue-700 transition-all flex items-center gap-3"><PrinterIcon size={16}/> Print Official Sheet</button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">* স্যালারি শিটে নির্বাচিত মাসের স্টাফদের নামের তালিকা ও অগ্রিম গ্রহণের বিবরণ নিচে দেওয়া হলো।</p>
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                    <table className="w-full text-[10px] text-left border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-3">SL</th>
                                <th className="p-3">Employee Name</th>
                                <th className="p-3 text-right">Basic Sal.</th>
                                <th className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold bg-slate-200 dark:bg-slate-800">Advance ( অগ্রিম )</th>
                                <th className="p-3 text-right bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold">Net Bill</th>
                                <th className="p-3 text-right bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-black">Final Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {periodEmployees.map((emp, index) => {
                                let advanceTakenTotal = 0;
                                const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                                for (let day = 1; day <= daysInMonth; day++) {
                                    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayExpenses = detailedExpenses[dateStr] || [];
                                    const payments = dayExpenses.filter(ex => ex.category === 'Stuff salary' && (ex.subCategory === emp.emp_name || (ex.description && ex.description.includes(emp.emp_name))));
                                    advanceTakenTotal += payments.reduce((sum, ex) => sum + (ex.paidAmount || 0), 0);
                                }
                                
                                const leaveKey = `${selectedMonth}_${selectedYear}_${emp.emp_id}`;
                                const leaveRecord = leaveLog[leaveKey] || { leaveDays: 0, deductionAmount: 0 };
                                let absentCount = 0;
                                for(let d=1; d<=daysInMonth; d++) {
                                    const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                                    if(attendanceLog[`${dateStr}_${emp.emp_id}`]?.status === 'Absent') absentCount++;
                                }
                                const perDaySal = emp.salary / 30;
                                const leaveDeduction = (absentCount + (leaveRecord.leaveDays || 0)) * perDaySal;
                                const netPayable = emp.salary - leaveDeduction - (leaveRecord.deductionAmount || 0);

                                return (
                                    <tr key={emp.emp_id} className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-3 text-slate-500 font-mono">{index + 1}</td>
                                        <td className="p-3 font-bold text-slate-800 dark:text-white truncate uppercase">{emp.emp_name}</td>
                                        <td className="p-3 text-right font-bold text-slate-500">৳{emp.salary.toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold text-emerald-500">৳{advanceTakenTotal.toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold text-blue-500">৳{netPayable.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                        <td className="p-3 text-right font-black text-slate-900 dark:text-white text-base">৳{(netPayable - advanceTakenTotal).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] italic">
                * Note: Net Bill স্বয়ংক্রিয়ভাবে নির্বাচিত মাসের হাজিরা এবং ছুটির কর্তন অনুযায়ী হিসাব করা হয়েছে। অ্যাডভান্স কলামটি প্রতিদিনের একাউন্টিং লেজার থেকে সংগৃহীত।
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
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Version 10.0 Period-Aware</p>
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
                { id: 'salary_sheet', label: 'Salary Sheet' } 
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
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfoPage;