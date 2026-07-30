const fs = require('fs');
let file = 'components/LabReportingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const modalStart = '            {/* Template Save Modal */}';
const modalEnd = '                    </div>\n                </div>\n            )}\n        </div>\n    );\n};'; // wait, it was inserted into ReportHeader?

// Wait, let's just extract the modal and remove it from ReportHeader.
const regex = /\s*\{\/\* Template Save Modal \*\/\}.*?Save<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/s;

const match = code.match(regex);
if (match) {
    const modalCode = match[0];
    code = code.replace(modalCode, '');
    
    // Now put it at the end of LabReportingPage
    const labRepEnd = '        </div>\n    );\n};';
    code = code.replace(labRepEnd, modalCode + '\n' + labRepEnd);
    fs.writeFileSync(file, code);
    console.log("Moved modal to end of LabReportingPage");
} else {
    console.log("Could not find modal");
}
