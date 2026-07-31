const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetStr = `                </tbody>
            </table>
                    </div>
                </div>
            )}
    <div className="footer-sign-container no-break-inside">
        <div className="text-center w-64">
            <p className="text-[12px] font-black uppercase text-black mb-1">{techLabel}</p>`;

const newStr = `                </tbody>
            </table>
        </div>
    );
};

const Signatures = ({ customTechName, customTechDegree, customDocName, customDocDegree, techLabel = "Lab Technologist", docLabel = "Pathologist / Reporter" }: any) => (
    <div className="footer-sign-container no-break-inside">
        <div className="text-center w-64">
            <p className="text-[12px] font-black uppercase text-black mb-1">{techLabel}</p>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Fixed ReportHeader");
} else {
    console.log("Not found");
}
