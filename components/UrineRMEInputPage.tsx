import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, SaveIcon, FileTextIcon } from './Icons';
import { Patient, LabInvoice, Doctor, Employee } from './DiagnosticData';

export interface UrineRMEResults {
  quantity: string; colour: string; appearance: string; sediment: string; specificGravity: string;
  reaction: string; albumin: string; sugar: string; excessPhosphate: string; bileSalt: string; bilePigment: string; ketones: string;
  epithelialCells: string; pusCells: string; rbc: string; calciumOxalate: string; amorphousPhosphate: string; bacteria: string; sperm: string; casts: string; crystals: string; uricAcid: string; others: string;
}

export const normalUrineRMEResults: UrineRMEResults = {
  quantity: 'Sufficient', colour: 'Straw', appearance: 'Clear', sediment: 'Nil', specificGravity: '1.015',
  reaction: 'Acidic', albumin: 'Nil', sugar: 'Nil', excessPhosphate: 'Nil', bileSalt: 'Nil', bilePigment: 'Nil', ketones: 'Nil',
  epithelialCells: '02-04', pusCells: '02-03', rbc: 'Nil', calciumOxalate: 'Nil', amorphousPhosphate: 'Nil', bacteria: 'Nil', sperm: 'Nil', casts: 'Nil', crystals: 'Nil', uricAcid: 'Nil', others: 'Nil',
};

