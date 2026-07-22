const fs = require('fs');

let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

// Replace imports if needed
if (!code.includes('RichTextEditor')) {
    code = code.replace(
        "import TemplateManagementPage from './TemplateManagementPage';",
        "import TemplateManagementPage from './TemplateManagementPage';\nimport { RichTextEditor } from './RichTextEditor';"
    );
}

// Read rtTemplates
if (!code.includes('const rtTemplates = ')) {
    code = code.replace(
        "const [currentReportData, setCurrentReportData] = useState<any>(null);",
        "const [currentReportData, setCurrentReportData] = useState<any>(null);\n    const [rtTemplates, setRtTemplates] = useState<any[]>([]);\n    useEffect(() => { setRtTemplates(JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]')); }, [viewMode]);"
    );
}

// We need to replace the content of USG and Semen Analysis to use RichTextEditor
// Let's locate the USG rendering part.
// Currently it uses:
// {(activeTestName.toLowerCase().includes('usg') || activeTestName.toLowerCase().includes('ultra')) ? (
// ...
// <div className="category-title">Ultrasonography Report</div>
// <UltrasonographyReportEditor template={null} ... />

// We will change it to use RichTextEditor for USG, semen, etc.
// In fact, since they want it for both USG and Semen Analysis, we can group them as "Rich Text Tests".

const oldUsgRender = `{(activeTestName.toLowerCase().includes('usg') || activeTestName.toLowerCase().includes('ultra')) ? (
                                        <div className="paper-page">
                                            <div className="paper-inner">
                                                {printFullPad && <MasterPadHeader />}
                                                <div className="report-content-body">
                                                    <ReportHeader patient={patient} currentInvoice={currentInvoice} doctors={doctors} />
                                                    <div className="category-title">Ultrasonography Report</div>
                                                    <UltrasonographyReportEditor template={null} patient={patient} invoice={currentInvoice} onSave={handleSaveReport} reportData={currentReportData} setReportData={setCurrentReportData} doctors={doctors} employees={employees} technologistId={selectedTechnologistId} consultantId={selectedConsultantId} isEmbedded={true} />
                                                </div>
                                                <Signatures techLabel="Sonographer" docLabel="Sonologist" customTechName={customTechName} customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree} />
                                            </div>
                                        </div>
                                    ) : (`;

const newRichTextRender = `{(activeTestName.toLowerCase().includes('usg') || activeTestName.toLowerCase().includes('ultra') || activeTestName.toLowerCase().includes('semen')) ? (
                                        <div className="paper-page">
                                            <div className="paper-inner">
                                                {printFullPad && <MasterPadHeader />}
                                                <div className="report-content-body flex flex-col">
                                                    <ReportHeader patient={patient} currentInvoice={currentInvoice} doctors={doctors} />
                                                    <div className="category-title">{activeTestName}</div>
                                                    
                                                    {/* Template Selector no-print */}
                                                    <div className="no-print mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center gap-4">
                                                        <span className="text-[10px] font-black uppercase text-indigo-800">Load Template:</span>
                                                        <select 
                                                            className="flex-1 bg-white border border-indigo-200 rounded p-1.5 text-xs font-bold outline-none"
                                                            onChange={(e) => {
                                                                const t = rtTemplates.find(x => x.id === e.target.value);
                                                                if(t) {
                                                                    if(confirm('Replace current content with template?')) {
                                                                        setCurrentReportData(t.contentHtml);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <option value="">-- Choose Template --</option>
                                                            {rtTemplates.filter(t => t.testName === activeTestName).map(t => (
                                                                <option key={t.id} value={t.id}>{t.templateName}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex-1 min-h-[400px]">
                                                        <RichTextEditor 
                                                            value={typeof currentReportData === 'string' ? currentReportData : (currentReportData?.html || currentReportData?.impression || '')} 
                                                            onChange={(val) => setCurrentReportData(val)} 
                                                            readOnly={false}
                                                        />
                                                    </div>
                                                </div>
                                                <Signatures techLabel={activeTestName.toLowerCase().includes('usg') ? "Sonographer" : "Lab Technologist"} docLabel={activeTestName.toLowerCase().includes('usg') ? "Sonologist" : "Pathologist / Reporter"} customTechName={customTechName} customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree} />
                                            </div>
                                        </div>
                                    ) : (`;

code = code.replace(oldUsgRender, newRichTextRender);

// Wait, the semantic save logic. When handleSaveReport is called for USG, currentReportData is just a string now. That's fine, the system will save string as `data`.

// Also, the old code had logic for `specialTests` which included semen. Let's remove semen from special tests so it doesn't double render.
code = code.replace(
    "const specialTests = otherTests.filter(t => t.toLowerCase().includes('urine') || t.toLowerCase().includes('semen'));",
    "const specialTests = otherTests.filter(t => t.toLowerCase().includes('urine')); // Semen handled by RichText"
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
console.log("Patched LabReportingPage.tsx");
