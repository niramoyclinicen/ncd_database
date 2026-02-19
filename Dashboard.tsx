
import React, { useState, useMemo } from 'react';
import { Employee, Referrar, LabInvoice as Invoice } from './DiagnosticData';
import { UsersIcon, TrendingUpIcon, SettingsIcon, BarChart3 } from 'lucide-react';

interface ContributionReportPageProps {
  employees: Employee[];
  referrars: Referrar[];
  invoices: Invoice[];
  employeeReferrerMap: Record<string, string[]>;
  setEmployeeReferrerMap: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

type TimeFilter = 'week' | '2weeks' | 'month' | 'lastMonth' | '3months' | '6months' | 'year';

const timeFilters: { id: TimeFilter; label: string }[] = [
  { id: 'week', label: 'This Week' },
  { id: '2weeks', label: 'Last 2 Weeks' },
  { id: 'month', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: '3months', label: 'Last 3 Months' },
  { id: '6months', label: 'Last 6 Months' },
  { id: 'year', label: 'This Year' },
];

// --- Sub-Component: Marketing Setup (Linking Manager to Referrers) ---
const MarketingSetup: React.FC<{
    employees: Employee[];
    referrars: Referrar[];
    mapping: Record<string, string[]>;
    setMapping: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}> = ({ employees, referrars, mapping, setMapping }) => {
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter only active employees for selection
    const activeEmployees = employees.filter(e => e.is_current_month);

    const handleToggleReferrer = (refId: string) => {
        if (!selectedManagerId) return;
        
        setMapping(prev => {
            const currentList = prev[selectedManagerId] || [];
            const isAssigned = currentList.includes(refId);
            
            let newList;
            if (isAssigned) {
                newList = currentList.filter(id => id !== refId);
            } else {
                newList = [...currentList, refId];
            }
            
            return { ...prev, [selectedManagerId]: newList };
        });
    };

    const assignedReferrerIds = selectedManagerId ? (mapping[selectedManagerId] || []) : [];

    const filteredReferrars = referrars.filter(r => 
        r.ref_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.ref_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-full flex flex-col">
            <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-blue-400" />
                Marketing Team Configuration
            </h3>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Select Marketing Manager</label>
                <select 
                    value={selectedManagerId} 
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">-- Select Employee --</option>
                    {activeEmployees.map(emp => (
                        <option key={emp.emp_id} value={emp.emp_id}>{emp.emp_name} ({emp.job_position})</option>
                    ))}
                </select>
            </div>

            {selectedManagerId ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-300">Assign Referrers</span>
                        <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                            {assignedReferrerIds.length} Assigned
                        </span>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search Referrer..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white mb-3"
                    />
                    <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700 p-2 space-y-1">
                        {filteredReferrars.map(ref => {
                            const isChecked = assignedReferrerIds.includes(ref.ref_id);
                            // Check if assigned to OTHER manager
                            const assignedToOther = Object.entries(mapping).find(([mgrId, refs]) => mgrId !== selectedManagerId && (refs as string[]).includes(ref.ref_id));
                            const otherManagerName = assignedToOther ? employees.find(e => e.emp_id === assignedToOther[0])?.emp_name : null;

                            return (
                                <div 
                                    key={ref.ref_id} 
                                    onClick={() => !otherManagerName && handleToggleReferrer(ref.ref_id)}
                                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                                        otherManagerName ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'
                                    } ${isChecked ? 'bg-blue-900/30 border border-blue-500/30' : ''}`}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={isChecked} 
                                        readOnly
                                        disabled={!!otherManagerName}
                                        className="h-4 w-4 rounded border-gray-500 text-blue-600 bg-slate-800 focus:ring-blue-500"
                                    />
                                    <div className="ml-3 flex-1">
                                        <p className={`text-sm font-medium ${isChecked ? 'text-blue-300' : 'text-slate-300'}`}>
                                            {ref.ref_name}
                                        </p>
                                        <p className="text-xs text-slate-500">{ref.ref_degrees}</p>
                                        {otherManagerName && (
                                            <p className="text-[10px] text-amber-500">Assigned to: {otherManagerName}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic">
                    Select a manager to assign referrers.
                </div>
            )}
        </div>
    );
};

// --- Sub-Component: Bar Chart (Reused) ---
const BarChart: React.FC<{ title: string; data: { name: string; value: number }[]; color: string; unit?: string }> = ({ title, data, color, unit = '' }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  
    return (
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md flex flex-col h-full">
        <h4 className="text-lg font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-700">{title}</h4>
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
             <p>No data available for this period.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {data.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs sm:text-sm text-slate-300 font-medium">
                    <span className="truncate pr-2" title={item.name}>{item.name}</span>
                    <span className="font-bold text-slate-100">
                        {unit === 'BDT' ? item.value.toLocaleString('en-IN') : item.value} {unit === 'BDT' ? '৳' : ''}
                    </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                    ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
};

// --- Sub-Component: Marketing Dashboard ---
const MarketingDashboard: React.FC<{
    employees: Employee[];
    referrars: Referrar[];
    invoices: Invoice[];
    mapping: Record<string, string[]>;
}> = ({ employees, referrars, invoices, mapping }) => {
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');
    const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('month');

    // Filter Active Managers who have referrers assigned
    const managersWithTeam = employees.filter(e => mapping[e.emp_id] && mapping[e.emp_id].length > 0);

    const getFilteredInvoices = () => {
        const now = new Date();
        // Set to start of today effectively for comparison logic if needed, 
        // but for range usually we need start date.
        
        let startDate = new Date();
        let endDate = new Date(); // Default end date is now

        switch (selectedFilter) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case '2weeks':
                startDate.setDate(now.getDate() - 14);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of this month
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0); // End of last month
                break;
            case '3months':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6months':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1); // Start of this year
                break;
        }

        // Reset hours for accurate date comparison
        startDate.setHours(0,0,0,0);
        endDate.setHours(23,59,59,999);

        return invoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            return invDate >= startDate && invDate <= endDate && inv.status !== 'Cancelled';
        });
    };

    const filteredInvoices = getFilteredInvoices();
    const assignedRefs = selectedManagerId ? (mapping[selectedManagerId] || []) : [];

    // Calculate Stats
    const stats = useMemo(() => {
        let totalPatients = 0;
        let totalCollection = 0;
        const referrerBreakdown: Record<string, { patients: number, collection: number }> = {};

        // Initialize assigned referrers with 0
        assignedRefs.forEach(refId => {
            const refName = referrars.find(r => r.ref_id === refId)?.ref_name || refId;
            referrerBreakdown[refName] = { patients: 0, collection: 0 };
        });

        filteredInvoices.forEach(inv => {
            if (inv.referrar_id && assignedRefs.includes(inv.referrar_id)) {
                totalPatients++;
                totalCollection += inv.total_amount; // Or use paid_amount if strictly collection

                const refName = inv.referrar_name || referrars.find(r => r.ref_id === inv.referrar_id)?.ref_name || 'Unknown';
                if (!referrerBreakdown[refName]) referrerBreakdown[refName] = { patients: 0, collection: 0 };
                
                referrerBreakdown[refName].patients += 1;
                referrerBreakdown[refName].collection += inv.total_amount;
            }
        });

        const sortedByCollection = Object.entries(referrerBreakdown)
            .map(([name, data]) => ({ name, value: data.collection }))
            .sort((a, b) => b.value - a.value);

        return { totalPatients, totalCollection, sortedByCollection };
    }, [filteredInvoices, assignedRefs, referrars]);

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Control Bar */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-1/3">
                    <label className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Analysis For</label>
                    <select 
                        value={selectedManagerId} 
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">-- Select Marketing Manager --</option>
                        {managersWithTeam.map(emp => (
                            <option key={emp.emp_id} value={emp.emp_id}>{emp.emp_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex bg-slate-900 rounded-lg p-1 overflow-x-auto max-w-full">
                    {timeFilters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                                selectedFilter === filter.id
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {selectedManagerId ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-900/50 to-slate-800 p-6 rounded-xl border border-blue-500/30 shadow-lg flex items-center">
                            <div className="p-4 bg-blue-500/20 rounded-full mr-4">
                                <UsersIcon className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Patients Refferred</p>
                                <h3 className="text-3xl font-bold text-white mt-1">{stats.totalPatients}</h3>
                                <p className="text-xs text-slate-500 mt-1">In selected period</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-900/50 to-slate-800 p-6 rounded-xl border border-emerald-500/30 shadow-lg flex items-center">
                            <div className="p-4 bg-emerald-500/20 rounded-full mr-4">
                                <TrendingUpIcon className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Business Volume</p>
                                <h3 className="text-3xl font-bold text-emerald-400 mt-1">৳ {stats.totalCollection.toLocaleString('en-IN')}</h3>
                                <p className="text-xs text-slate-500 mt-1">Gross Bill Amount</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="flex-1 min-h-[300px]">
                        <BarChart 
                            title={`Referrer Performance Breakdown (${timeFilters.find(f => f.id === selectedFilter)?.label})`} 
                            data={stats.sortedByCollection} 
                            color="bg-blue-500" 
                            unit="BDT" 
                        />
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                    <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg">Please select a Marketing Manager to view analytics.</p>
                    <p className="text-sm">Ensure you have assigned referrers in the "Setup" tab first.</p>
                </div>
            )}
        </div>
    );
};

// --- Main Page ---
const ContributionReportPage: React.FC<ContributionReportPageProps> = ({
  employees,
  referrars,
  invoices,
  employeeReferrerMap,
  setEmployeeReferrerMap,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup'>('dashboard');

  return (
    <div className="bg-slate-900 text-slate-200 rounded-xl p-4 sm:p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 shrink-0">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            Marketing Analytics
        </h2>
        <div className="flex bg-slate-800 rounded-lg p-1">
            <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                    activeTab === 'dashboard' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
                Analytics Dashboard
            </button>
            <button
                onClick={() => setActiveTab('setup')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                    activeTab === 'setup' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
                Team Setup
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
          {activeTab === 'setup' ? (
              <MarketingSetup 
                  employees={employees} 
                  referrars={referrars} 
                  mapping={employeeReferrerMap} 
                  setMapping={setEmployeeReferrerMap} 
              />
          ) : (
              <MarketingDashboard 
                  employees={employees} 
                  referrars={referrars} 
                  invoices={invoices} 
                  mapping={employeeReferrerMap} 
              />
          )}
      </div>
    </div>
  );
};

export default ContributionReportPage;
