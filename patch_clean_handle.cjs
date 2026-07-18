const fs = require('fs');
let code = fs.readFileSync('components/DoctorAppointmentPage.tsx', 'utf8');

code = code.replace(/const handlePatientSelectFromModal = \(id: string, name: string\) => \{[\s\S]*?setPatientSearchFilters\(\{ name: '', mobile: '', address: '', thana: '', age: '' \}\);\n  \};\n\n/g, "");
// And let's fix the onClicks that I replaced with handlePatientSelectFromModal back to handlePatientSelect
code = code.replace(/handlePatientSelectFromModal/g, "handlePatientSelect");

fs.writeFileSync('components/DoctorAppointmentPage.tsx', code);
