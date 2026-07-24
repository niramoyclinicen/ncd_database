const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

// The CSS block inside handlePrintReport has `.footer-sign-container { position: absolute; ... }`
// Let's replace the whole block between `@media print { ... }` and `.no-break-inside`
const targetCSS = `.footer-sign-container { 
                            position: absolute; 
                            bottom: 12mm; 
                            left: 15mm; 
                            right: 15mm; 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: flex-end; 
                            background: white; 
                            width: calc(100% - 30mm); 
                        }`;
                        
const replacementCSS = `.footer-sign-container { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: flex-end; 
                            width: 100%; 
                            margin-top: auto;
                            padding-top: 40px;
                        }`;

code = code.replace(targetCSS, replacementCSS);

// Also change the print media query version
const targetPrintCSS = `.footer-sign-container { 
                                position: fixed !important; 
                                bottom: 12mm !important; 
                                left: 15mm !important; 
                                right: 15mm !important; 
                                display: flex; 
                                justify-content: space-between; 
                                align-items: flex-end; 
                                background: transparent; 
                                width: calc(100% - 30mm) !important; 
                            }`;

const replacementPrintCSS = `.footer-sign-container { 
                                display: flex; 
                                justify-content: space-between; 
                                align-items: flex-end; 
                                width: 100%; 
                                margin-top: auto;
                                padding-top: 40px;
                                page-break-inside: avoid;
                            }`;

code = code.replace(targetPrintCSS, replacementPrintCSS);

// Fix .report-content-body padding
code = code.replace(`.report-content-body { \${printFullPad ? 'margin-top: 0;' : 'margin-top: 2.3in;'} flex: 1; width: 100%; padding-bottom: 45mm; }`,
                    `.report-content-body { \${printFullPad ? 'margin-top: 0;' : 'margin-top: 2.3in;'} flex: 1; width: 100%; padding-bottom: 20px; }`);

fs.writeFileSync('components/LabReportingPage.tsx', code);
console.log('Fixed LabReportingPage.tsx print CSS');
