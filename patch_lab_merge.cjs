const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetStr = `        let mergedData = {};
        let foundAny = false;
        let lastTech = '', lastDoc = '';
        
        groupTests.forEach(gName => {
            const saved = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === gName);
            if (saved) {
                mergedData = { ...mergedData, ...saved.data };
                foundAny = true;
                if (saved?.technologistId) lastTech = saved?.technologistId;
                if (saved?.consultantId) lastDoc = saved?.consultantId;
            }
        });`;

const replacementStr = `        let mergedData: any = {};
        let foundAny = false;
        let lastTech = '', lastDoc = '';
        
        groupTests.forEach(gName => {
            const saved = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === gName);
            if (saved) {
                if (typeof saved.data === 'string') {
                    mergedData = saved.data;
                } else if (typeof mergedData === 'object' && mergedData !== null) {
                    mergedData = { ...mergedData, ...saved.data };
                }
                foundAny = true;
                if (saved?.technologistId) lastTech = saved?.technologistId;
                if (saved?.consultantId) lastDoc = saved?.consultantId;
            }
        });`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Patched LabReportingPage.tsx merge logic");
} else {
    console.log("Could not find merge logic");
}
