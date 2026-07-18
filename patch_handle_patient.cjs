const fs = require('fs');
let code = fs.readFileSync('components/DoctorAppointmentPage.tsx', 'utf8');

code = code.replace(/const handlePatientSelect = \(id: string, name: string\) => \{[\s\S]*?setShowNewPatientForm\(false\); \n  \};/, 
`const handlePatientSelect = (id: string, name: string) => {
    setFormData(prev => ({ ...prev, patient_id: id, patient_name: name }));
    setShowNewPatientForm(false);
    setShowPatientSearchModal(false);
    setPatientSearchFilters({ name: '', mobile: '', address: '', thana: '', age: '' });
  };`);
fs.writeFileSync('components/DoctorAppointmentPage.tsx', code);
