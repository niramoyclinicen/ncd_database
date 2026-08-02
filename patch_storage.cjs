const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetStr = `                                const current = JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]');
                                localStorage.setItem('ncd_rt_templates_v1', JSON.stringify([...current, newTpl]));
                                setRtTemplates([...current, newTpl]);
                                setShowSaveTemplateModal(false);
                                setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                setTimeout(() => setSuccessMessage(''), 3000);`;

const replacementStr = `                                try {
                                    const current = JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]');
                                    localStorage.setItem('ncd_rt_templates_v1', JSON.stringify([...current, newTpl]));
                                    setRtTemplates([...current, newTpl]);
                                    setShowSaveTemplateModal(false);
                                    setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                    setTimeout(() => setSuccessMessage(''), 3000);
                                } catch (e: any) {
                                    if (e.name === 'QuotaExceededError' || e.message.includes('exceeded the quota')) {
                                        alert("আপনার ব্রাউজারের স্টোরেজ ফুল হয়ে গেছে (5MB Limit)। দয়া করে কিছু অপ্রয়োজনীয় টেমপ্লেট ডিলিট করুন।");
                                    } else {
                                        alert("Failed to save: " + e.message);
                                    }
                                }`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Patched LabReportingPage successfully");
} else {
    console.log("Could not find targetStr in LabReportingPage");
}
