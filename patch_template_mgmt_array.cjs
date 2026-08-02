const fs = require('fs');
let content = fs.readFileSync('components/TemplateManagementPage.tsx', 'utf8');

content = content.replace(
    /const TemplateManagementPage: React.FC<any> = \(\{ onBack, tests = \[\], templates = \[\], setTemplates, performBlockingSync \}\) => \{/,
    `const TemplateManagementPage: React.FC<any> = ({ onBack, tests = [], templates: _templates, setTemplates, performBlockingSync }) => {
    const templates = Array.isArray(_templates) ? _templates : [];`
);

fs.writeFileSync('components/TemplateManagementPage.tsx', content);
console.log("Patched TemplateManagementPage array check");
