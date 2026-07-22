const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

code = code.replace(
    '                                </div>\n                                \n                                </div>\n                            </div>\n                        </div>\n                    ) : (',
    '                                </div>\n                            </div>\n                        </div>\n                    ) : ('
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
console.log("Fixed Tags");
