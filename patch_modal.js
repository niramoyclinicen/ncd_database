const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const stateBlockOld = `    const [currentReportData, setCurrentReportData] = useState<any>(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateSaveName, setTemplateSaveName] = useState('');`;

const stateBlockNew = `    const [currentReportData, setCurrentReportData] = useState<any>(null);
    // Template Modals State
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [showInsertTemplateModal, setShowInsertTemplateModal] = useState(false);
    
    const [templateSaveName, setTemplateSaveName] = useState('');
    const [templateSaveCategory, setTemplateSaveCategory] = useState('');
    const [templateSaveSubCategory, setTemplateSaveSubCategory] = useState('');
    
    const [insertTemplateCategoryFilter, setInsertTemplateCategoryFilter] = useState('All');
    const [insertTemplateSubCategoryFilter, setInsertTemplateSubCategoryFilter] = useState('All');
    const [insertTemplateSearchTerm, setInsertTemplateSearchTerm] = useState('');`;

content = content.replace(stateBlockOld, stateBlockNew);

fs.writeFileSync('components/LabReportingPage.tsx', content);
