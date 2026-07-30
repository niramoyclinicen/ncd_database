const fs = require('fs');
let file = 'components/LabReportingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldPrintEnd = `        const win = window.open('', '_blank');
        if (!win) {
            alert("Please allow popups to print.");
            return;
        }

        win.document.write(\`
            <html>
                <head>
                    <title>\${activeTestName} Report - \${patient?.name}</title>
                    <style>
                        @page { size: A4; margin: 0; }
                        * { box-sizing: border-box; }
                        html, body { 
                            background: white; 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            font-family: 'Times New Roman', serif; 
                            color: black; 
                            width: 100%; 
                            -webkit-print-color-adjust: exact;
                        }
                        .paper-page { 
                            width: 210mm; 
                            position: relative; 
                            display: flex; 
                            flex-direction: column; 
                            background: white; 
                            box-sizing: border-box;
                            margin: 0 auto;
                        }
                        .paper-inner { padding: 0 15mm; flex: 1; display: flex; flex-direction: column; width: 100%; }
                        .report-content-body { \${printFullPad ? 'margin-top: 0;' : 'margin-top: 2.3in;'} flex: 1; width: 100%; padding-bottom: 10px; }
                        
                        @media print {
                            body { height: auto !important; overflow: visible !important; }
                            .footer-sign-container { 
                                display: flex; 
                                justify-content: space-between; 
                                align-items: flex-end; 
                                width: 100%; 
                                margin-top: auto; 
                                padding-top: 20px; 
                                page-break-inside: avoid; 
                                break-inside: avoid;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div id="print-mount" style="width: 100%; height: 100%; overflow: hidden;">\${content.innerHTML}</div>
                    <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 850); };</script>
                </body>
            </html>
        \`);
        win.document.close();
    };`;

const newPrintEnd = `        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
        const win = iframe.contentWindow;
        if (!win) {
            alert("Print failed.");
            return;
        }

        win.document.open();
        win.document.write(\`
            <html>
                <head>
                    <title>\${activeTestName} Report - \${patient?.name}</title>
                    <style>
                        @page { size: A4; margin: 0; }
                        * { box-sizing: border-box; }
                        html, body { 
                            background: white; 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            font-family: 'Times New Roman', serif; 
                            color: black; 
                            width: 100%; 
                            -webkit-print-color-adjust: exact;
                        }
                        .paper-page { 
                            width: 210mm; 
                            position: relative; 
                            display: flex; 
                            flex-direction: column; 
                            background: white; 
                            box-sizing: border-box;
                            margin: 0 auto;
                        }
                        .paper-inner { padding: 0 15mm; flex: 1; display: flex; flex-direction: column; width: 100%; }
                        .report-content-body { \${printFullPad ? 'margin-top: 0;' : 'margin-top: 2.3in;'} flex: 1; width: 100%; padding-bottom: 10px; }
                        
                        @media print {
                            body { height: auto !important; overflow: visible !important; }
                            .footer-sign-container { 
                                display: flex; 
                                justify-content: space-between; 
                                align-items: flex-end; 
                                width: 100%; 
                                margin-top: auto; 
                                padding-top: 20px; 
                                page-break-inside: avoid; 
                                break-inside: avoid;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div id="print-mount" style="width: 100%; height: 100%; overflow: hidden;">\${content.innerHTML}</div>
                </body>
            </html>
        \`);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };`;

if(code.includes('const win = window.open(')) {
    code = code.replace(oldPrintEnd, newPrintEnd);
    fs.writeFileSync(file, code);
    console.log("Fixed LabReportingPage print function to use iframe.");
} else {
    console.log("Could not find old print end.");
}
