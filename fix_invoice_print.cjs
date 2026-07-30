const fs = require('fs');
let file = 'components/LabInvoicingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldPrintEnd = `    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
      }, 750);
    }
  };`;

const newPrintEnd = `    // Use iframe for embedded printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (win) {
        win.document.open();
        win.document.write(printContent);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    }
  };`;

if(code.includes('window.open(')) {
    code = code.replace(oldPrintEnd, newPrintEnd);
    fs.writeFileSync(file, code);
    console.log("Fixed LabInvoicingPage print function to use iframe.");
} else {
    console.log("Could not find old print end.");
}
