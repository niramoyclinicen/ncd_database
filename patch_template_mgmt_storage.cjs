const fs = require('fs');
let content = fs.readFileSync('components/TemplateManagementPage.tsx', 'utf8');

const targetStr = `    useEffect(() => {
        localStorage.setItem('ncd_rt_templates_v1', JSON.stringify(templates));
    }, [templates]);`;

const replacementStr = `    useEffect(() => {
        try {
            localStorage.setItem('ncd_rt_templates_v1', JSON.stringify(templates));
        } catch(e: any) {
            if (e.name === 'QuotaExceededError' || e.message.includes('exceeded the quota')) {
                alert("আপনার ব্রাউজারের স্টোরেজ ফুল হয়ে গেছে (5MB Limit)। দয়া করে কিছু অপ্রয়োজনীয় টেমপ্লেট ডিলিট করুন।");
            } else {
                console.error("Failed to save to localStorage:", e);
            }
        }
    }, [templates]);`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('components/TemplateManagementPage.tsx', content);
    console.log("Patched TemplateManagementPage successfully");
} else {
    console.log("Could not find targetStr in TemplateManagementPage");
}
