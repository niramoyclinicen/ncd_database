const fs = require('fs');
let content = fs.readFileSync('components/TemplateManagementPage.tsx', 'utf8');

const targetCompStr = `const TemplateManagementPage: React.FC<any> = ({ onBack, tests = [] }) => {`;
const targetCompReplace = `const TemplateManagementPage: React.FC<any> = ({ onBack, tests = [], templates, setTemplates, performBlockingSync }) => {`;

if (content.includes(targetCompStr)) {
    content = content.replace(targetCompStr, targetCompReplace);
    
    // Remove local state
    const localStateRegex = /const \[templates, setTemplates\] = useState<RichTextTemplate\[\]>\(\(\) => \{[\s\S]*?\}\);/m;
    content = content.replace(localStateRegex, '');

    // Replace useEffect for localStorage
    const localEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[templates\]\);/m;
    content = content.replace(localEffectRegex, `useEffect(() => {
        try {
            localStorage.setItem('ncd_rt_templates_v1', JSON.stringify(templates));
        } catch(e) {}
    }, [templates]);`);

    // Ensure handleSave, etc., call performBlockingSync
    const handleSaveRegex = /setTemplates\(updated\);\s*setIsEditing\(false\);/m;
    content = content.replace(handleSaveRegex, `setTemplates(updated);\n            setIsEditing(false);\n            if (performBlockingSync) setTimeout(performBlockingSync, 500);`);

    const handleDeleteRegex = /if\(confirm\("Delete this template\?"\)\) setTemplates\(templates\.filter\(x=>x\.id!==t\.id\)\)/g;
    content = content.replace(handleDeleteRegex, `if(confirm("Delete this template?")) { setTemplates(templates.filter(x=>x.id!==t.id)); if(performBlockingSync) setTimeout(performBlockingSync, 500); }`);

    fs.writeFileSync('components/TemplateManagementPage.tsx', content);
    console.log("Patched TemplateManagementPage");
} else {
    console.log("Could not find targetCompStr");
}
