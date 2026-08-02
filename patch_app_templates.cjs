const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

if (!content.includes('rtTemplates')) {
    const stateRegex = /const \[reports, setReports\] = useState<LabReport\[\]>\(\[\]\);/;
    content = content.replace(stateRegex, "const [reports, setReports] = useState<LabReport[]>([]);\n  const [rtTemplates, setRtTemplates] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]'); } catch { return []; } });");

    const effectRegex = /reports, employees, medicines, clinicalDrugs/;
    content = content.replace(effectRegex, "reports, rtTemplates, employees, medicines, clinicalDrugs");
    
    // Add to getCurrentState
    content = content.replace(/reports,\s*employees,/, "reports, rtTemplates, employees,");
    
    // Pass to LabReportingPage
    const labReportPageRegex = /reports=\{reports\} setReports=\{setReports\}/;
    content = content.replace(labReportPageRegex, "reports={reports} setReports={setReports} rtTemplates={rtTemplates} setRtTemplates={setRtTemplates}");

    // Load from cloud update
    const loadCloudRegex = /if \(data\.reports\) setReports\(data\.reports\);/;
    content = content.replace(loadCloudRegex, "if (data.reports) setReports(data.reports);\n      if (data.rtTemplates) { setRtTemplates(data.rtTemplates); localStorage.setItem('ncd_rt_templates_v1', JSON.stringify(data.rtTemplates)); }");

    const onDataChangedRegex = /if \(newData\.reports\) setReports\(newData\.reports\);/;
    content = content.replace(onDataChangedRegex, "if (newData.reports) setReports(newData.reports);\n      if (newData.rtTemplates) { setRtTemplates(newData.rtTemplates); localStorage.setItem('ncd_rt_templates_v1', JSON.stringify(newData.rtTemplates)); }");


    fs.writeFileSync('App.tsx', content);
    console.log("Patched App.tsx with rtTemplates successfully");
} else {
    console.log("Already has rtTemplates in App.tsx");
}
