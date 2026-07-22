const fs = require('fs');

let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

// I need to find the yearlyBox that was appended and fix the closing tags.
// Let's first search where it's broken.

const yearlyStart = '<div className="bg-white text-gray-800 rounded-lg p-5 shadow-md border border-gray-200">';
// It replaced the `</div> </div> </div>` at the end of the file instead of the one inside the grid.
// Wait, no. The text `</div>\n        </div>\n      </div>` could match many things.

// Let's just fix the file from scratch if possible. Or I can restore it from the checkpoint.
// Wait, I can just use `patch.cjs` logic but properly regex replacing.
