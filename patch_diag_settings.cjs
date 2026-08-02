const fs = require('fs');

// 1. App.tsx
let contentApp = fs.readFileSync('App.tsx', 'utf8');
contentApp = contentApp.replace(
    /appointments=\{appointments\} setAppointments=\{setAppointments\}/,
    `appointments={appointments} setAppointments={setAppointments}\n            diagnosticSettings={diagnosticSettings} setDiagnosticSettings={setDiagnosticSettings}`
);
fs.writeFileSync('App.tsx', contentApp);

// 2. DiagnosticPage.tsx
let contentDiag = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');
contentDiag = contentDiag.replace(
    /rtTemplates: any\[\];\n  setRtTemplates: React.Dispatch<React.SetStateAction<any\[\]>>;/,
    `rtTemplates: any[];\n  setRtTemplates: React.Dispatch<React.SetStateAction<any[]>>;\n  diagnosticSettings?: any;\n  setDiagnosticSettings?: React.Dispatch<React.SetStateAction<any>>;`
);
contentDiag = contentDiag.replace(
    /reports, setReports, rtTemplates, setRtTemplates, patients,/,
    `reports, setReports, rtTemplates, setRtTemplates, diagnosticSettings, setDiagnosticSettings, patients,`
);
contentDiag = contentDiag.replace(
    /rtTemplates=\{rtTemplates\}\n\s*setRtTemplates=\{setRtTemplates\}/,
    `rtTemplates={rtTemplates}\n                setRtTemplates={setRtTemplates}\n                diagnosticSettings={diagnosticSettings}\n                setDiagnosticSettings={setDiagnosticSettings}`
);
fs.writeFileSync('components/DiagnosticPage.tsx', contentDiag);

// 3. LabReportingPage.tsx
let contentLab = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

// Add props to LabReportingPage
contentLab = contentLab.replace(
    /rtTemplates: _rtTemplates, setRtTemplates, patients, employees, tests, doctors, performBlockingSync/,
    `rtTemplates: _rtTemplates, setRtTemplates, diagnosticSettings, setDiagnosticSettings, patients, employees, tests, doctors, performBlockingSync`
);

// Update MasterPadHeader
contentLab = contentLab.replace(
    /const MasterPadHeader = \(\) => \{[\s\S]*?return \(/,
    `const MasterPadHeader = ({ logo, setLogo }: any) => {
    const handleLogoUpload = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const b64 = ev.target?.result as string;
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 150;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                    } else {
                        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const resizedB64 = canvas.toDataURL('image/jpeg', 0.8);
                    setLogo(resizedB64);
                };
                img.src = b64;
            };
            reader.readAsDataURL(file);
        }
    };
    return (`
);

// Add logo state to LabReportingPage
contentLab = contentLab.replace(
    /const rtTemplates = Array.isArray\(_rtTemplates\) \? _rtTemplates : \[\];/,
    `const rtTemplates = Array.isArray(_rtTemplates) ? _rtTemplates : [];\n    const handleSetLogo = (newLogo: string) => { setDiagnosticSettings({ ...diagnosticSettings, clinicLogo: newLogo }); if(performBlockingSync) performBlockingSync({ diagnosticSettings: { ...diagnosticSettings, clinicLogo: newLogo } }); };`
);

// Pass logo down
contentLab = contentLab.replace(/<MasterPadHeader \/>/g, `<MasterPadHeader logo={diagnosticSettings?.clinicLogo} setLogo={handleSetLogo} />`);

fs.writeFileSync('components/LabReportingPage.tsx', contentLab);
console.log("Patched diagnostic settings and MasterPadHeader");
