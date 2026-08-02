const fs = require('fs');
let content = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

// 1. Add to interface
const interfaceRegex = /reports: LabReport\[\];\n  setReports: React.Dispatch<React.SetStateAction<LabReport\[\]>>;/;
content = content.replace(interfaceRegex, `reports: LabReport[];
  setReports: React.Dispatch<React.SetStateAction<LabReport[]>>;
  rtTemplates: any[];
  setRtTemplates: React.Dispatch<React.SetStateAction<any[]>>;`);

// 2. Add to component args
const compRegex = /reports, setReports,/;
content = content.replace(compRegex, `reports, setReports, rtTemplates, setRtTemplates,`);

// 3. Add to LabReportingPage
const labRegex = /reports=\{reports\}\n\s*setReports=\{setReports\}/;
content = content.replace(labRegex, `reports={reports}
                setReports={setReports}
                rtTemplates={rtTemplates}
                setRtTemplates={setRtTemplates}`);

fs.writeFileSync('components/DiagnosticPage.tsx', content);
console.log("Patched DiagnosticPage.tsx props");
