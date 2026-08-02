const fs = require('fs');
let content = fs.readFileSync('components/TemplateManagementPage.tsx', 'utf8');

const targetStrSave = `            setTemplates(updated);
            setIsEditing(false);
            if (performBlockingSync) setTimeout(performBlockingSync, 500);`;

const targetReplaceSave = `            setTemplates(updated);
            setIsEditing(false);
            if (performBlockingSync) performBlockingSync({ rtTemplates: updated });`;

const targetStrDel = `if(confirm("Delete this template?")) { setTemplates(templates.filter(x=>x.id!==t.id)); if(performBlockingSync) setTimeout(performBlockingSync, 500); }`;

const targetReplaceDel = `if(confirm("Delete this template?")) { 
    const updated = templates.filter(x=>x.id!==t.id); 
    setTemplates(updated); 
    if(performBlockingSync) performBlockingSync({ rtTemplates: updated }); 
}`;

if (content.includes(targetStrSave)) {
    content = content.replace(targetStrSave, targetReplaceSave);
} else {
    console.log("Could not find targetStrSave");
}

if (content.includes(targetStrDel)) {
    content = content.replace(targetStrDel, targetReplaceDel);
} else {
    console.log("Could not find targetStrDel");
}

fs.writeFileSync('components/TemplateManagementPage.tsx', content);
console.log("Patched TemplateManagementPage overrides");
