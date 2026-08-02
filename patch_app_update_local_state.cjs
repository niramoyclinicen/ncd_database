const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const targetStr = `      if (Array.isArray(data.reports)) setReports(data.reports);`;
const replacementStr = `      if (Array.isArray(data.reports)) setReports(data.reports);
      if (Array.isArray(data.rtTemplates)) {
          setRtTemplates(data.rtTemplates);
          try {
              localStorage.setItem('ncd_rt_templates_v1', JSON.stringify(data.rtTemplates));
          } catch(e){}
      }`;

if (content.includes(targetStr) && !content.includes('data.rtTemplates')) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('App.tsx', content);
    console.log("Patched App.tsx updateLocalState");
}
