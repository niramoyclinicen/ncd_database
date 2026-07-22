const fs = require('fs');
let code = fs.readFileSync('components/ClinicPage.tsx', 'utf8');

// Fix duplicate param in AdmissionAndTreatmentPage
code = code.replace(', performBlockingSync, performBlockingSync', ', performBlockingSync');
code = code.replace('performBlockingSync?: (overrides?: any) => Promise<boolean>;\n    performBlockingSync?: (overrides?: any) => Promise<boolean>;', 'performBlockingSync?: (overrides?: any) => Promise<boolean>;');

fs.writeFileSync('components/ClinicPage.tsx', code);
console.log("Fixed ClinicPage");
