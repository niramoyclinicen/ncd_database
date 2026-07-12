const fs = require('fs');
let code = fs.readFileSync('components/DoctorAppointmentPage.tsx', 'utf8');

const hookPoint = `<button 
                    onClick={() => { setListSearchDoctor(''); setListSearchPatient(''); setListFilterDate(''); setListFilterMonth(''); }}
                    className="p-1.5 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors"
                    title="Clear List Filters"
                >
                    <TrashIcon size={16} />
                </button>`;

const newFunc = `<button 
                    onClick={handlePrintList}
                    className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors text-xs font-bold shadow-lg shadow-sky-900/20"
                    title="Print Appointment List"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print List
                </button>
                ` + hookPoint;

if(code.includes(hookPoint)) {
    code = code.replace(hookPoint, newFunc);
    fs.writeFileSync('components/DoctorAppointmentPage.tsx', code);
    console.log("Patched print list button");
} else {
    console.error("Hook point not found");
}
