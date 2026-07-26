const fs = require('fs');
let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

const target = `    if (totals.dueAmount < -0.001) {
        alert('Paid amount cannot be greater than Net Payable.');
        return;
    }
    setConfirmModal({
        isOpen: true,
        title: 'Confirm Save',
        message: 'আপনি কি এই ল্যাব ইনভয়েসটি সেভ করতে চান?',
        onConfirm: () => executeSave()
    });
  };`;
  
const replacement = `    if (totals.dueAmount < -0.001) {
        alert('Paid amount cannot be greater than Net Payable.');
        return;
    }

    if (!isEditing) {
        const xrayTestsInInvoice = formData.items.filter(item => {
            const testObj = tests.find(t => t.test_id === item.test_id);
            return testObj && testObj.test_category === 'X-Ray';
        });

        if (xrayTestsInInvoice.length > 0) {
            const xrayFilmsAvailable = reagents.filter(r => r.linked_category === 'X-Ray' || r.reagent_name.toLowerCase().includes('film') || r.reagent_name.toLowerCase().includes('x-ray'));
            if (xrayFilmsAvailable.length > 1) {
                setPendingFilmSelections(xrayTestsInInvoice.map(t => ({ test_id: t.test_id, test_name: t.test_name, film_reagent_id: xrayFilmsAvailable[0].reagent_id })));
                return; // wait for modal
            }
        }
    }

    setConfirmModal({
        isOpen: true,
        title: 'Confirm Save',
        message: 'আপনি কি এই ল্যাব ইনভয়েসটি সেভ করতে চান?',
        onConfirm: () => executeSave()
    });
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('components/LabInvoicingPage.tsx', code);
console.log("Replaced handleSaveInvoice");
