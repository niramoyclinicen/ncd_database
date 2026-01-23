
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Employee, emptyEmployee, ExpenseItem } from './DiagnosticData'; 
import { MapPinIcon, PhoneIcon, EmployeeInfoIcon } from './Icons';

interface EmployeeInfoPageProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onBack?: () => void;
  detailedExpenses?: Record<string, ExpenseItem[]>; // Added for Salary Sheet
}

const jobPositions = [
    'Manager',
    'Assit. Manager',
    'Marketing Manager_01',
    'Marketing Manager_02',
    'Receptionist_01',
    'Receptionist_02',
    'Receptionist_03',
    'Dipl. lab. Technologist',
    'Asit. Lab Technician',
    'X_Ray Technologist',
    'X_Ray Technician',
    'ECG_Technician',
    'Doctor Assistant_01',
    'Doctor Assistant_02',
    'Doctor Assistant_03',
    'Cleaner_01',
    'Cleaner_02',
    'Suipar_01',
    'Suipar_02'
];

type EmployeeTab = 'data_entry' | 'attendance' | 'leave_management' | 'salary_sheet';

interface AttendanceRecord {
    status: 'Present' | 'Absent' | 'Late' | 'Leave' | '';
    inTime: string;
    outTime: string;
    notes: string;
}

interface LeaveRecord {
    leaveDays: number;
    deductionAmount: number;
}

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const EmployeeInfoPage: React.FC<EmployeeInfoPageProps> = ({ employees, setEmployees, onBack, detailedExpenses }) => {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('data_entry');
  
  // Existing state for Data Entry
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(employees);
  const [formData, setFormData] = useState<Employee>(emptyEmployee);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // --- Attendance State with Persistence ---
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceLog, setAttendanceLog] = useState<Record<string, AttendanceRecord>>(() => {
    const saved = localStorage.getItem('ncd_emp_attendance');
    return saved ? JSON.parse(saved) : {};
  });

  // --- Leave Management State with Persistence ---
  const [leaveLog, setLeaveLog] = useState<Record<string, LeaveRecord>>(() => {
    const saved = localStorage.getItem('ncd_emp_leaves');
    return saved ? JSON.parse(saved) : {};
  });

  // --- Salary Sheet State ---
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (successMessage) {
        const timer = setTimeout(() => setSuccessMessage(''), 5000); 
        return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('ncd_emp_attendance', JSON.stringify(attendanceLog));
  }, [attendanceLog]);

  useEffect(() => {
    localStorage.setItem('ncd_emp_leaves', JSON.stringify(leaveLog));
  }, [leaveLog]);

  const currentMonthEmployees = useMemo(() => employees.filter(e => e.is_current_month), [employees]);

  useEffect(() => {
    const results = employees.filter(employee =>
      employee.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.emp_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(results);
  }, [searchTerm, employees]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
        return;
    }
    if (name === 'mobile') {
        setMobileError('');
        const digits = value.replace(/\D/g, '').slice(0, 11);
        let formatted = digits;
        if (digits.length > 5) formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
        setFormData(prev => ({ ...prev, mobile: formatted }));
    } else if (name === 'salary') {
        setFormData(prev => ({ ...prev, salary: parseFloat(value) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData(emptyEmployee);
    setSelectedEmployeeId(null);
    setIsEditing(false);
    setMobileError('');
  };
  
  const handleCancel = () => resetForm();

  const handleGetNewId = () => {
    const maxId = employees.reduce((max, emp) => {
        const idNum = parseInt(emp.emp_id, 10);
        return !isNaN(idNum) && idNum > max ? idNum : max;
    }, 0);
    const newId = String(maxId + 1);
    resetForm();
    setFormData({ ...emptyEmployee, emp_id: newId, joining_date: new Date().toISOString().split('T')[0] });
    nameInputRef.current?.focus();
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.emp_id || !formData.emp_name || !formData.job_position || !formData.department || !formData.gender || !formData.joining_date) {
      alert('Please fill all required fields.');
      return;
    }
    if (isEditing) {
      setEmployees(employees.map(e => e.emp_id === formData.emp_id ? formData : e));
      setSuccessMessage(`Employee '${formData.emp_name}' updated successfully!`);
    } else {
      if (employees.some(e => e.emp_id === formData.emp_id)) {
        alert('Employee ID already exists.');
        return;
      }
      setEmployees([formData, ...employees]);
      setSuccessMessage(`New employee '${formData.emp_name}' added successfully!`);
    }
    resetForm();
  };

  const handleEditEmployee = () => {
    if (!selectedEmployeeId) return;
    const employeeToEdit = employees.find(e => e.emp_id === selectedEmployeeId);
    if (employeeToEdit) {
      setFormData(employeeToEdit);
      setIsEditing(true);
      nameInputRef.current?.focus();
    }
  };
  
  const handleDeleteEmployee = () => {
    if (!selectedEmployeeId) return;
    if (window.confirm(`Are you sure you want to delete this employee?`)) {
        setEmployees(employees.filter(e => e.emp_id !== selectedEmployeeId));
        setSuccessMessage('Employee deleted successfully!');
        resetForm();
    }
  };

  const handleRowClick = (employee: Employee) => {
    setFormData(employee);
    setSelectedEmployeeId(employee.emp_id);
    setIsEditing(false);
  };
  
  const handleFocusSelect = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();

  const handleAddEmployeeToCurrentMonth = () => {
    if (!selectedEmployeeId) return;
    setEmployees(prev => prev.map(emp => 
      emp.emp_id === selectedEmployeeId ? { ...emp, is_current_month: true } : emp
    ));
    setSuccessMessage('Employee added to the current month active list.');
  };

  const handleRemoveEmployeeFromCurrentMonth = (empId: string) => {
    if (window.confirm("Remove from current month list?")) {
      setEmployees(prev => prev.map(emp => 
        emp.emp_id === empId ? { ...emp, is_current_month: false } : emp
      ));
      setSuccessMessage('Employee removed from the current month list.');
    }
  };

  const handleAttendanceChange = (empId: string, field: keyof AttendanceRecord, value: string) => {
      const key = `${attendanceDate}_${empId}`;
      setAttendanceLog(prev => ({
          ...prev,
          [key]: { ...prev[key], [field]: value }
      }));
  };

  const getAttendanceRecord = (empId: string): AttendanceRecord => {
      const key = `${attendanceDate}_${empId}`;
      return attendanceLog[key] || { status: '', inTime: '', outTime: '', notes: '' };
  };

  // --- Leave Logic ---
  const handleLeaveChange = (empId: string, field: keyof LeaveRecord, value: number) => {
      const key = `${selectedMonth}_${selectedYear}_${empId}`;
      setLeaveLog(prev => ({
          ...prev,
          [key]: { 
              ...(prev[key] || { leaveDays: 0, deductionAmount: 0 }), 
              [field]: value 
          }
      }));
  };

  const getLeaveRecord = (empId: string): LeaveRecord => {
      const key = `${selectedMonth}_${selectedYear}_${empId}`;
      return leaveLog[key] || { leaveDays: 0, deductionAmount: 0 };
  };

  const inputBaseClasses = "py-2 px-3 mt-1 block w-full border border-sky-800 rounded-md shadow-sm sm:text-sm bg-sky-900/50 text-sky-200 placeholder-sky-400 focus:bg-sky-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelBaseClasses = "block text-sm font-semibold text-sky-300";
  const actionButtonClasses = "px-4 py-2 text-sm font-medium rounded-md flex justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 transition-colors";
  const isSelectedEmployeeActive = employees.find(e => e.emp_id === selectedEmployeeId)?.is_current_month;

  const renderDataEntryTab = () => (
    <>
      <div className="bg-sky-950 rounded-xl p-4 sm:p-6 border border-sky-800">
        <h2 className="text-2xl font-bold text-sky-100 mb-6 border-b border-sky-800 pb-4">Employee Data Entry Form</h2>
        <div className="flex flex-wrap items-center gap-2 border-b border-sky-800 pb-4 mb-4">
            <label htmlFor="emp_id" className="font-semibold text-sky-300 whitespace-nowrap">Emp. Id:</label>
            <input type="text" id="emp_id" name="emp_id" disabled value={formData.emp_id} className="w-24 border border-sky-800 rounded-md shadow-sm sm:text-sm px-3 py-2 bg-sky-900 text-sky-400 cursor-not-allowed" />
            <button type="button" onClick={handleGetNewId} className={`${actionButtonClasses} text-white bg-blue-600 hover:bg-blue-700`}>Add New</button>
            <button type="submit" form="employee-form" className={`${actionButtonClasses} text-white bg-green-600 hover:bg-green-700`}>Save</button>
            <button type="button" onClick={handleEditEmployee} disabled={!selectedEmployeeId} className={`${actionButtonClasses} text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50`}>Edit</button>
            <button type="button" onClick={handleDeleteEmployee} disabled={!selectedEmployeeId} className={`${actionButtonClasses} text-white bg-red-600 hover:bg-red-700 disabled:opacity-50`}>Delete</button>
            <button type="button" onClick={handleCancel} className={`${actionButtonClasses} text-sky-200 bg-slate-600 hover:bg-slate-500`}>Cancel</button>
        </div>
        <form id="employee-form" onSubmit={handleSaveEmployee}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <div><label className={labelBaseClasses}>Employee Name</label><input ref={nameInputRef} type="text" name="emp_name" value={formData.emp_name} onChange={handleInputChange} required className={inputBaseClasses} /></div>
              <div>
                  <label className={labelBaseClasses}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} required className={inputBaseClasses}>
                      <option value="" disabled hidden>Select</option><option value="Male">Male</option><option value="Female">Female</option>
                  </select>
              </div>
              <div>
                  <label className={labelBaseClasses}>Job Position</label>
                  <select name="job_position" value={formData.job_position} onChange={handleInputChange} required className={inputBaseClasses}>
                      <option value="" disabled hidden>Select</option>{jobPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
              </div>
              <div><label className={labelBaseClasses}>Degree</label><input type="text" name="degree" value={formData.degree || ''} onChange={handleInputChange} className={inputBaseClasses} /></div>
              <div>
                  <label className={labelBaseClasses}>Department</label>
                  <select name="department" value={formData.department} onChange={handleInputChange} required className={inputBaseClasses}>
                      <option value="" disabled hidden>Select</option><option value="Diagnostic">Diagnostic</option><option value="Clinic">Clinic</option><option value="Accounting">Accounting</option>
                  </select>
              </div>
              <div><label className={labelBaseClasses}>Joining Date</label><input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} required className={inputBaseClasses} /></div>
              <div><label className={labelBaseClasses}>Mobile</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} className={inputBaseClasses} /></div>
              <div className="lg:col-span-2"><label className={labelBaseClasses}>Address</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputBaseClasses} /></div>
              <div className="flex items-end gap-4">
                  <div className="flex-grow"><label className={labelBaseClasses}>Salary</label><input type="number" name="salary" value={formData.salary} onChange={handleInputChange} onFocus={handleFocusSelect} className={inputBaseClasses} /></div>
                   <div className="flex items-center pb-2"><input name="is_current_month" type="checkbox" checked={formData.is_current_month} onChange={handleInputChange} className="h-4 w-4 bg-sky-900" /><label className="ml-2 block text-sm font-medium text-sky-300">isCurrentMonth</label></div>
              </div>
          </div>
        </form>
      </div>
      
      <div className="mt-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <label className="font-semibold text-slate-300">Search:</label>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-2 px-3 bg-slate-700 text-slate-200 rounded-md border border-slate-600" placeholder="Name or ID" />
          </div>
          <button type="button" onClick={handleAddEmployeeToCurrentMonth} disabled={!selectedEmployeeId || isSelectedEmployeeActive} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md disabled:opacity-50">Add to Current Month</button>
        </div>
        <div className="overflow-x-auto border border-slate-700 rounded-lg">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Current Month</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-700">
              {filteredEmployees.map((employee) => (
                <tr key={employee.emp_id} onClick={() => handleRowClick(employee)} className={`cursor-pointer hover:bg-slate-800/50 ${selectedEmployeeId === employee.emp_id ? 'bg-blue-900/40' : ''}`}>
                  <td className="px-6 py-4 text-sm text-slate-300">{employee.emp_id}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{employee.emp_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{employee.job_position}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{employee.mobile}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{employee.is_current_month ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderAttendanceTab = () => (
      <div className="bg-sky-950 rounded-xl p-4 sm:p-6 border border-sky-800">
          <div className="flex justify-between items-center mb-6 border-b border-sky-800 pb-4">
              <h2 className="text-2xl font-bold text-sky-100">Daily Attendance</h2>
              <div className="flex items-center gap-2">
                  <label className="font-semibold text-sky-300">Date:</label>
                  <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="bg-slate-700 border border-slate-600 rounded p-2 text-white" />
              </div>
          </div>
          <div className="overflow-x-auto border border-slate-700 rounded-lg">
              <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs text-slate-300 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs text-slate-300 uppercase">Position</th>
                          <th className="px-4 py-3 text-left text-xs text-slate-300 uppercase">Status</th>
                          <th className="px-4 py-3 text-center text-xs text-slate-300 uppercase">In</th>
                          <th className="px-4 py-3 text-center text-xs text-slate-300 uppercase">Out</th>
                      </tr>
                  </thead>
                  <tbody className="bg-slate-900 divide-y divide-slate-700">
                      {currentMonthEmployees.map((emp) => {
                          const record = getAttendanceRecord(emp.emp_id);
                          return (
                              <tr key={emp.emp_id}>
                                  <td className="px-4 py-3 text-sm text-slate-200">{emp.emp_name}</td>
                                  <td className="px-4 py-3 text-sm text-slate-400">{emp.job_position}</td>
                                  <td className="px-4 py-3"><select value={record.status} onChange={(e) => handleAttendanceChange(emp.emp_id, 'status', e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white w-full"><option value="">Select</option><option value="Present">Present</option><option value="Absent">Absent</option></select></td>
                                  <td className="px-4 py-3 text-center"><input type="time" value={record.inTime} onChange={(e) => handleAttendanceChange(emp.emp_id, 'inTime', e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-white" /></td>
                                  <td className="px-4 py-3 text-center"><input type="time" value={record.outTime} onChange={(e) => handleAttendanceChange(emp.emp_id, 'outTime', e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-white" /></td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          <div className="mt-4 flex justify-end"><button onClick={() => setSuccessMessage('Attendance saved.')} className="px-6 py-2 bg-green-600 text-white rounded font-bold">Save Attendance</button></div>
      </div>
  );

  const renderLeaveManagementTab = () => (
      <div className="bg-sky-950 rounded-xl p-4 sm:p-6 border border-sky-800">
          <div className="flex justify-between items-center mb-6 border-b border-sky-800 pb-4">
              <h2 className="text-2xl font-bold text-sky-100 font-bengali">ছুটি ব্যবস্থাপনা / Leave Management</h2>
              <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                      <label className="text-sky-300 text-sm">Month:</label>
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white">
                          {monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                      </select>
                  </div>
                  <div className="flex items-center gap-2">
                      <label className="text-sky-300 text-sm">Year:</label>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white">
                          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </div>
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-slate-300">
                  <thead className="bg-slate-800 text-slate-200">
                      <tr>
                          <th className="p-3 border border-slate-600">Employee Name</th>
                          <th className="p-3 border border-slate-600">Job Position</th>
                          <th className="p-3 border border-slate-600 text-right">Contract Salary</th>
                          <th className="p-3 border border-slate-600 text-center">Leave Days</th>
                          <th className="p-3 border border-slate-600 text-right">Deduction (BDT)</th>
                          <th className="p-3 border border-slate-600 text-right bg-slate-700 font-bold">Net Payable</th>
                      </tr>
                  </thead>
                  <tbody>
                      {currentMonthEmployees.map((emp) => {
                          const record = getLeaveRecord(emp.emp_id);
                          const netPayable = emp.salary - record.deductionAmount;
                          return (
                              <tr key={emp.emp_id} className="border-b border-slate-700 hover:bg-slate-800">
                                  <td className="p-3 border border-slate-600 font-medium text-slate-200">{emp.emp_name}</td>
                                  <td className="p-3 border border-slate-600 text-slate-400">{emp.job_position}</td>
                                  <td className="p-3 border border-slate-600 text-right">{emp.salary.toLocaleString()}</td>
                                  <td className="p-3 border border-slate-600 text-center">
                                      <input 
                                          type="number" 
                                          min="0"
                                          value={record.leaveDays} 
                                          onChange={(e) => handleLeaveChange(emp.emp_id, 'leaveDays', parseInt(e.target.value) || 0)}
                                          onFocus={handleFocusSelect}
                                          className="w-16 p-1 bg-slate-700 border border-slate-600 rounded text-center text-white" 
                                      />
                                  </td>
                                  <td className="p-3 border border-slate-600 text-right">
                                      <input 
                                          type="number" 
                                          min="0"
                                          value={record.deductionAmount} 
                                          onChange={(e) => handleLeaveChange(emp.emp_id, 'deductionAmount', parseInt(e.target.value) || 0)}
                                          onFocus={handleFocusSelect}
                                          className="w-24 p-1 bg-slate-700 border border-slate-600 rounded text-right text-red-400 font-bold" 
                                      />
                                  </td>
                                  <td className="p-3 border border-slate-600 text-right bg-slate-800/50 font-bold text-green-400 text-base">
                                      {netPayable.toLocaleString()}
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          <div className="mt-6 flex justify-end">
              <button onClick={() => setSuccessMessage('Leave and Salary adjustments saved successfully!')} className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg">Save Settings</button>
          </div>
      </div>
  );

  const renderSalarySheetTab = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Function to calculate payments from detailedExpenses
    const calculatePayments = (emp: Employee) => {
        let paidTotal = 0;
        const dailyPayments: Record<number, number> = {};
        daysArray.forEach(day => {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const expenses = detailedExpenses?.[dateStr] || [];
            
            // Find salary payment for this employee on this date
            const payment = expenses
                .filter(ex => ex.category === 'Stuff salary' && ex.subCategory === emp.emp_name)
                .reduce((sum, ex) => sum + (ex.paidAmount || 0), 0);
            
            if (payment > 0) {
                dailyPayments[day] = payment;
                paidTotal += payment;
            }
        });
        return { dailyPayments, paidTotal };
    };

    // Process Employees by Category
    const diagnosticEmployees = employees.filter(e => e.department === 'Diagnostic' && e.is_current_month);
    const clinicEmployees = employees.filter(e => e.department === 'Clinic' && e.is_current_month);

    let totalDiagnosticPaid = 0;
    const processedDiagnosticData = diagnosticEmployees.map(emp => {
        const { dailyPayments, paidTotal } = calculatePayments(emp);
        totalDiagnosticPaid += paidTotal;
        const leaveRecord = getLeaveRecord(emp.emp_id);
        const actualSalary = emp.salary - leaveRecord.deductionAmount;
        return { ...emp, actualSalary, dailyPayments, paidTotal, due: actualSalary - paidTotal };
    });

    let totalClinicPaid = 0;
    const processedClinicData = clinicEmployees.map(emp => {
        const { dailyPayments, paidTotal } = calculatePayments(emp);
        totalClinicPaid += paidTotal;
        const leaveRecord = getLeaveRecord(emp.emp_id);
        const actualSalary = emp.salary - leaveRecord.deductionAmount;
        return { ...emp, actualSalary, dailyPayments, paidTotal, due: actualSalary - paidTotal };
    });

    const grandTotalPaid = totalDiagnosticPaid + totalClinicPaid;

    // Helper Table UI
    const SalaryTable = ({ title, color, data }: { title: string, color: string, data: any[] }) => (
        <div className={`bg-${color}-950/50 p-4 rounded-xl border border-${color}-800 overflow-hidden mb-8`}>
            <h4 className={`text-lg font-bold text-${color}-200 mb-4 border-b border-${color}-800 pb-2`}>{title}</h4>
            <div className="overflow-x-auto pb-4">
                <table className="w-full text-xs text-left text-slate-300 border-collapse border border-slate-600">
                    <thead className="bg-slate-800 text-slate-200">
                        <tr>
                            <th className="border border-slate-600 p-2 min-w-[30px]">SL</th>
                            <th className="border border-slate-600 p-2 min-w-[120px] sticky left-0 bg-slate-800 z-10">Name</th>
                            <th className="border border-slate-600 p-2 min-w-[100px]">Position</th>
                            <th className="border border-slate-600 p-2 min-w-[80px] text-right">Salary (Pabe)</th>
                            {daysArray.map(d => (
                                <th key={d} className="border border-slate-600 p-1 min-w-[35px] text-center">{d}</th>
                            ))}
                            <th className="border border-slate-600 p-2 min-w-[80px] text-right bg-slate-700">Total Paid</th>
                            <th className="border border-slate-600 p-2 min-w-[80px] text-right bg-slate-700">Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((emp, index) => (
                            <tr key={emp.emp_id} className="hover:bg-slate-800/50">
                                <td className="border border-slate-600 p-2 text-center">{index + 1}</td>
                                <td className="border border-slate-600 p-2 font-medium sticky left-0 bg-slate-900 z-10">{emp.emp_name}</td>
                                <td className="border border-slate-600 p-2">{emp.job_position}</td>
                                <td className={`border border-slate-600 p-2 text-right font-bold text-${color}-200`}>{emp.actualSalary.toLocaleString()}</td>
                                {daysArray.map(d => (
                                    <td key={d} className="border border-slate-600 p-1 text-center text-[10px]">
                                        {emp.dailyPayments[d] ? emp.dailyPayments[d] : ''}
                                    </td>
                                ))}
                                <td className="border border-slate-600 p-2 text-right font-bold text-green-400 bg-slate-800/30">{emp.paidTotal > 0 ? emp.paidTotal.toLocaleString() : '-'}</td>
                                <td className="border border-slate-600 p-2 text-right font-bold text-red-400 bg-slate-800/30">{emp.due.toLocaleString()}</td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={daysInMonth + 6} className="p-4 text-center text-slate-500">No active employees found in this section.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Controls */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap gap-4 items-center">
                <h3 className="text-xl font-bold text-white mr-4">Salary Sheet</h3>
                <div className="flex items-center gap-2">
                    <label className="text-slate-400 text-sm">Month:</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white">
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-slate-400 text-sm">Year:</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <SalaryTable title="Diagnostic Employee Salary Sheet" color="sky" data={processedDiagnosticData} />
            <SalaryTable title="Clinic Employee Salary Sheet" color="emerald" data={processedClinicData} />

            {/* Summary */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-lg">
                <h4 className="text-lg font-bold text-white mb-4">Salary Summary ({monthOptions[selectedMonth].name} {selectedYear})</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-sky-300">Total Paid (Diagnostic):</span>
                        <span className="font-bold text-white">{totalDiagnosticPaid.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-emerald-300">Total Paid (Clinic):</span>
                        <span className="font-bold text-white">{totalClinicPaid.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 text-lg">
                        <span className="font-bold text-white">Grand Total Paid:</span>
                        <span className="font-bold text-green-400">{grandTotalPaid.toLocaleString()} BDT</span>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col">
        {successMessage && <div className="fixed bottom-5 right-5 z-[9999] bg-green-900 px-6 py-3 rounded text-green-100 shadow-2xl">{successMessage}</div>}

      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 shrink-0 shadow-sm z-20 relative">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between relative w-full px-4">
            <div className="flex flex-col items-center md:items-start z-10">
                <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100 leading-tight tracking-tight mb-1">
                    Niramoy Clinic and Diagnostic
                </h1>
                <p className="text-sm md:text-base text-slate-400 font-medium">Enayetpur, Sirajgonj | Phone: 01730 923007</p>
            </div>
            <div className="flex flex-col items-end mt-3 md:mt-0 z-10">
                <div className="flex items-center">
                    <EmployeeInfoIcon className="w-8 h-8 text-violet-400 mr-2 drop-shadow-[0_0_5px_rgba(167,139,250,0.5)]" />
                    <h2 className="text-2xl md:text-3xl font-bold text-violet-400 font-bengali drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]">
                        Employee Management
                    </h2>
                </div>
                {onBack && (
                    <button onClick={onBack} className="mt-2 text-sm text-slate-400 hover:text-white transition-colors">
                        &larr; Back to Accounting
                    </button>
                )}
            </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-8 flex-1">
        <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
            <nav className="flex flex-wrap gap-2">
                {[
                    { id: 'data_entry', label: 'Data Entry' }, 
                    { id: 'attendance', label: 'Attendance' }, 
                    { id: 'leave_management', label: 'Leave Mgmt' }, 
                    { id: 'salary_sheet', label: 'Salary Sheet' }
                ].map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => setActiveTab(item.id as EmployeeTab)} 
                        className={`flex-1 min-w-[120px] p-3 rounded-lg font-bold text-sm transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            {activeTab === 'data_entry' && renderDataEntryTab()}
            {activeTab === 'attendance' && renderAttendanceTab()}
            {activeTab === 'leave_management' && renderLeaveManagementTab()}
            {activeTab === 'salary_sheet' && renderSalarySheetTab()}
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfoPage;