const UrineRMEInputPage: React.FC<any> = ({ results: initialResults, onSaveOverride, disabled, patient, invoice, doctors, employees, technologistId, consultantId, isEmbedded }) => {
  const [localResults, setLocalResults] = useState<UrineRMEResults>(initialResults || normalUrineRMEResults);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => { 
      if (!typingTimeoutRef.current && initialResults) {
          setLocalResults(initialResults); 
      }
  }, [initialResults]);

  const formatCellValue = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 2) {
      // Input "24" -> "02-04"
      return `0${digits[0]}-0${digits[1]}`;
    } else if (digits.length === 3) {
      // Input "812" -> "08-12"
      return `0${digits[0]}-${digits[1]}${digits[2]}`;
    } else if (digits.length === 4) {
        // Input "1015" -> "10-15"
        return `${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
    }
    return val;
  };

  const updateField = (f: keyof UrineRMEResults, v: string, shouldFormat: boolean = false) => {
    let finalValue = v;
    if (shouldFormat) {
        finalValue = formatCellValue(v);
    }
    
    const updated = { ...localResults, [f]: finalValue };
    setLocalResults(updated);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        if (onSaveOverride && isEmbedded) {
            onSaveOverride(updated, true);
        }
        typingTimeoutRef.current = null;
    }, 800);
  };

  const InputRow = ({ label, field, options, isLast, autoFormat }: any) => {
    return (
      <div className={`flex items-center hover:bg-slate-50 transition-colors ${!isLast ? 'border-b border-black' : ''}`}>
        <div className="w-[140px] p-1.5 border-r border-black font-black text-[10px] text-slate-800 uppercase shrink-0">{label}</div>
        <div className="flex-1 p-0.5">
          {options ? (
            <select 
              value={localResults[field as keyof UrineRMEResults] || ''} 
              onChange={e => updateField(field as keyof UrineRMEResults, e.target.value)} 
              disabled={disabled} 
              className="w-full bg-transparent p-1 text-xs font-black text-slate-900 border-none outline-none focus:ring-1 focus:ring-blue-500 rounded no-print"
            >
              <option value="">Select...</option>
              {options.map((o:any) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input 
              value={localResults[field as keyof UrineRMEResults] || ''} 
              onChange={e => updateField(field as keyof UrineRMEResults, e.target.value)}
              onBlur={e => autoFormat ? updateField(field as keyof UrineRMEResults, e.target.value, true) : null}
              onFocus={e => e.currentTarget.select()} 
              disabled={disabled} 
              className="w-full bg-transparent p-1 text-xs font-black text-slate-900 border-none focus:ring-1 focus:ring-blue-500 outline-none no-print" 
              placeholder={autoFormat ? "e.g. 24" : "..."}
            />
          )}
          <span className="hidden print:block text-xs font-black pl-2 leading-none">{localResults[field as keyof UrineRMEResults] || 'Nil'}</span>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="bg-slate-100 border-b border-black p-1.5 text-center font-black text-[11px] uppercase tracking-[0.3em] text-slate-900 shadow-inner">{title}</div>
  );

  return (
    <div className={`flex flex-col h-full ${isEmbedded ? 'bg-transparent' : 'bg-slate-100 overflow-hidden'} font-sans text-black`}>
      <div className={`flex-1 ${isEmbedded ? '' : 'overflow-y-auto p-4 flex justify-center custom-scrollbar bg-slate-200/50'}`}>
        <div className={`${isEmbedded ? 'w-full' : 'bg-white w-full max-w-[820px] shadow-2xl p-12'} flex flex-col font-serif relative`}>
            <h1 className="text-xl text-center font-black underline uppercase tracking-[0.2em] mb-10 text-black">Urine Routine Examination (Urine R/M/E)</h1>
            
            <div className="flex-1">
              <div className="flex flex-col bg-white">
                
                {/* 1. PHYSICAL SECTION */}
                <div className="border-2 border-black rounded-xl overflow-hidden mb-8">
                  <SectionHeader title="Physical Examination" />
                  <div className="grid grid-cols-2 divide-x border-black">
                    <div className="flex flex-col">
                      <InputRow label="Quantity" field="quantity" options={['Sufficient', '5ml', '10ml', '20ml', '30ml']} />
                      <InputRow label="Colour" field="colour" options={['Straw', 'Pale Straw', 'Amber', 'Yellow', 'Reddish']} />
                      <InputRow label="Appearance" field="appearance" options={['Clear', 'Slightly Hazy', 'Hazy', 'Turbid']} isLast={true} />
                    </div>
                    <div className="flex flex-col">
                      <InputRow label="Sediment" field="sediment" options={['Nil', 'Present', 'Trace']} />
                      <InputRow label="Sp. Gravity" field="specificGravity" options={['1.010', '1.015', '1.020', '1.025']} isLast={true} />
                    </div>
                  </div>
                </div>

                {/* 2. CHEMICAL SECTION */}
                <div className="border-2 border-black rounded-xl overflow-hidden mb-8">
                  <SectionHeader title="Chemical Examination" />
                  <div className="grid grid-cols-2 divide-x border-black">
                    <div className="flex flex-col">
                      <InputRow label="Reaction" field="reaction" options={['Acidic', 'Neutral', 'Alkaline']} />
                      <InputRow label="Albumin" field="albumin" options={['Nil', 'Trace', '+', '++', '+++', '++++']} />
                      <InputRow label="Sugar" field="sugar" options={['Nil', 'Trace', '+', '++', '+++', '++++']} isLast={true} />
                    </div>
                    <div className="flex flex-col">
                      <InputRow label="Bile Salt" field="bileSalt" options={['Nil', 'Present']} />
                      <InputRow label="Bile Pigment" field="bilePigment" options={['Nil', 'Present']} />
                      <InputRow label="Ketones" field="ketones" options={['Nil', 'Trace', '+', '++', '+++']} isLast={true} />
                    </div>
                  </div>
                </div>

                {/* 3. MICROSCOPIC SECTION */}
                <div className="border-2 border-black rounded-xl overflow-hidden mb-8">
                  <SectionHeader title="Microscopic Examination" />
                  <div className="grid grid-cols-2 divide-x border-black">
                    <div className="flex flex-col">
                      <InputRow label="Epithelial Cells" field="epithelialCells" autoFormat={true} />
                      <InputRow label="Pus Cells" field="pusCells" autoFormat={true} />
                      <InputRow label="R.B.C" field="rbc" autoFormat={true} />
                      <InputRow label="Bacteria" field="bacteria" options={['Nil', 'Present', 'Few', 'Plenty']} />
                      <InputRow label="Spermatozoa" field="sperm" options={['Nil', 'Present']} isLast={true} />
                    </div>
                    <div className="flex flex-col">
                      <InputRow label="Casts" field="casts" options={['Nil', 'Granular', 'Hyaline', 'Pus Cast']} />
                      <InputRow label="Crystals" field="crystals" autoFormat={true} />
                      <InputRow label="Amorphous Phos" field="amorphousPhosphate" />
                      <InputRow label="Calcium Oxalate" field="calciumOxalate" />
                      <InputRow label="Uric Acid" field="uricAcid" isLast={true} />
                    </div>
                  </div>
                </div>
              </div>

              {/* IMPRESSION */}
              <div className="mt-4 pt-6 border-t-2 border-black mb-12">
                  <h4 className="text-[13px] font-black uppercase underline mb-3 italic tracking-tighter text-black">Impression / Notes:</h4>
                  <textarea 
                    value={localResults.others || ''} 
                    onChange={e => updateField('others', e.target.value)} 
                    className="w-full bg-blue-50/20 p-4 font-black text-[18px] leading-snug outline-none border-2 border-slate-200 rounded-2xl italic text-slate-950 no-print" 
                    rows={2} 
                    placeholder="Type any other findings..." 
                  />
                  <p className="hidden print:block text-[18px] font-black italic whitespace-pre-wrap text-black">{localResults.others || 'Urine routine examination reveals normal findings.'}</p>
              </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default UrineRMEInputPage;
