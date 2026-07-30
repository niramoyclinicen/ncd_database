const fs = require('fs');
let file = 'components/LabReportingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldSave = `setRtTemplates([...current, newTpl]);
                                setShowTemplateModal(false);
                                setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                            }} className`;

const newSave = `setRtTemplates([...current, newTpl]);
                                setShowTemplateModal(false);
                                setSuccessMessage("টেমপ্লেট সফলভাবে সেভ হয়েছে!");
                                setTimeout(() => setSuccessMessage(''), 3000);
                            }} className`;

code = code.replace(oldSave, newSave);
fs.writeFileSync(file, code);
console.log("Fixed success message timeout.");
