const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetStr = `const LabReportingPage: React.FC<any> = ({ invoices, setInvoices, reports, setReports, patients, employees, tests, doctors, performBlockingSync }) => {`;
const replacementStr = `const LabReportingPage: React.FC<any> = ({ invoices, setInvoices, reports, setReports, rtTemplates, setRtTemplates, patients, employees, tests, doctors, performBlockingSync }) => {`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    
    // Remove local state of rtTemplates
    const localStateRegex = /const \[rtTemplates, setRtTemplates\] = useState<any\[\]>\(\(\) => \{[\s\S]*?\}\);/m;
    content = content.replace(localStateRegex, '');

    // Remove local storage effect listener
    const localEffectRegex = /\/\/ Listen for storage events in case they change it in Template Management\s*useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);\s*useEffect\(\(\) => \{ setRtTemplates\(JSON\.parse\(localStorage\.getItem\('ncd_rt_templates_v1'\) \|\| '\[\]'\)\); \}, \[viewMode\]\);/m;
    content = content.replace(localEffectRegex, '');

    // Replace <TemplateManagementPage ... /> to pass rtTemplates
    const templateMgmtRegex = /<TemplateManagementPage onBack=\{\(\) => setViewMode\('reporting'\)\} tests=\{tests\} \/>/;
    content = content.replace(templateMgmtRegex, `<TemplateManagementPage onBack={() => setViewMode('reporting')} tests={tests} templates={rtTemplates} setTemplates={setRtTemplates} performBlockingSync={performBlockingSync} />`);

    // In LabReportingPage handleSaveTemplate to use performBlockingSync
    const handleSaveStr = `setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                    setTimeout(() => setSuccessMessage(''), 3000);`;
    const handleSaveReplace = `setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                    setTimeout(() => setSuccessMessage(''), 3000);
                                    if (performBlockingSync) performBlockingSync();`;
    content = content.replace(handleSaveStr, handleSaveReplace);

    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Patched LabReportingPage.tsx");
} else {
    console.log("Could not find targetStr");
}
