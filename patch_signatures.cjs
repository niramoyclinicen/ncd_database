const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const oldSig = `const Signatures = ({ customTechName, customTechDegree, customDocName, customDocDegree }: any) => (
    <div className="flex justify-between items-end mt-16 px-8 signature-block">
        <div className="text-center w-48 border-t border-black/40">
            <p className="text-[13px] font-black uppercase pt-1 leading-none text-black" style={{ color: '#000000 !important' }}>{customTechName || ''}</p>
            <p className="text-[9px] font-bold text-black whitespace-pre-line" style={{ color: '#000000 !important' }}>{customTechDegree || ''}</p>
        </div>
        <div className="text-center w-64 border-t border-black/40">
            <p className="text-[13px] font-black uppercase pt-1 leading-none text-black" style={{ color: '#000000 !important' }}>{customDocName || ''}</p>
            <p className="text-[9px] font-bold text-black whitespace-pre-line" style={{ color: '#000000 !important' }}>{customDocDegree || ''}</p>
        </div>
    </div>
);`;

const newSig = `const Signatures = ({ customTechName, setCustomTechName, customTechDegree, setCustomTechDegree, customDocName, setCustomDocName, customDocDegree, setCustomDocDegree }: any) => (
    <div className="flex justify-between items-end mt-16 px-8 signature-block">
        <div className="text-center w-48 border-t border-black/40 pt-2">
            <input type="text" value={customTechName} onChange={e => setCustomTechName && setCustomTechName(e.target.value)} placeholder="Technologist Name" className="w-full text-center text-[13px] font-black uppercase leading-none text-black bg-transparent border-none outline-none placeholder:text-gray-300 print:placeholder:text-transparent" style={{ color: '#000000' }} />
            <textarea value={customTechDegree} onChange={e => setCustomTechDegree && setCustomTechDegree(e.target.value)} placeholder="Technologist Degree" className="w-full text-center text-[9px] font-bold text-black bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-gray-300 print:placeholder:text-transparent h-8" style={{ color: '#000000' }} />
        </div>
        <div className="text-center w-64 border-t border-black/40 pt-2">
            <input type="text" value={customDocName} onChange={e => setCustomDocName && setCustomDocName(e.target.value)} placeholder="Consultant/Reporter Name" className="w-full text-center text-[13px] font-black uppercase leading-none text-black bg-transparent border-none outline-none placeholder:text-gray-300 print:placeholder:text-transparent" style={{ color: '#000000' }} />
            <textarea value={customDocDegree} onChange={e => setCustomDocDegree && setCustomDocDegree(e.target.value)} placeholder="Consultant/Reporter Degree" className="w-full text-center text-[9px] font-bold text-black bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-gray-300 print:placeholder:text-transparent h-10" style={{ color: '#000000' }} />
        </div>
    </div>
);`;

code = code.replace(oldSig, newSig);

// Replace all <Signatures customTechName={customTechName} ... /> with the one that includes setters
code = code.replace(/<Signatures customTechName={customTechName} customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree} \/>/g, '<Signatures customTechName={customTechName} setCustomTechName={setCustomTechName} customTechDegree={customTechDegree} setCustomTechDegree={setCustomTechDegree} customDocName={customDocName} setCustomDocName={setCustomDocName} customDocDegree={customDocDegree} setCustomDocDegree={setCustomDocDegree} />');

// Remove the bottom controls completely!
const bottomControlsStart = code.indexOf('{/* Bottom Controls moved inside the scrollable workspace */}');
const bottomControlsEnd = code.indexOf('</div>\n\n                            </div>', bottomControlsStart);
if(bottomControlsStart !== -1 && bottomControlsEnd !== -1) {
    code = code.substring(0, bottomControlsStart) + code.substring(bottomControlsEnd);
}

fs.writeFileSync('components/LabReportingPage.tsx', code);
console.log("Patched Signatures");
