const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target1 = `  const [connectionError, setConnectionError] = useState(false);`;
const replacement1 = `  const [connectionError, setConnectionError] = useState(false);\n  const [connectionErrorMessage, setConnectionErrorMessage] = useState('');`;

const target2 = `      if (loadedData) {
        if (Object.keys(loadedData).length > 0) {
          updateLocalState(loadedData);
        }
        setIsDataLoaded(true);
        setConnectionError(false);
      } else {
        // Hard block if cloud load fails, to prevent overwriting cloud with empty data
        setIsDataLoaded(false);
        setConnectionError(true);
      }`;
const replacement2 = `      if (loadedData && !loadedData._error) {
        if (Object.keys(loadedData).length > 0) {
          updateLocalState(loadedData);
        }
        setIsDataLoaded(true);
        setConnectionError(false);
      } else {
        // Hard block if cloud load fails, to prevent overwriting cloud with empty data
        setConnectionErrorMessage(loadedData ? loadedData._error : 'Unknown load error');
        setIsDataLoaded(false);
        setConnectionError(true);
      }`;

const target3 = `          <p className="text-slate-300 mb-8 font-medium">ইন্টারনেট কানেকশন চেক করুন। অনলাইনে ডাটা লোড না হওয়া পর্যন্ত সফটওয়্যারটি ব্যবহার করা যাবে না।</p>`;
const replacement3 = `          <p className="text-slate-300 mb-4 font-medium">ইন্টারনেট কানেকশন চেক করুন। অনলাইনে ডাটা লোড না হওয়া পর্যন্ত সফটওয়্যারটি ব্যবহার করা যাবে না।</p>\n          {connectionErrorMessage && <p className="text-red-400 mb-8 text-sm font-mono bg-slate-900 p-3 rounded-lg break-words">{connectionErrorMessage}</p>}`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);

fs.writeFileSync('App.tsx', code);
console.log('Fixed App.tsx to display error message');
