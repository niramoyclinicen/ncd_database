const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

// Replace all occurrences of `<div className="animate-fade-in relative h-full">` with `<div className="animate-fade-in relative h-full flex flex-col">`
code = code.replace(/<div className="animate-fade-in relative h-full">/g, '<div className="animate-fade-in relative h-full flex flex-col">');
code = code.replace(/<div className="animate-fade-in h-full relative">/g, '<div className="animate-fade-in h-full relative flex flex-col">');

// For other pages that just have `<div className="animate-fade-in">`, let's make them h-full flex flex-col too
code = code.replace(/<div className="animate-fade-in">/g, '<div className="animate-fade-in h-full flex flex-col">');

fs.writeFileSync('components/DiagnosticPage.tsx', code);
console.log('Fixed DiagnosticPage.tsx scrolling issues');
