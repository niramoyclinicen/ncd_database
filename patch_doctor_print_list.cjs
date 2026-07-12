const fs = require('fs');
let code = fs.readFileSync('components/DoctorAppointmentPage.tsx', 'utf8');

const hookPoint = '  const handlePrintAppointment = () => {';

const newFunc = "  const handlePrintList = () => {\n" +
"    let reportTitle = 'APPOINTMENT LIST';\n" +
"    \n" +
"    let filterDetails = [];\n" +
"    if (listSearchDoctor) filterDetails.push(`Doctor: ${listSearchDoctor}`);\n" +
"    if (listSearchPatient) filterDetails.push(`Patient: ${listSearchPatient}`);\n" +
"    if (listFilterDate) filterDetails.push(`Date: ${listFilterDate}`);\n" +
"    if (listFilterMonth) filterDetails.push(`Month: ${listFilterMonth}`);\n" +
"    const subtitle = filterDetails.length > 0 ? filterDetails.join(' | ') : 'All Appointments';\n" +
"\n" +
"    const theadHtml = `\n" +
"      <tr>\n" +
"        <th style=\"text-align:center; width:40px;\">SL</th>\n" +
"        <th>Date & Time</th>\n" +
"        <th>Patient Name</th>\n" +
"        <th>Consultant</th>\n" +
"        <th>Status</th>\n" +
"        <th style=\"text-align:right;\">Fee</th>\n" +
"      </tr>\n" +
"    `;\n" +
"\n" +
"    let totalFees = 0;\n" +
"    const contentHtml = filteredAppointments.map((appt, index) => {\n" +
"        totalFees += (appt.doctor_fee || 0);\n" +
"        return `\n" +
"            <tr>\n" +
"                <td style=\"text-align:center\">${index + 1}</td>\n" +
"                <td><b>${appt.appointment_date}</b><br/>${appt.appointment_time}</td>\n" +
"                <td><b>${appt.patient_name}</b><br/>${appt.reason || ''}</td>\n" +
"                <td>${appt.doctor_name || ''}</td>\n" +
"                <td>${appt.status}</td>\n" +
"                <td style=\"text-align:right\">৳${(appt.doctor_fee || 0).toFixed(2)}</td>\n" +
"            </tr>\n" +
"        `;\n" +
"    }).join('');\n" +
"\n" +
"    const tfootHtml = `\n" +
"      <tr>\n" +
"          <td colspan=\"5\" style=\"text-align:right; font-weight:bold;\">Total (${filteredAppointments.length} Patients):</td>\n" +
"          <td style=\"text-align:right; font-weight:bold;\">৳${totalFees.toFixed(2)}</td>\n" +
"      </tr>\n" +
"    `;\n" +
"\n" +
"    const printContent = `\n" +
"      <!DOCTYPE html>\n" +
"      <html>\n" +
"      <head>\n" +
"          <meta charset=\"UTF-8\">\n" +
"          <title>Appointment List Print</title>\n" +
"          <style>\n" +
"              @page { size: A4 landscape; margin: 15mm; }\n" +
"              body { font-family: sans-serif; background: #fff; color: #000; margin: 0; padding: 0; }\n" +
"              .header { text-align: center; margin-bottom: 20px; }\n" +
"              .header h1 { margin: 0; font-size: 24px; font-weight: bold; }\n" +
"              .header p { margin: 5px 0; font-size: 12px; }\n" +
"              .header h2 { margin: 10px 0 5px 0; font-size: 18px; text-decoration: underline; }\n" +
"              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }\n" +
"              th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }\n" +
"              th { background-color: #f0f0f0; font-weight: bold; }\n" +
"              .footer { text-align: center; font-size: 10px; margin-top: 20px; color: #555; }\n" +
"          </style>\n" +
"      </head>\n" +
"      <body>\n" +
"          <div class=\"header\">\n" +
"              <h1>Niramoy Clinic & Diagnostic</h1>\n" +
"              <p>Enayetpur, Sirajgonj | Mobile: 01730 923007</p>\n" +
"              <h2>${reportTitle}</h2>\n" +
"              <p style=\"font-weight:bold;\">${subtitle}</p>\n" +
"          </div>\n" +
"          <table>\n" +
"              <thead>${theadHtml}</thead>\n" +
"              <tbody>${contentHtml}</tbody>\n" +
"              <tfoot>${tfootHtml}</tfoot>\n" +
"          </table>\n" +
"          <div class=\"footer\">Printed on ${new Date().toLocaleString()}</div>\n" +
"          <script>\n" +
"              window.onload = function() { window.print(); window.close(); }\n" +
"          </script>\n" +
"      </body>\n" +
"      </html>\n" +
"    `;\n" +
"\n" +
"    const win = window.open('', '_blank');\n" +
"    if (win) {\n" +
"        win.document.write(printContent);\n" +
"        win.document.close();\n" +
"    }\n" +
"  };\n\n";

if(code.includes(hookPoint) && !code.includes('handlePrintList')) {
    code = code.replace(hookPoint, newFunc + hookPoint);
    fs.writeFileSync('components/DoctorAppointmentPage.tsx', code);
    console.log("Patched print list logic");
} else {
    console.log("Either not found or already patched");
}
