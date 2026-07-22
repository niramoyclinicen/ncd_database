const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    'tests={tests}\n            setReagents={setReagents}',
    'tests={tests}\n            reagents={reagents}\n            setReagents={setReagents}'
);

fs.writeFileSync('App.tsx', code);
console.log("Patched App.tsx");

let accCode = fs.readFileSync('components/AccountingPage.tsx', 'utf8');

accCode = accCode.replace(
    'tests: Test[];\n  setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;',
    'tests: Test[];\n  reagents: Reagent[];\n  setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;'
);

accCode = accCode.replace(
    'employees, setEmployees,',
    'employees, setEmployees, reagents,'
);

accCode = accCode.replace(
    'setDetailedExpenses, setReagents, attendanceLog,',
    'setDetailedExpenses, reagents, setReagents, attendanceLog,'
);

accCode = accCode.replace(
    'setReagents={setReagents} \n            availableTests={tests}',
    'setReagents={setReagents} \n            reagents={reagents}\n            availableTests={tests}'
);

fs.writeFileSync('components/AccountingPage.tsx', accCode);
console.log("Patched AccountingPage.tsx");
