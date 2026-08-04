const fs = require('fs');
let content = fs.readFileSync('components/AdminSettings.tsx', 'utf8');

const targetStr = `    const handleDeepRecovery = async () => {
        const recoveredData = dbService.deepScanRecovery();
        if (!recoveredData || Object.keys(recoveredData).length === 0) {
            alert("ব্রাউজারে কোন পুরাতন ডাটা পাওয়া যায়নি!");
            return;
        }

        const patientCount = (recoveredData.patients || []).length;
        const invoiceCount = (recoveredData.labInvoices || []).length;
        
        const confirmRestore = window.confirm(\`গভীর অনুসন্ধানে (Deep Scan) ডাটা পাওয়া গেছে:\n- রোগী: \${patientCount}\n- ইনভয়েস: \${invoiceCount}\n\nআপনি কি এই ডাটাগুলো ক্লাউডে (Supabase) রিস্টোর করতে চান? এটি বর্তমান ডাটাকে রিপ্লেস করবে।\`);
        
        if (!confirmRestore) return;

        setIsRestoring(true);
        setRestoreProgress(0);
        try {
            const success = await dbService.saveInChunks(recoveredData, (p) => setRestoreProgress(p));
            if (success) {
                alert("সফলভাবে পুরাতন ডাটা রিকভার করা হয়েছে! পেজটি রিলোড হবে।");
                window.location.reload();
            }
        } catch (e) {
            alert("Failed to recover data.");
        } finally {
            setIsRestoring(false);
            setRestoreProgress(0);
        }
    };`;

const replacementStr = `    const handleDeepRecovery = async () => {
        const recoveredData = dbService.deepScanRecovery();
        if (!recoveredData || Object.keys(recoveredData).length === 0) {
            alert("ব্রাউজারে কোন পুরাতন ডাটা পাওয়া যায়নি!");
            return;
        }

        const patientCount = (recoveredData.patients || []).length;
        const invoiceCount = (recoveredData.labInvoices || []).length;
        
        const targetDate = window.prompt(
            \`গভীর অনুসন্ধানে (Deep Scan) লোকাল ডাটা পাওয়া গেছে:\\n- রোগী: \${patientCount}\\n- ইনভয়েস: \${invoiceCount}\\n\\nযেহেতু অনলাইনে ইতিমধ্যে ডাটা আছে, তাই এটি শুধু মিসিং ডাটাগুলো অনলাইনে যুক্ত করবে (Merge)।\\n\\nআপনি যদি নির্দিষ্ট কোনো দিনের ডাটা পাঠাতে চান, তবে তারিখটি লিখুন (যেমন: 2024-07-16)।\\nসব ডাটা পাঠাতে চাইলে ফাঁকা রেখে OK চাপুন।\`
        );

        if (targetDate === null) return; // User cancelled

        setIsRestoring(true);
        setRestoreProgress(0);
        try {
            const result = await dbService.smartMergeByDate(recoveredData, targetDate.trim(), (p) => setRestoreProgress(p));
            if (result.success) {
                alert(result.message + " পেজটি রিলোড হবে।");
                window.location.reload();
            } else {
                alert("ফেইল: " + result.message);
            }
        } catch (e: any) {
            alert("Failed to recover data: " + e.message);
        } finally {
            setIsRestoring(false);
            setRestoreProgress(0);
        }
    };`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('components/AdminSettings.tsx', content);
    console.log("Patched AdminSettings successfully");
} else {
    console.log("targetStr not found");
}
