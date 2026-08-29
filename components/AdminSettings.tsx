
import React, { useState } from 'react';
/* Added Activity to the imports from ./Icons */
import { BackIcon, SettingsIcon, SaveIcon, DownloadIcon, TrashIcon, DatabaseIcon, RefreshIcon, Activity } from './Icons';
import { DepartmentPasswords } from '../types';
import { dbService } from '../dbService';

interface AdminSettingsProps {
  passwords: DepartmentPasswords;
  onSave: (newPasswords: DepartmentPasswords) => void;
  onBack: () => void;
  performBlockingSync: (overrides?: any) => Promise<boolean>;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ passwords, onSave, onBack, performBlockingSync }) => {
  const [localPasswords, setLocalPasswords] = useState<DepartmentPasswords>(passwords);
  const [success, setSuccess] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: None, 1: Confirm, 2: Backup Prompt, 3: Final Type Check
  const [finalConfirmText, setFinalConfirmText] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreProgress, setRestoreProgress] = useState(0);
    const [showManualPaste, setShowManualPaste] = useState(false);
    const [pastedJson, setPastedJson] = useState('');

    // Supabase Live DB state
    const supConfig = dbService.getSupabaseConfig();
    const [supabaseUrlInput, setSupabaseUrlInput] = useState(supConfig.url || '');
    const [supabaseKeyInput, setSupabaseKeyInput] = useState(supConfig.key || '');
    const [isTestingSupabase, setIsTestingSupabase] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesFound?: Record<string, number> } | null>(null);
    const [isReloadingFromCloud, setIsReloadingFromCloud] = useState(false);
    const [showConfigInputs, setShowConfigInputs] = useState(!supConfig.isConnected);

    const handleSaveSupabaseConfig = () => {
        if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
            alert("দয়া করে Supabase URL এবং Anon Key দিন!");
            return;
        }
        const ok = dbService.setSupabaseConfig(supabaseUrlInput.trim(), supabaseKeyInput.trim());
        if (ok) {
            alert("Supabase কনফিগারেশন সফলভাবে সেভ হয়েছে!");
            handleTestSupabaseConnection();
        } else {
            alert("Supabase URL বা Key এর ফরম্যাট সঠিক নয়।");
        }
    };

    const handleTestSupabaseConnection = async () => {
        setIsTestingSupabase(true);
        setTestResult(null);
        try {
            const res = await dbService.testConnection();
            setTestResult(res);
        } catch (e: any) {
            setTestResult({ success: false, message: e?.message || "টেস্ট ব্যর্থ হয়েছে" });
        } finally {
            setIsTestingSupabase(false);
        }
    };

    const handleForcePullAllFromCloud = async () => {
        const confirmPull = window.confirm("আপনি কি Supabase ক্লাউড থেকে সব লাইভ ডাটা লোড করে বর্তমান অ্যাপ রিফ্রেশ করতে চান?");
        if (!confirmPull) return;

        setIsReloadingFromCloud(true);
        try {
            const cloudState = await dbService.loadFromCloud();
            if (cloudState && !cloudState._error) {
                await performBlockingSync(cloudState);
                alert("Supabase থেকে সফলভাবে সব ডাটা লোড হয়েছে! পেজ রিলোড হচ্ছে...");
                window.location.reload();
            } else {
                alert("ডাটা ফেচ ব্যর্থ: " + (cloudState?._error || "Unknown error"));
            }
        } catch (e: any) {
            alert("ত্রুটি: " + e.message);
        } finally {
            setIsReloadingFromCloud(false);
        }
    };

    const handleRestoreFromCache = async () => {
        const backup = dbService.getLocalBackup();
        if (!backup || Object.keys(backup).length === 0) {
            alert("এই ব্রাউজারে কোন ব্যাকআপ ডাটা পাওয়া যায়নি! আপনি যদি অন্য কম্পিউটার বা লিঙ্কে ডাটা এন্ট্রি করে থাকেন, তবে ম্যানুয়াল পেস্ট (Manual Paste) অপশনটি ব্যবহার করুন।");
            return;
        }
        processRestore(backup);
    };

    const handleManualRestore = async () => {
        if (!pastedJson.trim()) return;
        try {
            const rawData = JSON.parse(pastedJson);
            const normalized = dbService.normalizeRecoveredData(rawData);
            
            if (Object.keys(normalized).length < 2) {
                alert("সঠিক ডাটা পাওয়া যায়নি! দয়া করে পুরো টেক্সটটি কপি করে পেস্ট করুন।");
                return;
            }
            processRestore(normalized);
        } catch (e) {
            alert("ডাটা ফরম্যাট সঠিক নয়! ব্রাউজার কনসোল থেকে পুরো টেক্সটটি কপি করুন।");
        }
    };

    const isConnected = dbService.isSupabaseConnected();

    const processRestore = async (backup: any) => {
        const entitiesFound = Object.entries(backup)
            .filter(([_, v]) => Array.isArray(v) && v.length > 0)
            .map(([k, v]) => `- ${k}: ${(v as any[]).length}`)
            .join('\n');
        
        if (!entitiesFound) {
            alert("পিক আপ করার মতো কোন ডাটা পাওয়া যায়নি! দয়া করে সঠিক কোডটি কপি করেছেন কিনা নিশ্চিত হয়ে নিন।");
            return;
        }

        const confirmRestore = window.confirm(`নিচের ডাটাগুলো পাওয়া গেছে:\n${entitiesFound}\n\nআপনি কি এই ডাটাগুলো ক্লাউডে (Supabase) রিস্টোর করতে চান? এটি বর্তমান ডাটাকে রিপ্লেস করবে।`);
        
        if (!confirmRestore) return;

        setIsRestoring(true);
        setRestoreProgress(0);
        try {
            const success = await dbService.saveInChunks(backup, (p) => setRestoreProgress(p));
            if (success) {
                alert("সফলভাবে ডাটা ক্লাউডে রিস্টোর করা হয়েছে! এখন অন্য সব কম্পিউটার থেকেও এই ডাটা দেখা যাবে।");
                window.location.reload();
            } else {
                alert("রিস্টোর ব্যর্থ হয়েছে। ইন্টারনেট কানেকশন চেক করুন।");
            }
        } catch (e) {
            alert("একটি ত্রুটি ঘটেছে!");
        } finally {
            setIsRestoring(false);
            setRestoreProgress(0);
        }
    };

    const handleDeepRecovery = async () => {
        const recoveredData = dbService.deepScanRecovery();
        if (!recoveredData || Object.keys(recoveredData).length === 0) {
            alert("ব্রাউজারে কোন পুরাতন ডাটা পাওয়া যায়নি!");
            return;
        }

        const patientCount = (recoveredData.patients || []).length;
        const invoiceCount = (recoveredData.labInvoices || []).length;
        
        const targetDate = window.prompt(
            `গভীর অনুসন্ধানে (Deep Scan) লোকাল ডাটা পাওয়া গেছে:
- রোগী: ${patientCount}
- ইনভয়েস: ${invoiceCount}

যেহেতু অনলাইনে ইতিমধ্যে ডাটা আছে, তাই এটি শুধু নতুন/মিসিং ডাটাগুলো অনলাইনে যুক্ত করবে (Merge)।

আপনি যদি নির্দিষ্ট কোনো দিনের ডাটা পাঠাতে চান, তবে তারিখটি লিখুন (যেমন: 2026-07-20)।
সব ডাটা পাঠাতে চাইলে ফাঁকা রেখে OK চাপুন।`
        );

        if (targetDate === null) return; // User cancelled

        setIsRestoring(true);
        setRestoreProgress(0);
        try {
            const result = await dbService.smartMergeByDate(recoveredData, targetDate.trim(), (p) => setRestoreProgress(p));
            if (result?.success) {
                alert(result.message + " পেজটি রিলোড হবে।");
                window.location.reload();
            } else {
                alert("ফেইল: " + (result?.message || 'Unknown error'));
            }
        } catch (e: any) {
            alert("Failed to recover data: " + e.message);
        } finally {
            setIsRestoring(false);
            setRestoreProgress(0);
        }
    };

    // Date Range Inspector State & Function
    const [scanStartDate, setScanStartDate] = useState('2026-07-20');
    const [scanEndDate, setScanEndDate] = useState('2026-08-31');
    const [scanSummary, setScanSummary] = useState<{ counts: Record<string, number>; items: any; total: number } | null>(null);

    const handleScanDateRange = () => {
        const backup = dbService.deepScanRecovery() || dbService.getLocalBackup();
        if (!backup || Object.keys(backup).length === 0) {
            alert("ব্রাউজারে কোনো লোকাল ব্যাকআপ ডাটা পাওয়া যায়নি!");
            return;
        }

        const counts: Record<string, number> = {};
        const filteredItems: Record<string, any[]> = {};
        let totalFound = 0;

        const start = new Date(scanStartDate).getTime();
        const end = new Date(scanEndDate + 'T23:59:59').getTime();

        Object.keys(backup).forEach(key => {
            const val = backup[key];
            if (!Array.isArray(val)) return;

            const matches = val.filter((item: any) => {
                let itemDateStr = item.date || item.invoice_date || item.createdAt || item.payment_date || item.expense_date || item.usageStartDate;
                if (!itemDateStr) return false;
                if (typeof itemDateStr === 'string') {
                    itemDateStr = itemDateStr.split('T')[0];
                }
                const itemTime = new Date(itemDateStr).getTime();
                return !isNaN(itemTime) && itemTime >= start && itemTime <= end;
            });

            if (matches.length > 0) {
                counts[key] = matches.length;
                filteredItems[key] = matches;
                totalFound += matches.length;
            }
        });

        setScanSummary({ counts, items: filteredItems, total: totalFound });
    };

    const handlePushRangeToCloud = async () => {
        if (!scanSummary || scanSummary.total === 0) return;
        
        const confirmPush = window.confirm(`মোট ${scanSummary.total} টি লোকাল এন্ট্রি পাওয়া গেছে (${scanStartDate} থেকে ${scanEndDate})। আপনি কি এগুলো অনলাইনে (Supabase) পাঠাতে চান?`);
        if (!confirmPush) return;

        setIsRestoring(true);
        setRestoreProgress(0);
        try {
            // Merge all items for each key
            const fullBackup = dbService.deepScanRecovery() || {};
            const result = await dbService.smartMergeByDate(fullBackup, '', (p) => setRestoreProgress(p));
            if (result?.success) {
                alert("সফলভাবে লোকাল ডাটা অনলাইনে আপডেট করা হয়েছে! পেজ রিলোড হচ্ছে...");
                window.location.reload();
            } else {
                alert("আপডেট ব্যর্থ হয়েছে: " + (result?.message || 'Unknown error'));
            }
        } catch (e: any) {
            alert("Error syncing: " + e.message);
        } finally {
            setIsRestoring(false);
            setRestoreProgress(0);
        }
    };

    const handleDownloadRangeJSON = () => {
        if (!scanSummary || scanSummary.total === 0) return;
        const blob = new Blob([JSON.stringify(scanSummary.items, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NCD_Local_Data_${scanStartDate}_to_${scanEndDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Cloud Snapshots Inspector State & Handler
    const [cloudRows, setCloudRows] = useState<any[]>([]);
    const [isFetchingCloudRows, setIsFetchingCloudRows] = useState(false);
    const [cloudExtractStartDate, setCloudExtractStartDate] = useState('2026-07-20');
    const [cloudExtractEndDate, setCloudExtractEndDate] = useState('2026-08-02');
    const [cloudExtractedData, setCloudExtractedData] = useState<{ counts: Record<string, number>; payload: any; total: number } | null>(null);

    const handleFetchCloudAllSnapshots = async () => {
        setIsFetchingCloudRows(true);
        try {
            const rows = await dbService.fetchAllCloudRows();
            if (!rows || rows.length === 0) {
                alert("Supabase অনলাইনে 'ncd_state' টেবিলে কোনো ডাটা রো পাওয়া যায়নি!");
            } else {
                setCloudRows(rows);
                alert(`Supabase থেকে মোট ${rows.length} টি ক্লাউড স্ন্যাপশট ডাটা রো পাওয়া গেছে!`);
            }
        } catch (e: any) {
            alert("ক্লাউড ডাটা আনতে সমস্যা হয়েছে: " + e.message);
        } finally {
            setIsFetchingCloudRows(false);
        }
    };

    const handleExtractCloudByDateRange = async () => {
        setIsFetchingCloudRows(true);
        try {
            const rows = await dbService.fetchAllCloudRows();
            if (!rows || rows.length === 0) {
                alert("Supabase অনলাইনে 'ncd_state' টেবিলে কোনো ডাটা পাওয়া যায়নি!");
                return;
            }
            setCloudRows(rows);

            const start = new Date(cloudExtractStartDate).getTime();
            const end = new Date(cloudExtractEndDate + 'T23:59:59').getTime();

            const combinedPayload: Record<string, any[]> = {};
            const itemCounts: Record<string, number> = {};
            let totalItemCount = 0;

            // Iterate through all fetched rows from Supabase
            rows.forEach((row: any) => {
                const data = row.data;
                if (!data || typeof data !== 'object') return;

                Object.keys(data).forEach(key => {
                    const val = data[key];
                    if (Array.isArray(val)) {
                        const matches = val.filter((item: any) => {
                            if (!item) return false;
                            let dateStr = item.date || item.invoice_date || item.createdAt || item.payment_date || item.expense_date || item.usageStartDate;
                            if (!dateStr) return false;
                            if (typeof dateStr === 'string') dateStr = dateStr.split('T')[0];
                            const time = new Date(dateStr).getTime();
                            return !isNaN(time) && time >= start && time <= end;
                        });

                        if (matches.length > 0) {
                            if (!combinedPayload[key]) combinedPayload[key] = [];
                            // Append and deduplicate by id or invoice_number
                            matches.forEach((m: any) => {
                                const mId = m.id || m.invoice_no || m.patient_id || m.report_id || m.receipt_no;
                                const exists = mId ? combinedPayload[key].some((x: any) => (x.id || x.invoice_no || x.patient_id || x.report_id || x.receipt_no) === mId) : false;
                                if (!exists) {
                                    combinedPayload[key].push(m);
                                }
                            });
                        }
                    }
                });
            });

            // Calculate total counts
            Object.keys(combinedPayload).forEach(k => {
                const cnt = combinedPayload[k].length;
                itemCounts[k] = cnt;
                totalItemCount += cnt;
            });

            setCloudExtractedData({
                counts: itemCounts,
                payload: combinedPayload,
                total: totalItemCount
            });

            if (totalItemCount === 0) {
                alert(`Supabase ক্লাউডে ${cloudExtractStartDate} থেকে ${cloudExtractEndDate} তারিখের মধ্যে কোনো ডাটা আইটেম মিলেনি।`);
            } else {
                alert(`Supabase থেকে ${cloudExtractStartDate} থেকে ${cloudExtractEndDate} তারিখের মোট ${totalItemCount} টি নির্দিষ্ট আইটেম সফলভাবে ফিল্টার করা হয়েছে!`);
            }
        } catch (e: any) {
            alert("Supabase ডাটা ফিল্টার করতে ত্রুটি: " + e.message);
        } finally {
            setIsFetchingCloudRows(false);
        }
    };

    const handleMergeExtractedCloudData = async () => {
        if (!cloudExtractedData || cloudExtractedData.total === 0) return;
        const confirmMerge = window.confirm(`আপনি কি Supabase থেকে ফিল্টারকৃত ${cloudExtractStartDate} থেকে ${cloudExtractEndDate} এর ${cloudExtractedData.total} টি ডাটা আইটেম লাইভ অ্যাপে যুক্ত (Merge) করতে চান?`);
        if (!confirmMerge) return;

        setIsRestoring(true);
        setRestoreProgress(0);
        try {
            const result = await dbService.smartMergeByDate(cloudExtractedData.payload, '', (p) => setRestoreProgress(p));
            if (result?.success) {
                alert("সফলভাবে ২০ জুলাই - ২ আগস্ট এর ক্লাউড ডাটা বর্তমান অ্যাপে যুক্ত করা হয়েছে! পেজ রিফ্রেশ হচ্ছে...");
                window.location.reload();
            } else {
                alert("মার্চ ব্যর্থ হয়েছে: " + (result?.message || 'Unknown error'));
            }
        } catch (e: any) {
            alert("Error merging extracted cloud data: " + e.message);
        } finally {
            setIsRestoring(false);
            setRestoreProgress(0);
        }
    };

    const handleDownloadExtractedCloudJSON = () => {
        if (!cloudExtractedData || cloudExtractedData.total === 0) return;
        const blob = new Blob([JSON.stringify(cloudExtractedData.payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Supabase_Cloud_Data_${cloudExtractStartDate}_to_${cloudExtractEndDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadCloudRow = (row: any) => {
        const blob = new Blob([JSON.stringify(row.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Supabase_NCD_State_Row_${row.id}_${row.updated_at || 'data'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleMergeCloudRow = async (row: any) => {
        if (!row || !row.data) return;
        const confirmMerge = window.confirm(`আপনি কি Supabase Row #${row.id} (${row.updated_at || 'Date N/A'}) এর ডাটা বর্তমান লাইভ অ্যাপে যুক্ত (Merge) করতে চান?`);
        if (!confirmMerge) return;

        setIsRestoring(true);
        setRestoreProgress(0);
        try {
            const result = await dbService.smartMergeByDate(row.data, '', (p) => setRestoreProgress(p));
            if (result?.success) {
                alert("সফলভাবে ক্লাউড রেকর্ড মার্চ করা হয়েছে! পেজ রিলোড হচ্ছে...");
                window.location.reload();
            } else {
                alert("মার্চ ব্যর্থ হয়েছে: " + (result?.message || 'Unknown error'));
            }
        } catch (e: any) {
            alert("Error merging cloud row: " + e.message);
        } finally {
            setIsRestoring(false);
            setRestoreProgress(0);
        }
    };

    const handleDeduplicateExpenses = async () => {
        const confirmClean = window.confirm("আপনি কি সমস্ত খরচের হিসাব (Detailed Expenses) থেকে ডুপ্লিকেট/ডাবল এন্ট্রি স্বয়ংক্রিয়ভাবে ক্লিন করে সুপাবেজ ক্লাউডে আপডেট করতে চান?");
        if (!confirmClean) return;

        setIsRestoring(true);
        setRestoreProgress(0);
        try {
            const result = await dbService.cleanDuplicateExpenses((p) => setRestoreProgress(p));
            if (result?.success) {
                alert(`সফলভাবে ডুপ্লিকেট খরচ ক্লিন করা হয়েছে! মোট ${result.cleanedCount} টি ডাবল এন্ট্রি সরানো হয়েছে। পেজ রিলোড হচ্ছে...`);
                window.location.reload();
            } else {
                alert("ক্লিন সম্পন্ন: " + (result?.message || 'কোন ডুপ্লিকেট এন্ট্রি পাওয়া যায়নি।'));
            }
        } catch (e: any) {
            alert("ডুপ্লিকেট ক্লিন করতে সমস্যা: " + e.message);
        } finally {
            setIsRestoring(false);
            setRestoreProgress(0);
        }
    };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (performBlockingSync) {
        const success = await performBlockingSync({ passwords: localPasswords });
        if (success) {
            onSave(localPasswords);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
    } else {
        onSave(localPasswords);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleDownloadBackup = () => {
    const allData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('ncd_')) {
            try {
                allData[key] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch (e) {
                allData[key] = localStorage.getItem(key);
            }
        }
    }
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NCD_Master_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (resetStep === 2) setResetStep(3); // Proceed to final step if in reset flow
  };

  const executeFullReset = () => {
      if (finalConfirmText !== 'RESET') {
          alert("ভুল টাইপ করেছেন! পুনরায় চেষ্টা করুন।");
          return;
      }
      
      // Clear all keys starting with ncd_
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('ncd_')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      alert("সফলভাবে পুরো সিস্টেম রিসেট করা হয়েছে। পেজটি রিলোড হবে।");
      window.location.reload();
  };

  const inputClass = "w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-4xl rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col mb-10">
        <div className="p-8 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                    <SettingsIcon className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">System Control Panel</h2>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Configuration & Security</p>
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className={`text-[8px] font-black uppercase ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isConnected ? 'Cloud Connected' : 'Cloud Disconnected'}
                        </span>
                    </div>
                </div>
            </div>
            <button onClick={onBack} className="p-3 bg-slate-800 rounded-2xl hover:bg-rose-600 transition-all group shadow-xl">
                <BackIcon className="w-6 h-6 text-slate-400 group-hover:text-white"/>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* PASSWORDS SECTION */}
            <form onSubmit={handleSave} className="lg:col-span-7 p-10 space-y-8 border-r border-slate-800">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><RefreshIcon size={14}/> Access Security Keys</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Admin Panel Key</label><input type="text" value={localPasswords.ADMIN} onChange={e=>setLocalPasswords({...localPasswords, ADMIN: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Diagnostic Key</label><input type="text" value={localPasswords.DIAGNOSTIC} onChange={e=>setLocalPasswords({...localPasswords, DIAGNOSTIC: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Lab Reporting Key</label><input type="text" value={localPasswords.LAB_REPORTING} onChange={e=>setLocalPasswords({...localPasswords, LAB_REPORTING: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Clinic Key</label><input type="text" value={localPasswords.CLINIC} onChange={e=>setLocalPasswords({...localPasswords, CLINIC: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Medicine Key</label><input type="text" value={localPasswords.MEDICINE} onChange={e=>setLocalPasswords({...localPasswords, MEDICINE: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Accounting Key</label><input type="text" value={localPasswords.ACCOUNTING} onChange={e=>setLocalPasswords({...localPasswords, ACCOUNTING: e.target.value})} className={inputClass} /></div>
                </div>
                <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                    {success && <span className="text-emerald-400 font-bold animate-pulse text-xs">✓ Passwords Updated!</span>}
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl flex items-center gap-2 transition-all">
                        <SaveIcon size={14}/> Save Settings
                    </button>
                </div>
            </form>

            {/* MAINTENANCE SECTION */}
            <div className="lg:col-span-5 p-10 bg-slate-950/30 space-y-8">
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><DatabaseIcon size={14}/> System Maintenance</h3>
                
                <div className="space-y-4">
                    {/* SUPABASE LIVE DATABASE HUB */}
                    <div className="bg-slate-900 border border-emerald-500/40 p-5 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${supConfig.isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${supConfig.isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                </span>
                                <span className="text-xs font-black text-white uppercase tracking-wider">
                                    Supabase লাইভ ক্লাউড ডাটাবেজ
                                </span>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${supConfig.isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                                {supConfig.isConnected ? '✓ ক্লাউড কানেক্টেড' : '✕ ডিসকানেক্টেড'}
                            </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed">
                            সরাসরি অনলাইন Supabase ডাটাবেজ থেকে আপনার আগের সংরক্ষিত সব ডাটা (রোগী, ল্যাব ইনভয়েস, টেস্ট, ডাক্তার ইত্যাদি) লোড ও নিরীক্ষণ করুন।
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleTestSupabaseConnection}
                                disabled={isTestingSupabase}
                                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-black py-2.5 px-3 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                            >
                                <Activity size={14} className={isTestingSupabase ? 'animate-spin' : ''} />
                                {isTestingSupabase ? 'স্ক্যান হচ্ছে...' : '🔍 টেস্ট ও ক্লাউড টেবিল স্ক্যান'}
                            </button>

                            <button
                                type="button"
                                onClick={handleForcePullAllFromCloud}
                                disabled={isReloadingFromCloud}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 px-3 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                            >
                                <RefreshIcon size={14} className={isReloadingFromCloud ? 'animate-spin' : ''} />
                                {isReloadingFromCloud ? 'লোড হচ্ছে...' : '⚡ ক্লাউড থেকে সব ডাটা লোড'}
                            </button>
                        </div>

                        {testResult && (
                            <div className={`p-3 rounded-xl text-xs space-y-2 border ${testResult.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'}`}>
                                <div className="font-bold flex items-center justify-between">
                                    <span>{testResult.message}</span>
                                </div>
                                {testResult.tablesFound && Object.keys(testResult.tablesFound).length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                                        <div className="text-[10px] font-black text-amber-400 uppercase mb-1">ক্লাউডে পাওয়া টেবিল ও ডাটা সংখ্যা:</div>
                                        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                                            {Object.entries(testResult.tablesFound).map(([tbl, cnt]) => (
                                                <div key={tbl} className="flex justify-between bg-slate-900/80 px-2 py-1 rounded">
                                                    <span className="text-slate-300 font-bold">{tbl}:</span>
                                                    <span className="text-emerald-400 font-black">{cnt} টি</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-2 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowConfigInputs(!showConfigInputs)}
                                className="text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                            >
                                {showConfigInputs ? '▼ Supabase কী কনফিগারেশন লুকান' : '⚙️ Supabase URL ও Key পরিবর্তন / যুক্ত করুন'}
                            </button>

                            {showConfigInputs && (
                                <div className="mt-3 space-y-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 animate-fade-in">
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Supabase Project URL</label>
                                        <input
                                            type="text"
                                            value={supabaseUrlInput}
                                            onChange={e => setSupabaseUrlInput(e.target.value)}
                                            placeholder="https://xyzcompany.supabase.co"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Supabase Anon Key</label>
                                        <input
                                            type="password"
                                            value={supabaseKeyInput}
                                            onChange={e => setSupabaseKeyInput(e.target.value)}
                                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-500 font-mono"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSaveSupabaseConfig}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-black py-2 rounded-lg uppercase tracking-wider transition-all shadow"
                                    >
                                        💾 Supabase ক্রেডেনশিয়াল সেভ ও কানেক্ট করুন
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleRestoreFromCache} 
                        disabled={isRestoring}
                        className="w-full bg-emerald-900/20 hover:bg-emerald-600 border border-emerald-900/50 p-5 rounded-2xl flex flex-col items-center justify-between group transition-all disabled:opacity-50 overflow-hidden relative"
                    >
                        {isRestoring && restoreProgress > 0 && (
                            <div className="absolute inset-0 bg-emerald-600/30 transition-all duration-300" style={{ width: `${restoreProgress}%` }} />
                        )}
                        <div className="flex items-center justify-between w-full relative z-10">
                            <div className="text-left">
                                <span className="block text-emerald-500 group-hover:text-white font-black text-sm uppercase">
                                    {isRestoring ? `Restoring (${restoreProgress}%)` : 'Emergency Restore'}
                                </span>
                                <span className="text-[9px] text-emerald-900 group-hover:text-emerald-100 font-bold uppercase">Recover from local cache (Browser)</span>
                            </div>
                            <RefreshIcon size={24} className={`text-emerald-600 group-hover:text-white transition-all ${isRestoring ? 'animate-spin' : ''}`} />
                        </div>
                    </button>

                    <button 
                        onClick={handleDeepRecovery} 
                        disabled={isRestoring}
                        className="w-full bg-blue-900/20 hover:bg-blue-600 border border-blue-900/50 p-5 rounded-2xl flex flex-col items-center justify-between group transition-all disabled:opacity-50 overflow-hidden relative"
                    >
                        {isRestoring && restoreProgress > 0 && (
                            <div className="absolute inset-0 bg-blue-600/30 transition-all duration-300" style={{ width: `${restoreProgress}%` }} />
                        )}
                        <div className="flex items-center justify-between w-full relative z-10">
                            <div className="text-left">
                                <span className="block text-blue-500 group-hover:text-white font-black text-sm uppercase">
                                    {isRestoring ? `Deep Scanning (${restoreProgress}%)` : 'Deep Scan Recovery'}
                                </span>
                                <span className="text-[9px] text-blue-900 group-hover:text-blue-100 font-bold uppercase">Scan all legacy keys for lost data</span>
                            </div>
                            <DatabaseIcon size={24} className={`text-blue-600 group-hover:text-white transition-all ${isRestoring ? 'animate-spin' : ''}`} />
                        </div>
                    </button>

                    {/* DATE RANGE INSPECTOR & SCANNER TOOL */}
                    <div className="bg-slate-900/90 border border-amber-500/30 p-5 rounded-2xl space-y-3 shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                🔍 তারিখভিত্তিক লোকাল ডাটা ফিল্টার ও স্ক্যান
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug font-medium">
                            আপনার ব্রাউজারে সংরক্ষিত লোকাল স্টোরে নির্দিষ্ট তারিখের (যেমন: ২০ জুলাই - ৩১ আগস্ট) কোনো মিসিং ডাটা আছে কিনা তা স্ক্যান করে দেখুন ও অনলাইনে পাঠান:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">শুরুর তারিখ</label>
                                <input 
                                    type="date" 
                                    value={scanStartDate} 
                                    onChange={e => setScanStartDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">শেষ তারিখ</label>
                                <input 
                                    type="date" 
                                    value={scanEndDate} 
                                    onChange={e => setScanEndDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleScanDateRange}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs py-2 rounded-xl uppercase tracking-wider transition-all shadow-md"
                        >
                            🔎 লোকাল ডাটা স্ক্যান করুন
                        </button>

                        {scanSummary && (
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mt-2 animate-fade-in">
                                <div className="text-xs font-black text-emerald-400 border-b border-slate-800 pb-1 flex justify-between">
                                    <span>স্ক্যান ফলাফল:</span>
                                    <span>মোট {scanSummary.total} টি রেকর্ড পাওয়া গেছে</span>
                                </div>
                                {scanSummary.total === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">এই তারিখের মধ্যে লোকাল স্টোরেজ এ কোনো ডাটা পাওয়া যায়নি।</p>
                                ) : (
                                    <>
                                        <div className="max-h-32 overflow-y-auto space-y-1 text-[10px] font-mono text-slate-300">
                                            {Object.entries(scanSummary.counts).map(([k, count]) => (
                                                <div key={k} className="flex justify-between py-0.5 border-b border-slate-900">
                                                    <span className="text-amber-300 font-bold">{k}:</span>
                                                    <span className="text-white font-black">{count} টি</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                                            <button 
                                                onClick={handlePushRangeToCloud}
                                                disabled={isRestoring}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black py-2 rounded-lg uppercase tracking-wider transition-all"
                                            >
                                                ☁️ অনলাইনে পাঠান
                                            </button>
                                            <button 
                                                onClick={handleDownloadRangeJSON}
                                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black py-2 rounded-lg uppercase tracking-wider transition-all"
                                            >
                                                📥 JSON ডাউনলোড
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* DEDUPLICATE EXPENSES CLEANING TOOL */}
                    <div className="bg-slate-900/90 border border-rose-500/30 p-5 rounded-2xl space-y-3 shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                🧹 ডুপ্লিকেট খরচ ও স্যালারি ক্লিন টুল (One-Click Fix)
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug font-medium">
                            একাধিকবার ডাটা রিস্টোর বা মার্জ করার কারণে স্টাফ স্যালারি বা অন্যান্য খরচ যদি ডাবল (দ্বিগুণ) হয়ে থাকে, তবে এই বাটনে চাপলে স্বয়ংক্রিয়ভাবে ডুপ্লিকেট এন্ট্রিগুলো বাদ দিয়ে হিসাবটি নিখুঁত ও সঠিক করা হবে।
                        </p>
                        <button 
                            onClick={handleDeduplicateExpenses}
                            disabled={isRestoring}
                            className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <TrashIcon size={14} />
                            {isRestoring ? 'ক্লিন হচ্ছে...' : '⚡ সকল ডুপ্লিকেট খরচ ও ডাবল স্যালারি ক্লিন করুন'}
                        </button>
                    </div>

                    {/* SUPABASE CLOUD DATA RECOVERY CARD */}
                    <div className="bg-slate-900/90 border border-sky-500/30 p-5 rounded-2xl space-y-3 shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                                ☁️ Supabase ক্লাউড থেকে ডাটা ফেচ ও তারিখ ফিল্টার (২০ জুলাই - ২ আগস্ট)
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug font-medium">
                            অনলাইনে (Supabase) সেভ থাকা সকল ডাটা স্ন্যাপশট স্ক্যান করে আপনার পছন্দমতো তারিখের (যেমন: ২০ জুলাই - ২ আগস্ট) ডাটা আলাদা করুন এবং সরাসরি লাইভ অ্যাপে মার্চ করুন:
                        </p>

                        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                            <div>
                                <label className="block text-[9px] font-bold text-sky-400 uppercase mb-1">ক্লাউড শুরুর তারিখ</label>
                                <input 
                                    type="date" 
                                    value={cloudExtractStartDate} 
                                    onChange={e => setCloudExtractStartDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-sky-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-sky-400 uppercase mb-1">ক্লাউড শেষ তারিখ</label>
                                <input 
                                    type="date" 
                                    value={cloudExtractEndDate} 
                                    onChange={e => setCloudExtractEndDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-sky-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={handleExtractCloudByDateRange}
                                disabled={isFetchingCloudRows}
                                className="bg-sky-600 hover:bg-sky-500 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1"
                            >
                                {isFetchingCloudRows ? 'স্ক্যান হচ্ছে...' : '🔍 Supabase থেকে তারিখভিত্তিক ডাটা এক্সট্র্যাক্ট করুন'}
                            </button>
                            <button 
                                onClick={handleFetchCloudAllSnapshots}
                                disabled={isFetchingCloudRows}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all border border-slate-700"
                            >
                                📦 সকল স্ন্যাপশট তালিকা দেখুন
                            </button>
                        </div>

                        {cloudExtractedData && (
                            <div className="bg-slate-950 p-3.5 rounded-xl border border-sky-500/40 space-y-2.5 mt-2 animate-fade-in shadow-2xl">
                                <div className="text-xs font-black text-emerald-400 border-b border-slate-800 pb-1.5 flex justify-between">
                                    <span>Supabase ফিল্টার ফলাফল ({cloudExtractStartDate} থেকে {cloudExtractEndDate}):</span>
                                    <span className="text-amber-400">মোট {cloudExtractedData.total} টি আইটেম</span>
                                </div>
                                {cloudExtractedData.total === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">Supabase ক্লাউডে এই তারিখের মধ্যে কোনো ডাটা আইটেম পাওয়া যায়নি।</p>
                                ) : (
                                    <>
                                        <div className="max-h-36 overflow-y-auto space-y-1 text-[10px] font-mono text-slate-300">
                                            {Object.entries(cloudExtractedData.counts).map(([k, count]) => (
                                                <div key={k} className="flex justify-between py-0.5 border-b border-slate-900">
                                                    <span className="text-sky-300 font-bold">{k}:</span>
                                                    <span className="text-emerald-400 font-black">{count} টি</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                                            <button 
                                                onClick={handleMergeExtractedCloudData}
                                                disabled={isRestoring}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 rounded-lg uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1"
                                            >
                                                🔄 অ্যাপে যুক্ত (Merge) করুন
                                            </button>
                                            <button 
                                                onClick={handleDownloadExtractedCloudJSON}
                                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black py-2.5 rounded-lg uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1"
                                            >
                                                📥 JSON ডাউনলোড
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {cloudRows.length > 0 && (
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mt-2">
                                <div className="text-xs font-black text-sky-400 border-b border-slate-800 pb-1 flex justify-between">
                                    <span>Supabase টেবিল রেকর্ডসমূহ:</span>
                                    <span>মোট {cloudRows.length} টি স্ন্যাপশট</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-2 pt-1">
                                    {cloudRows.map((row: any) => (
                                        <div key={row.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="text-xs font-black text-white">Row ID: #{row.id}</div>
                                                <div className="text-[9px] text-slate-400">আপডেট: {row.updated_at ? new Date(row.updated_at).toLocaleString('bn-BD') : 'N/A'}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => handleDownloadCloudRow(row)}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black px-2 py-1 rounded"
                                                >
                                                    📥 JSON
                                                </button>
                                                <button 
                                                    onClick={() => handleMergeCloudRow(row)}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded"
                                                >
                                                    🔄 মার্চ করুন
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <button 
                            onClick={() => setShowManualPaste(!showManualPaste)} 
                            className="text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
                        >
                            {showManualPaste ? 'Hide Manual Recovery' : 'Try Manual Recovery (Paste JSON)'}
                        </button>
                        
                        {showManualPaste && (
                            <div className="mt-4 space-y-3 animate-fade-in">
                                <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                                    আপনার ব্রাউজার থেকে কপি করা ডাটা (JSON) নিচের বক্সে পেস্ট করুন। এটি আপনার হারানো ডাটা পুনরুদ্ধারে সাহায্য করবে।
                                </p>
                                <textarea 
                                    rows={4}
                                    value={pastedJson}
                                    onChange={(e) => setPastedJson(e.target.value)}
                                    placeholder='{"patients": [...], "labInvoices": [...]}'
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-[10px] font-mono text-blue-300 outline-none focus:border-blue-500 transition-all"
                                />
                                <button 
                                    onClick={handleManualRestore}
                                    disabled={isRestoring || !pastedJson.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-black uppercase text-[10px] disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {isRestoring ? `Restoring (${restoreProgress}%)` : 'Verify & Restore Now'}
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={handleDownloadBackup} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-5 rounded-2xl flex items-center justify-between group transition-all">
                        <div className="text-left">
                            <span className="block text-white font-black text-sm uppercase">Export Backup</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Download all data as JSON</span>
                        </div>
                        <DownloadIcon size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="relative">
                        {resetStep === 0 ? (
                            <button onClick={() => setResetStep(1)} className="w-full bg-rose-900/20 hover:bg-rose-600 border border-rose-900/50 p-5 rounded-2xl flex items-center justify-between group transition-all">
                                <div className="text-left">
                                    <span className="block text-rose-500 group-hover:text-white font-black text-sm uppercase">Factory Reset</span>
                                    <span className="text-[9px] text-rose-900 group-hover:text-rose-200 font-bold uppercase">Wipe all records permanently</span>
                                </div>
                                <TrashIcon size={24} className="text-rose-600 group-hover:text-white group-hover:rotate-12 transition-all" />
                            </button>
                        ) : (
                            <div className="bg-slate-800 p-6 rounded-3xl border-2 border-rose-500 shadow-2xl animate-fade-in space-y-4">
                                {resetStep === 1 && (
                                    <>
                                        <p className="text-xs font-black text-white uppercase text-center">আপনি কি নিশ্চিত যে আপনি সব ডাটা ডিলিট করতে চান?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setResetStep(0)} className="py-2 bg-slate-700 rounded-xl text-xs font-bold">বাতিল</button>
                                            <button onClick={() => setResetStep(2)} className="py-2 bg-rose-600 rounded-xl text-xs font-black">হ্যাঁ, চাই</button>
                                        </div>
                                    </>
                                )}
                                {resetStep === 2 && (
                                    <>
                                        <p className="text-xs font-black text-amber-400 uppercase text-center">রিসেট করার আগে ব্যাকআপ নিতে চান?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setResetStep(3)} className="py-2 bg-slate-700 rounded-xl text-xs font-bold italic">না, প্রয়োজন নেই</button>
                                            <button onClick={handleDownloadBackup} className="py-2 bg-blue-600 rounded-xl text-xs font-black">হ্যাঁ, ব্যাকআপ দিন</button>
                                        </div>
                                    </>
                                )}
                                {resetStep === 3 && (
                                    <>
                                        <p className="text-[10px] font-black text-rose-500 uppercase text-center">চূড়ান্ত ধাপ: নিচের বক্সে 'RESET' লিখুন</p>
                                        <input 
                                            value={finalConfirmText} 
                                            onChange={e=>setFinalConfirmText(e.target.value)} 
                                            className="w-full bg-slate-900 border border-rose-500 p-2 text-center text-white font-black rounded-lg outline-none"
                                            placeholder="RESET টাইপ করুন"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setResetStep(0)} className="py-2 bg-slate-700 rounded-xl text-xs font-bold">বাতিল</button>
                                            <button onClick={executeFullReset} className="py-2 bg-rose-600 rounded-xl text-xs font-black shadow-lg shadow-rose-900/50">RESET NOW</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-inner">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Database Integrity</span>
                    </div>
                    <p className="text-[9px] text-slate-600 leading-relaxed italic">The system automatically saves data to your local browser storage. For maximum security, we recommend downloading a master backup every week.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
