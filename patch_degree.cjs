const fs = require('fs');

// Patch DoctorInfoPage
let docCode = fs.readFileSync('components/DoctorInfoPage.tsx', 'utf8');
docCode = docCode.replace(
    '<div><label className={labelBaseClasses}>Degree</label><input type="text" name="degree" value={formData.degree} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. MBBS, FCPS" /></div>',
    '<div><label className={labelBaseClasses}>Degree (multi-line allowed)</label><textarea name="degree" value={formData.degree} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. MBBS, FCPS\\nMD (Medicine)" rows={2} /></div>'
);
fs.writeFileSync('components/DoctorInfoPage.tsx', docCode);
console.log("Patched DoctorInfoPage");

// Patch EmployeesPage
if (fs.existsSync('components/EmployeesPage.tsx')) {
    let empCode = fs.readFileSync('components/EmployeesPage.tsx', 'utf8');
    empCode = empCode.replace(
        '<div><label className={labelBaseClasses}>Degree/Qualification</label><input type="text" name="degree" value={formData.degree} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. BSc, Diploma" /></div>',
        '<div><label className={labelBaseClasses}>Degree/Qualification</label><textarea name="degree" value={formData.degree} onChange={handleInputChange} className={inputBaseClasses} placeholder="e.g. BSc, Diploma" rows={2} /></div>'
    );
    fs.writeFileSync('components/EmployeesPage.tsx', empCode);
    console.log("Patched EmployeesPage");
}

