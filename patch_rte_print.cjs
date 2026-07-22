const fs = require('fs');

let code = fs.readFileSync('components/RichTextEditor.tsx', 'utf8');

// The main wrapper shouldn't be no-print. Only the toolbar should be no-print.
// And during print, the editor should not scroll, it should expand to fit content.

code = code.replace(
    'className="flex flex-col h-full border border-slate-300 rounded overflow-hidden bg-white no-print w-full"',
    'className="flex flex-col h-full border border-slate-300 rounded overflow-hidden bg-white print:border-none print:bg-transparent w-full"'
);

code = code.replace(
    'className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-300 items-center"',
    'className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-300 items-center no-print"'
);

code = code.replace(
    'className="flex-1 p-6 overflow-y-auto outline-none rich-text-content text-black cursor-text"',
    'className="flex-1 p-6 overflow-y-auto print:overflow-visible print:p-0 outline-none rich-text-content text-black cursor-text"'
);

fs.writeFileSync('components/RichTextEditor.tsx', code);
console.log("Patched RichTextEditor.tsx for print");
