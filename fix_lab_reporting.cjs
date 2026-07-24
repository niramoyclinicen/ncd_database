const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

// Fix signature CSS: remove absolute positioning so it flows naturally at the bottom
code = code.replace(`.footer-sign-container { position: absolute; bottom: 12mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; align-items: flex-end; }`, 
                    `.footer-sign-container { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; margin-top: auto; padding-top: 40px; }`);
                    
code = code.replace(`.paper-inner { padding: 0 15mm 45mm 15mm; flex: 1; display: flex; flex-direction: column; height: 100%; }`,
                    `.paper-inner { padding: 0 15mm 15mm 15mm; flex: 1; display: flex; flex-direction: column; min-height: 100%; }`);

// Replace the Signature component with a simpler classic version
const newSig = `const Signatures = ({ customTechName, customTechDegree, customDocName, customDocDegree, techLabel = "Lab Technologist", docLabel = "Pathologist / Reporter" }: any) => (
    <div className="footer-sign-container no-break-inside">
        <div className="text-center w-64">
            <div className="h-16 w-full"></div>
            <div className="border-t-2 border-black w-full mb-1"></div>
            <p className="text-[12px] font-black uppercase text-black" style={{ color: '#000000 !important' }}>{customTechName || 'Lab Technologist'}</p>
            <p className="text-[10px] font-bold text-black whitespace-pre-wrap" style={{ color: '#000000 !important' }}>{customTechDegree || ''}</p>
        </div>
        <div className="text-center w-64">
            <div className="h-16 w-full"></div>
            <div className="border-t-2 border-black w-full mb-1"></div>
            <p className="text-[12px] font-black uppercase text-black" style={{ color: '#000000 !important' }}>{customDocName || 'Consultant Pathologist'}</p>
            <p className="text-[10px] font-bold text-black whitespace-pre-wrap" style={{ color: '#000000 !important' }}>{customDocDegree || ''}</p>
        </div>
    </div>
);`;

// We will replace the old Signatures definition
const oldSigStart = `const Signatures = ({ customTechName, customTechDegree, customDocName, customDocDegree, techLabel = "Lab Technologist", docLabel = "Pathologist / Reporter" }: any) => (`;
const oldSigEnd = `    </div>\n);\n`;

// Find the index of oldSigStart and the next occurrence of `;\n\n`
const startIndex = code.indexOf(oldSigStart);
if (startIndex !== -1) {
    const endIndex = code.indexOf(');', startIndex) + 2;
    code = code.substring(0, startIndex) + newSig + code.substring(endIndex);
}

fs.writeFileSync('components/LabReportingPage.tsx', code);
console.log('Fixed LabReportingPage.tsx layout and signatures');
