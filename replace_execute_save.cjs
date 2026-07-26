const fs = require('fs');
let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

const target = `      const newInvoices = isEditing 
        ? safeInvoices.map(inv => (inv && inv.invoice_id === invoiceToSave.invoice_id) ? invoiceToSave : inv)
        : [invoiceToSave, ...safeInvoices];

      // If performBlockingSync is available, use it to ensure cloud save
      if (performBlockingSync) {
        try {
          const success = await performBlockingSync({ labInvoices: newInvoices });
          
          if (success) {
            setInvoices(newInvoices);
            setSuccessMessage('ডাটা সফলভাবে সেভ হয়েছে');
            resetForm();
          } else {
            // App.tsx handles the error modal when performBlockingSync fails
            console.error("Cloud save failed reported by performBlockingSync");
          }
        } catch (err) {
          console.error("Critical error in performBlockingSync:", err);
          alert("ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে। ডাটা সেভ করা যায়নি।");
        }
      } else {
        setInvoices(newInvoices);
        setSuccessMessage('ডাটা সেভ হয়েছে (অফলাইন মোড)');
        resetForm();
      }`;
      
const replacement = `      const newInvoices = isEditing 
        ? safeInvoices.map(inv => (inv && inv.invoice_id === invoiceToSave.invoice_id) ? invoiceToSave : inv)
        : [invoiceToSave, ...safeInvoices];

      let updatedReagents = [...reagents];
      let reagentsChanged = false;
      
      if (!isEditing) {
          const xrayFilmsAvailable = reagents.filter(r => r.linked_category === 'X-Ray' || r.reagent_name.toLowerCase().includes('film') || r.reagent_name.toLowerCase().includes('x-ray'));
          formData.items.forEach(item => {
              const testObj = tests.find(t => t.test_id === item.test_id);
              if (testObj) {
                  if (testObj.test_category === 'X-Ray') {
                      let selectedFilmId = pendingFilmSelections?.find(p => p.test_id === item.test_id)?.film_reagent_id;
                      if (!selectedFilmId && xrayFilmsAvailable.length === 1) {
                          selectedFilmId = xrayFilmsAvailable[0].reagent_id;
                      }
                      if (selectedFilmId) {
                          const rIdx = updatedReagents.findIndex(r => r.reagent_id === selectedFilmId);
                          if (rIdx !== -1) {
                              updatedReagents[rIdx] = { ...updatedReagents[rIdx], quantity: (updatedReagents[rIdx].quantity || 0) - 1 };
                              reagentsChanged = true;
                          }
                      }
                  } else {
                      const rIdx = updatedReagents.findIndex(r => r.linked_test === testObj.test_name);
                      if (rIdx !== -1) {
                          updatedReagents[rIdx] = { ...updatedReagents[rIdx], quantity: (updatedReagents[rIdx].quantity || 0) - 1 };
                          reagentsChanged = true;
                      }
                  }
              }
          });
      }

      // If performBlockingSync is available, use it to ensure cloud save
      if (performBlockingSync) {
        try {
          const syncPayload: any = { labInvoices: newInvoices };
          if (reagentsChanged) syncPayload.reagents = updatedReagents;
          const success = await performBlockingSync(syncPayload);
          
          if (success) {
            setInvoices(newInvoices);
            if (reagentsChanged && setReagents) setReagents(updatedReagents);
            setSuccessMessage('ডাটা সফলভাবে সেভ হয়েছে');
            resetForm();
            setPendingFilmSelections(null);
          } else {
            console.error("Cloud save failed reported by performBlockingSync");
          }
        } catch (err) {
          console.error("Critical error in performBlockingSync:", err);
          alert("ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে। ডাটা সেভ করা যায়নি।");
        }
      } else {
        setInvoices(newInvoices);
        if (reagentsChanged && setReagents) setReagents(updatedReagents);
        setSuccessMessage('ডাটা সেভ হয়েছে (অফলাইন মোড)');
        resetForm();
        setPendingFilmSelections(null);
      }`;

code = code.replace(target, replacement);
fs.writeFileSync('components/LabInvoicingPage.tsx', code);
console.log("Replaced executeSave logic");
