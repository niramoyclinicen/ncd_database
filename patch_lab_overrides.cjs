const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetStr = `                                try {
                                    const current = JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]');
                                    localStorage.setItem('ncd_rt_templates_v1', JSON.stringify([...current, newTpl]));
                                    setRtTemplates([...current, newTpl]);
                                    setShowSaveTemplateModal(false);
                                    setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                    setTimeout(() => setSuccessMessage(''), 3000);
                                    if (performBlockingSync) performBlockingSync();
                                } catch (e: any) {`;

const replacementStr = `                                try {
                                    const current = JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]');
                                    const updated = [...current, newTpl];
                                    try { localStorage.setItem('ncd_rt_templates_v1', JSON.stringify(updated)); } catch(e){}
                                    setRtTemplates(updated);
                                    setShowSaveTemplateModal(false);
                                    setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                    setTimeout(() => setSuccessMessage(''), 3000);
                                    if (performBlockingSync) performBlockingSync({ rtTemplates: updated });
                                } catch (e: any) {`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Patched LabReportingPage overrides");
} else {
    console.log("Not found in LabReportingPage overrides");
}
