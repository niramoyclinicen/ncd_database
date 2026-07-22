import React, { useRef, useEffect } from 'react';

export const RichTextEditor = ({ value, onChange, readOnly = false, minHeight = '300px' }: any) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const exec = (cmd: string, arg?: string) => {
        document.execCommand(cmd, false, arg);
        if (editorRef.current) editorRef.current.focus();
        handleInput();
    };

    const editorStyles = {
        fontFamily: 'inherit',
        lineHeight: '1.5',
    };

    if (readOnly) {
        return (
            <div 
                className="rich-text-content text-black w-full" 
                dangerouslySetInnerHTML={{ __html: value || '' }} 
                style={editorStyles}
            />
        );
    }

    const btnClass = "px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700 border border-slate-300 cursor-pointer";

    return (
        <div className="flex flex-col h-full border border-slate-300 rounded overflow-hidden bg-white print:border-none print:bg-transparent w-full">
            <style>{`
                .rich-text-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                .rich-text-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                .rich-text-content p { margin: 0.5rem 0; }
                .rich-text-content h1, .rich-text-content h2, .rich-text-content h3 { font-weight: bold; margin: 1rem 0 0.5rem; }
            `}</style>
            <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-300 items-center no-print">
                <button type="button" onClick={() => exec('bold')} className={btnClass}><b>B</b></button>
                <button type="button" onClick={() => exec('italic')} className={btnClass}><i>I</i></button>
                <button type="button" onClick={() => exec('underline')} className={btnClass}><u>U</u></button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                
                <select onChange={(e) => exec('fontSize', e.target.value)} className="border border-slate-300 rounded text-xs px-1 h-6 cursor-pointer outline-none">
                    <option value="">Size...</option>
                    <option value="1">Smallest</option>
                    <option value="2">Small</option>
                    <option value="3">Normal</option>
                    <option value="4">Large</option>
                    <option value="5">Larger</option>
                    <option value="6">Huge</option>
                    <option value="7">Massive</option>
                </select>
                
                <select onChange={(e) => exec('fontName', e.target.value)} className="border border-slate-300 rounded text-xs px-1 h-6 cursor-pointer outline-none">
                    <option value="">Font...</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                </select>

                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button type="button" onClick={() => exec('justifyLeft')} className={btnClass}>Left</button>
                <button type="button" onClick={() => exec('justifyCenter')} className={btnClass}>Center</button>
                <button type="button" onClick={() => exec('justifyRight')} className={btnClass}>Right</button>
                <button type="button" onClick={() => exec('justifyFull')} className={btnClass}>Justify</button>
                
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button type="button" onClick={() => exec('insertUnorderedList')} className={btnClass}>Bullet</button>
                <button type="button" onClick={() => exec('insertOrderedList')} className={btnClass}>Number</button>

                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button type="button" onClick={() => exec('outdent')} className={btnClass}>Outdent</button>
                <button type="button" onClick={() => exec('indent')} className={btnClass}>Indent</button>
                <button type="button" onClick={() => exec('removeFormat')} className={btnClass} title="Clear Formatting">Clear</button>
            </div>
            
            <div 
                ref={editorRef}
                className="flex-1 p-6 overflow-y-auto print:overflow-visible print:p-0 outline-none rich-text-content text-black cursor-text"
                contentEditable
                onInput={handleInput}
                onBlur={handleInput}
                style={{ ...editorStyles, minHeight }}
            />
        </div>
    );
};
