const fs = require('fs');
let content = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');
content = content.replace(`        if (labInvoices) {
            labInvoices.forEach((inv: any) => {
                // Skip invoices before usage_start_date
                if (reagent.usage_start_date && inv.invoice_date < reagent.usage_start_date) return;
            labInvoices.forEach((inv: any) => {
                inv.items.forEach((item: any) => {`, `        if (labInvoices) {
            labInvoices.forEach((inv: any) => {
                if (reagent.usage_start_date && inv.invoice_date < reagent.usage_start_date) return;
                inv.items.forEach((item: any) => {`);
fs.writeFileSync('components/ReagentInfoPage.tsx', content);
