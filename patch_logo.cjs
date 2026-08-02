const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

const targetStr = `                const b64 = ev.target?.result as string;
                setLogo(b64);
                localStorage.setItem('ncd_custom_logo', b64);`;

const replacementStr = `                const b64 = ev.target?.result as string;
                // Resize image to max 150x150 to save space
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 150;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const resizedB64 = canvas.toDataURL('image/jpeg', 0.8);
                    
                    setLogo(resizedB64);
                    try { localStorage.setItem('ncd_custom_logo', resizedB64); } catch(e){}
                };
                img.src = b64;`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('components/LabReportingPage.tsx', content);
    console.log("Patched logo resizing");
} else {
    console.log("Could not find logo logic");
}
