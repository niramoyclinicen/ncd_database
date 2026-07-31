const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetStr = `                    )}
                </div>
            </div>
        </div>
    );
};`;

const newTargetStr = `                    )}
                </div>
            </div>
            {renderModals()}
        </div>
    );
};`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newTargetStr);
    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Called renderModals successfully");
} else {
    console.log("Target string not found!");
}
