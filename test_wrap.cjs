const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

// The block to wrap starts from: <div className="space-y-1">\n <div className="text-[14px] font-black font-['Hind_Siliguri'] underline mb-0.5">ক) ডায়াগনস্টিক হইতে :</div>
// And ends before: </div>\n <div className="space-y-4 flex flex-col pr-4 overflow-hidden">

const targetStart = `<div className="space-y-1">
                                        <div className="text-[14px] font-black font-['Hind_Siliguri'] underline mb-0.5">ক) ডায়াগনস্টিক হইতে :</div>`;
                                        
const replaceStart = `<div className="pl-12 pr-4 space-y-4">
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-black font-['Hind_Siliguri'] underline mb-0.5">ক) ডায়াগনস্টিক হইতে :</div>`;

const targetEnd = `                                        </table>
                                    </div>
                                </div>
                                <div className="space-y-4 flex flex-col pr-4 overflow-hidden">`;

const replaceEnd = `                                        </table>
                                    </div>
                                    </div>
                                </div>
                                <div className="space-y-4 flex flex-col pr-4 overflow-hidden">`;

let newCode = code.replace(targetStart, replaceStart).replace(targetEnd, replaceEnd);
fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', newCode);
