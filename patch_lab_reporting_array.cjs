const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

content = content.replace(
    /const LabReportingPage: React.FC<any> = \(\{ invoices, setInvoices, reports, setReports, rtTemplates, setRtTemplates, patients, employees, tests, doctors, performBlockingSync \}\) => \{/,
    `const LabReportingPage: React.FC<any> = ({ invoices, setInvoices, reports, setReports, rtTemplates: _rtTemplates, setRtTemplates, patients, employees, tests, doctors, performBlockingSync }) => {
    const rtTemplates = Array.isArray(_rtTemplates) ? _rtTemplates : [];`
);

fs.writeFileSync('components/LabReportingPage.tsx', content);
console.log("Patched LabReportingPage array check");
