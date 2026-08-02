const fs = require('fs');
let content = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

content = content.replace(
    /reports, setReports, rtTemplates, setRtTemplates,/,
    `reports, setReports, rtTemplates, setRtTemplates, diagnosticSettings, setDiagnosticSettings,`
);

fs.writeFileSync('components/DiagnosticPage.tsx', content);
console.log("Fixed DiagnosticPage props");
