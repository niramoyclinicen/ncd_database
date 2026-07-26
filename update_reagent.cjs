const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticData.ts', 'utf8');

const target = `export interface Reagent {
  reagent_id: string; 
  reagent_name: string; 
  quantity: number; 
  unit: string; 
  availability: boolean;
  expiry_date?: string; 
  company?: string;      
  capacity_per_unit?: string; 
}`;

const replacement = `export interface Reagent {
  reagent_id: string; 
  reagent_name: string; 
  quantity: number; 
  unit: string; 
  availability: boolean;
  expiry_date?: string; 
  company?: string;      
  capacity_per_unit?: string; 
  linked_test?: string;
  linked_category?: string;
}`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('components/DiagnosticData.ts', code);
    console.log("Updated Reagent interface");
} else {
    console.log("Target not found in DiagnosticData.ts");
}
