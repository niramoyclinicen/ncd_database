const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

// 1. Modify Signatures component to accept custom labels
code = code.replace(
    'const Signatures = ({ customTechName, customTechDegree, customDocName, customDocDegree }: any) => (',
    'const Signatures = ({ customTechName, customTechDegree, customDocName, customDocDegree, techLabel = "Lab Technologist", docLabel = "Pathologist / Reporter" }: any) => ('
);

code = code.replace(
    '<p className="text-[11px] font-black uppercase text-black mb-1" style={{ color: \'#000000 !important\' }}>Lab Technologist</p>',
    '<p className="text-[11px] font-black uppercase text-black mb-1" style={{ color: \'#000000 !important\' }}>{techLabel}</p>'
);

code = code.replace(
    '<p className="text-[11px] font-black uppercase text-black mb-1" style={{ color: \'#000000 !important\' }}>Pathologist / Reporter</p>',
    '<p className="text-[11px] font-black uppercase text-black mb-1" style={{ color: \'#000000 !important\' }}>{docLabel}</p>'
);

// 2. Add activeTestGroup logic
code = code.replace(
    `    const activeTestGroup = useMemo(() => {
        if (!currentInvoice || !activeTestName) return [];
        return [activeTestName];
    }, [currentInvoice, activeTestName]);`,
    `    const activeTestGroup = useMemo(() => {
        if (!currentInvoice || !activeTestName) return [];
        const activeTestDef = tests.find((t: any) => t.test_name === activeTestName);
        const activeCategory = activeTestDef?.category || 'General';
        
        // Return all tests in the current invoice that share the exact same category
        return currentInvoice.items.map((it: any) => it.test_name).filter((tName: string) => {
            const def = tests.find((t: any) => t.test_name === tName);
            const cat = def?.category || 'General';
            return cat === activeCategory;
        });
    }, [currentInvoice, activeTestName, tests]);`
);

// 3. Update handleSelectTest to merge data for all tests in group
code = code.replace(
    `        const saved = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === tName);
        if (saved) {
            setCurrentReportData(saved.data);`,
    `        
        const activeTestDef = tests.find((t: any) => t.test_name === tName);
        const activeCategory = activeTestDef?.category || 'General';
        
        const groupTests = currentInvoice ? currentInvoice.items.map((it: any) => it.test_name).filter((groupTName: string) => {
            const def = tests.find((t: any) => t.test_name === groupTName);
            const cat = def?.category || 'General';
            return cat === activeCategory;
        }) : [tName];
        
        let mergedData = {};
        let foundAny = false;
        let lastTech = '', lastDoc = '';
        
        groupTests.forEach(gName => {
            const saved = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === gName);
            if (saved) {
                mergedData = { ...mergedData, ...saved.data };
                foundAny = true;
                if (saved.technologistId) lastTech = saved.technologistId;
                if (saved.consultantId) lastDoc = saved.consultantId;
            }
        });

        if (foundAny) {
            setCurrentReportData(mergedData);
            setSelectedTechnologistId(lastTech);
            setSelectedConsultantId(lastDoc);
            
            const saved = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === tName) || reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && groupTests.includes(r.test_name));
            `
);

// 4. Update handleSaveReport to save all tests in group
code = code.replace(
    `        // 1. Calculate updated reports
        const existing = reports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === activeTestName);
        const newReport: LabReport = {
            report_id: existing?.report_id || \`REP-\${selectedInvoiceId}-\${activeTestName.replace(/\\s+/g, '')}\`,
            invoice_id: selectedInvoiceId, test_name: activeTestName, patient_id: patient?.pt_id || '',
            report_date: new Date().toISOString().split('T')[0], status: 'Completed', data: reportData,
            technologistId: selectedTechnologistId, consultantId: selectedConsultantId,
            isDelivered: existing?.isDelivered || false
        };
        const updatedReports = reports.filter((r: LabReport) => !(r.invoice_id === selectedInvoiceId && r.test_name === activeTestName));
        updatedReports.push(newReport);`,
    `        // 1. Calculate updated reports
        let updatedReports = [...reports];
        activeTestGroup.forEach((tName: string) => {
             const existing = updatedReports.find((r: LabReport) => r.invoice_id === selectedInvoiceId && r.test_name === tName);
             const newReport: LabReport = {
                 report_id: existing?.report_id || \`REP-\${selectedInvoiceId}-\${tName.replace(/\\s+/g, '')}\`,
                 invoice_id: selectedInvoiceId, test_name: tName, patient_id: patient?.pt_id || '',
                 report_date: new Date().toISOString().split('T')[0], status: 'Completed', data: reportData,
                 technologistId: selectedTechnologistId, consultantId: selectedConsultantId,
                 isDelivered: existing?.isDelivered || false
             };
             updatedReports = updatedReports.filter((r: LabReport) => !(r.invoice_id === selectedInvoiceId && r.test_name === tName));
             updatedReports.push(newReport);
        });`
);

// 5. Update USG sign parameters
code = code.replace(
    '<Signatures customTechName={customTechName} setCustomTechName={setCustomTechName} customTechDegree={customTechDegree} setCustomTechDegree={setCustomTechDegree} customDocName={customDocName} setCustomDocName={setCustomDocName} customDocDegree={customDocDegree} setCustomDocDegree={setCustomDocDegree} />',
    '<Signatures techLabel="Sonographer" docLabel="Sonologist" customTechName={customTechName} customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree} />'
);

// 6. Update general sign parameters (it appears twice, so global replace is better, but first one is USG which we already replaced)
// We need to fix the others.
code = code.replaceAll(
    'setCustomTechName={setCustomTechName} customTechDegree={customTechDegree} setCustomTechDegree={setCustomTechDegree} customDocName={customDocName} setCustomDocName={setCustomDocName} customDocDegree={customDocDegree} setCustomDocDegree={setCustomDocDegree}',
    'customTechDegree={customTechDegree} customDocName={customDocName} customDocDegree={customDocDegree}'
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
console.log("Patched LabReportingPage.tsx");
