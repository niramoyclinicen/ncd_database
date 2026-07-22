const fs = require('fs');
let code = fs.readFileSync('components/ClinicPage.tsx', 'utf8');

// 1. Add performBlockingSync to props
code = code.replace(
    'setAdmissionData: React.Dispatch<React.SetStateAction<AdmissionRecord>>;',
    'setAdmissionData: React.Dispatch<React.SetStateAction<AdmissionRecord>>;\n    performBlockingSync?: (overrides?: any) => Promise<boolean>;'
);

// 2. Add it to parameters of AdmissionAndTreatmentPage
code = code.replace(
    'drugDemands, setDrugDemands, admissionData, setAdmissionData',
    'drugDemands, setDrugDemands, admissionData, setAdmissionData, performBlockingSync'
);

// 3. Add it to the usage in ClinicPage
code = code.replace(
    '<AdmissionAndTreatmentPage admissions={admissions}',
    '<AdmissionAndTreatmentPage performBlockingSync={performBlockingSync} admissions={admissions}'
);

// 4. Add performBlockingSync to PatientInfoPage usage in activeTab === 'patient_info'
code = code.replace(
    '<PatientInfoPage patients={patients} setPatients={setPatients} isEmbedded={false} />',
    '<PatientInfoPage patients={patients} setPatients={setPatients} isEmbedded={false} performBlockingSync={performBlockingSync} />'
);

// 5. Add to PatientInfoPage in modal
code = code.replace(
    '<PatientInfoPage \n                                patients={patients} \n                                setPatients={setPatients} \n                                isEmbedded={true}',
    '<PatientInfoPage \n                                performBlockingSync={performBlockingSync}\n                                patients={patients} \n                                setPatients={setPatients} \n                                isEmbedded={true}'
);

// 6. Add to DoctorInfoPage in modal
code = code.replace(
    '<DoctorInfoPage \n                                doctors={doctors}',
    '<DoctorInfoPage \n                                performBlockingSync={performBlockingSync}\n                                doctors={doctors}'
);

// 7. Add to ReferrerInfoPage in modal
code = code.replace(
    '<ReferrerInfoPage \n                                referrars={referrars}',
    '<ReferrerInfoPage \n                                performBlockingSync={performBlockingSync}\n                                referrars={referrars}'
);

fs.writeFileSync('components/ClinicPage.tsx', code);
console.log("Patched ClinicPage.tsx");
