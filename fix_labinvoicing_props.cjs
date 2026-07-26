const fs = require('fs');
let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

code = code.replace(
    `reagents: Reagent[];\n  setTests: React.Dispatch<React.SetStateAction<Test[]>>; // To update test availability`,
    `reagents: Reagent[];\n  setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;\n  setTests: React.Dispatch<React.SetStateAction<Test[]>>; // To update test availability`
);

code = code.replace(
    `reagents, employees,`,
    `reagents, setReagents, employees,`
);

fs.writeFileSync('components/LabInvoicingPage.tsx', code);
console.log("Updated LabInvoicingPage props");
