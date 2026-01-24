import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Search, X, MessageSquare, Send, Sparkles, Loader2 } from 'lucide-react';
import { ExpenseItem, Employee, Medicine, PurchaseInvoice, SalesInvoice, LabInvoice } from './DiagnosticData';
import { IndoorInvoice } from './ClinicPage';

interface AIAssistantProps {
    detailedExpenses: Record<string, ExpenseItem[]>;
    setDetailedExpenses: React.Dispatch<React.SetStateAction<Record<string, ExpenseItem[]>>>;
    employees: Employee[];
    medicines: Medicine[];
    purchaseInvoices: PurchaseInvoice[];
    salesInvoices: SalesInvoice[];
    labInvoices: LabInvoice[];
    indoorInvoices: IndoorInvoice[];
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
    detailedExpenses, setDetailedExpenses, employees, 
    medicines, purchaseInvoices, salesInvoices, labInvoices, indoorInvoices 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'আসসালামু আলাইকুম! আমি NcD AI Assistant। আমি এখন আপনার ফার্মেসী স্টক, কেনাকাটা (Purchase) এবং একাউন্টিং-এর সব তথ্য জানি। আপনি আমাকে যেকোনো প্রশ্ন করতে পারেন।' }
    ]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

    // --- AI TOOLS DEFINITION ---
    const tools: any = [
        {
            functionDeclarations: [
                {
                    name: 'query_purchase_records',
                    description: 'Checks the history of medicine purchases from suppliers.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            query: { type: Type.STRING, description: 'Medicine name or Supplier name (e.g., Square Pharmaceuticals)' },
                            month: { type: Type.NUMBER, description: 'Month number (0-11) to filter' }
                        },
                        required: ['query']
                    }
                },
                {
                    name: 'query_expenses',
                    description: 'Searches for accounting expenses like mobile bills, generator, etc.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, description: 'Expense category (e.g., Mobile, Stuff salary)' },
                            description: { type: Type.STRING, description: 'Specific keyword in description' }
                        },
                        required: ['category']
                    }
                },
                {
                    name: 'check_stock',
                    description: 'Checks current inventory count for a medicine.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: 'Medicine brand or generic name' }
                        },
                        required: ['name']
                    }
                }
            ]
        }
    ];

    const handleAction = async (userText: string) => {
        if (!userText.trim()) return;
        const newMessages = [...messages, { role: 'user', text: userText } as Message];
        setMessages(newMessages); setInput(''); setLoading(true);
        
        try {
            // Initializing GoogleGenAI instance right before the call as per requirements.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const todayStr = new Date().toISOString().split('T')[0];

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
                config: {
                    systemInstruction: `You are the Master Assistant for NcD Clinic Management. 
                    Current System Date: ${todayStr}.
                    
                    DATA ACCESS RULES:
                    1. For "Medicine Buy" or "Supplier Spend", use query_purchase_records.
                    2. For "Mobile load", "Bills", "Salary", use query_expenses.
                    3. For "How many in stock", use check_stock.
                    
                    Always respond in Bengali. Be precise with BDT amounts.`,
                    tools: tools
                }
            });

            if (response.functionCalls) {
                for (const fc of response.functionCalls) {
                    let resultText = "";

                    if (fc.name === 'query_purchase_records') {
                        const { query } = fc.args as any;
                        let foundInvoices = purchaseInvoices.filter(inv => 
                            inv.source.toLowerCase().includes(query.toLowerCase()) ||
                            inv.items.some(it => it.tradeName.toLowerCase().includes(query.toLowerCase()))
                        );
                        
                        if (foundInvoices.length > 0) {
                            let totalSpent = foundInvoices.reduce((s, i) => s + i.paidAmount, 0);
                            let totalItems = foundInvoices.reduce((s, i) => s + i.items.length, 0);
                            resultText = `রেকর্ড অনুযায়ী, ${query} সংক্রান্ত মোট ${foundInvoices.length} টি পারচেজ ইনভয়েস পাওয়া গেছে। মোট খরচ হয়েছে ৳${totalSpent.toLocaleString()} এবং মোট ${totalItems} ধরণের আইটেম কেনা হয়েছে।`;
                        } else {
                            resultText = `দুঃখিত, "${query}" এর নামে কোনো কেনাকাটার (Purchase) রেকর্ড খুঁজে পাওয়া যায়নি।`;
                        }
                    } 
                    else if (fc.name === 'query_expenses') {
                        const { category, description } = fc.args as any;
                        let total = 0;
                        let count = 0;
                        
                        Object.values(detailedExpenses).flat().forEach((exp: any) => {
                            const catMatch = exp.category.toLowerCase().includes(category.toLowerCase());
                            const descMatch = description ? exp.description.toLowerCase().includes(description.toLowerCase()) : true;
                            if (catMatch && descMatch) {
                                total += exp.paidAmount;
                                count++;
                            }
                        });
                        
                        if (count > 0) {
                            resultText = `হিসাব অনুযায়ী, ${category} খাতে এ পর্যন্ত মোট ৳${total.toLocaleString()} খরচ করা হয়েছে (${count} টি এন্ট্রি)।`;
                        } else {
                            resultText = `${category} খাতে কোনো খরচের হিসাব পাওয়া যায়নি।`;
                        }
                    }
                    else if (fc.name === 'check_stock') {
                        const { name } = fc.args as any;
                        const match = medicines.find(m => m.tradeName.toLowerCase().includes(name.toLowerCase()) || m.genericName.toLowerCase().includes(name.toLowerCase()));
                        if (match) {
                            resultText = `${match.tradeName} (${match.strength}) বর্তমানে স্টকে আছে ${match.stock} টি। এর বিক্রয় মূল্য ৳${match.unitPriceSell} প্রতি ইউনিট।`;
                        } else {
                            resultText = `দুঃখিত, "${name}" নামে কোনো ঔষধ আমাদের স্টকে নেই।`;
                        }
                    }

                    if (resultText) {
                        setMessages(prev => [...prev, { role: 'model', text: resultText }]);
                    }
                }
            } else {
                setMessages(prev => [...prev, { role: 'model', text: response.text || 'দুঃখিত, আমি বিষয়টি বুঝতে পারছি না।' }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'model', text: 'সিস্টেমে কিছুটা সমস্যা হচ্ছে, দয়া করে আবার চেষ্টা করুন।' }]);
        } finally { setLoading(false); }
    };

    return (
        <>
            <div className="fixed bottom-6 left-6 z-[999] group no-print">
                <button onClick={() => setIsOpen(!isOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-rose-600 rotate-90' : 'bg-gradient-to-br from-blue-600 to-indigo-600'}`}>
                    {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                </button>
            </div>

            {isOpen && (
                <div className="fixed bottom-24 left-6 w-96 max-w-[calc(100vw-48px)] h-[550px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[998] flex flex-col overflow-hidden animate-fade-in-up no-print">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Sparkles size={20} /></div>
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tighter">NcD Smart AI</h3>
                                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full System Access</span></div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50 dark:bg-slate-950/20">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-md' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'}`}>{m.text}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start"><div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-tl-none border border-slate-200 dark:border-slate-700/50 flex items-center gap-3 shadow-sm"><Loader2 className="w-4 h-4 text-blue-500 animate-spin" /><span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">আমি তথ্য খুঁজছি...</span></div></div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                        <div className="relative">
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAction(input)} placeholder="যেমন: স্কয়ার থেকে কত টাকার ঔষধ কিনলাম?" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-5 pr-14 text-slate-800 dark:text-white text-sm outline-none focus:border-blue-500 transition-all placeholder:italic" />
                            <button onClick={() => handleAction(input)} disabled={loading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90"><Send size={18} /></button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistant;