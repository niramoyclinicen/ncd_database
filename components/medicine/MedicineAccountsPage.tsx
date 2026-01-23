
import React, { useMemo, useState } from 'react';
import { PurchaseInvoice, SalesInvoice } from '../DiagnosticData';
import { IndoorInvoice } from '../ClinicPage';
import { MedicineIcon, BackIcon, MapPinIcon, PhoneIcon } from '../Icons';

interface MedicineAccountsPageProps {
  onBack: () => void;
  purchaseInvoices: PurchaseInvoice[];
  salesInvoices: SalesInvoice[];
  indoorInvoices: IndoorInvoice[];
}

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const MedicineAccountsPage: React.FC<MedicineAccountsPageProps> = ({ 
  onBack, purchaseInvoices, salesInvoices, indoorInvoices 
}) => {
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [profitDistributionPercent, setProfitDistributionPercent] = useState<number>(50); // Default 50% for sample

    const stats = useMemo(() => {
        // Calculate Current Month Stats
        const currentInvoices = purchaseInvoices.filter(inv => {
            const d = new Date(inv.invoiceDate);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        const currentOutdoorSales = salesInvoices.filter(inv => {
            const d = new Date(inv.invoiceDate);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        const currentIndoorSales = indoorInvoices.filter(inv => {
            const d = new Date(inv.invoice_date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        // Summing values
        const totalBuyCurrent = currentInvoices.reduce((sum, inv) => sum + inv.netPayable, 0);
        const totalSellOutdoor = currentOutdoorSales.reduce((sum, inv) => sum + inv.netPayable, 0);
        const totalSellIndoor = currentIndoorSales.reduce((sum, inv) => {
            const medItemsTotal = inv.items
                .filter(it => it.service_type === 'Medicine')
                .reduce((s, it) => s + it.payable_amount, 0);
            return sum + medItemsTotal;
        }, 0);

        const totalSellCurrent = totalSellOutdoor + totalSellIndoor;

        // Cumulative Stats (Previous Months)
        const prevPurchaseTotal = purchaseInvoices.filter(inv => {
            const d = new Date(inv.invoiceDate);
            return d.getFullYear() < selectedYear || (d.getFullYear() === selectedYear && d.getMonth() < selectedMonth);
        }).reduce((sum, inv) => sum + inv.netPayable, 0);

        const prevOutdoorTotal = salesInvoices.filter(inv => {
            const d = new Date(inv.invoiceDate);
            return d.getFullYear() < selectedYear || (d.getFullYear() === selectedYear && d.getMonth() < selectedMonth);
        }).reduce((sum, inv) => sum + inv.netPayable, 0);

        const prevIndoorTotal = indoorInvoices.filter(inv => {
            const d = new Date(inv.invoice_date);
            return d.getFullYear() < selectedYear || (d.getFullYear() === selectedYear && d.getMonth() < selectedMonth);
        }).reduce((sum, inv) => {
             const medItemsTotal = inv.items
                .filter(it => it.service_type === 'Medicine')
                .reduce((s, it) => s + it.payable_amount, 0);
            return sum + medItemsTotal;
        }, 0);

        const totalSellPrev = prevOutdoorTotal + prevIndoorTotal;

        // Current Account Logic (Cash Deposits etc - Mocked based on structure)
        const cashDepositThisMonth = totalSellCurrent; // Assuming sales are cash for now
        const prevAccumulation = totalSellPrev - prevPurchaseTotal;

        // Monthly List Generation
        const monthlyData: Record<string, { buy: number, sell: number }> = {};
        [...purchaseInvoices, ...salesInvoices].forEach(inv => {
            const d = new Date(inv.invoiceDate);
            if (d.getFullYear() === selectedYear) {
                const monthName = monthOptions[d.getMonth()].name;
                if (!monthlyData[monthName]) monthlyData[monthName] = { buy: 0, sell: 0 };
                if ('invoiceId' in inv && inv.invoiceId.startsWith('PUR')) monthlyData[monthName].buy += inv.netPayable;
                else if ('invoiceId' in inv) monthlyData[monthName].sell += inv.netPayable;
            }
        });
        indoorInvoices.forEach(inv => {
            const d = new Date(inv.invoice_date);
            if (d.getFullYear() === selectedYear) {
                const monthName = monthOptions[d.getMonth()].name;
                if (!monthlyData[monthName]) monthlyData[monthName] = { buy: 0, sell: 0 };
                monthlyData[monthName].sell += inv.items.filter(it => it.service_type === 'Medicine').reduce((s, it) => s + it.payable_amount, 0);
            }
        });

        return {
            totalBuyCurrent,
            totalSellCurrent,
            totalBuyPrev: prevPurchaseTotal,
            totalSellPrev: totalSellPrev,
            prevAccumulation,
            cashDepositThisMonth,
            monthlyList: Object.entries(monthlyData).map(([name, data]) => ({ name, ...data }))
        };
    }, [purchaseInvoices, salesInvoices, indoorInvoices, selectedMonth, selectedYear]);

    const grandTotalSell = stats.totalSellCurrent + stats.totalSellPrev;
    const grandTotalBuy = stats.totalBuyCurrent + stats.totalBuyPrev;
    const currentBalance = grandTotalSell - grandTotalBuy;
    const profitDistValue = (currentBalance * profitDistributionPercent) / 100;
    const remainingBalance = currentBalance - profitDistValue;

    const handlePrint = () => {
        window.print();
    };

    const headerCell = "p-3 border border-slate-600 bg-slate-700 text-slate-100 font-bold text-center font-bengali";
    const cell = "p-3 border border-slate-600 text-slate-300 font-bold text-center";
    const labelCell = "p-3 border border-slate-600 text-slate-200 font-bold bg-slate-800/50 font-bengali";

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
            <header className="bg-slate-800 shadow-xl border-b border-slate-700 z-20 sticky top-0 no-print">
                <div className="max-w-7xl mx-auto py-6 px-6">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col items-start">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100">
                                Niramoy Clinic & Diagnostic
                            </h1>
                            <span className="text-xs text-cyan-500 uppercase tracking-widest">Medicine Accounts Summary</span>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onBack} className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
                                <BackIcon className="w-4 h-4" /> Back
                            </button>
                            <button onClick={handlePrint} className="bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-500 transition-shadow shadow-lg">
                                Print Sheet
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
                {/* Header Information (For Print) */}
                <div className="text-center mb-10 hidden print:block">
                    <h2 className="text-3xl font-bold font-bengali">নিরাময় ক্লিনিক এন্ড ডায়াগনস্টিক</h2>
                    <p className="text-lg font-bengali">এনায়েতপুর মন্ডলপাড়া, এনায়েতপুর সিরাজগঞ্জ।</p>
                </div>

                <div className="flex justify-between items-center mb-8 no-print">
                    <h2 className="text-3xl font-extrabold font-bengali text-amber-400 border-b-2 border-amber-500/30 pb-2">মেডিসিন ক্রয়-বিক্রয় ব্যালেন্স</h2>
                    <div className="flex gap-4">
                        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-800 border border-slate-700 p-2 rounded text-white font-bold outline-none focus:ring-2 focus:ring-blue-500">
                            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                        </select>
                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-800 border border-slate-700 p-2 rounded text-white font-bold outline-none focus:ring-2 focus:ring-blue-500">
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-3 border border-slate-600 w-1/4"></th>
                                <th className={headerCell}>মোট ঔষধ বিক্রয়</th>
                                <th className={headerCell}>মোট ঔষধ ক্রয়</th>
                                <th className={headerCell}>ব্যালেন্স</th>
                                <th className={headerCell}>লভ্যাংশ বণ্টন ({profitDistributionPercent}%)</th>
                                <th className={headerCell}>অবশিষ্ট</th>
                            </tr>
                        </thead>
                        <tbody className="text-lg">
                            <tr>
                                <td className={labelCell}>বর্তমান মাসের বিক্রয় =</td>
                                <td className={cell}>{stats.totalSellCurrent.toLocaleString()}</td>
                                <td className={cell}>{stats.totalBuyCurrent.toLocaleString()}</td>
                                <td className={`${cell} bg-slate-900/50`}></td>
                                <td className={`${cell} bg-slate-900/50`}></td>
                                <td className={`${cell} bg-slate-900/50`}></td>
                            </tr>
                            <tr>
                                <td className={labelCell}>পূর্বের মাস সমূহের জমা =</td>
                                <td className={cell}>{stats.totalSellPrev.toLocaleString()}</td>
                                <td className={cell}>{stats.totalBuyPrev.toLocaleString()}</td>
                                <td className={`${cell} bg-slate-900/50`}></td>
                                <td className={`${cell} bg-slate-900/50`}></td>
                                <td className={`${cell} bg-slate-900/50`}></td>
                            </tr>
                            <tr className="bg-blue-900/20">
                                <td className={`${labelCell} !bg-blue-900/30 text-2xl`}>মোট =</td>
                                <td className={`${cell} text-2xl text-emerald-400 font-black`}>{grandTotalSell.toLocaleString()}</td>
                                <td className={`${cell} text-2xl text-rose-400 font-black`}>{grandTotalBuy.toLocaleString()}</td>
                                <td className={`${cell} text-2xl text-blue-400 font-black bg-slate-900`}>{currentBalance.toLocaleString()}</td>
                                <td className={`${cell} text-2xl text-amber-400 font-black`}>{profitDistValue.toLocaleString()}</td>
                                <td className={`${cell} text-2xl text-white font-black bg-slate-800`}>{remainingBalance.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-16">
                    {/* Left Section: Current Summary */}
                    <div className="space-y-4">
                        <h4 className="text-2xl font-bold font-bengali text-cyan-400 mb-4 underline decoration-cyan-500/30">বর্তমান হিসাব:</h4>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden max-w-sm">
                            <table className="w-full">
                                <tbody>
                                    <tr className="border-b border-slate-700">
                                        <td className="p-4 font-bengali font-bold text-slate-300">পূর্বের মাস সমূহের জমা =</td>
                                        <td className="p-4 text-right font-black text-white text-xl border-l border-slate-700">{stats.prevAccumulation.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-slate-700">
                                        <td className="p-4 font-bengali font-bold text-slate-300">এই মাসের ক্যাশ জমা =</td>
                                        <td className="p-4 text-right font-black text-white text-xl border-l border-slate-700">{stats.cashDepositThisMonth.toLocaleString()}</td>
                                    </tr>
                                    <tr className="bg-emerald-900/20">
                                        <td className="p-4 font-bengali font-bold text-emerald-400">মোট জমা =</td>
                                        <td className="p-4 text-right font-black text-emerald-400 text-2xl border-l border-slate-700">{(stats.prevAccumulation + stats.cashDepositThisMonth).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-6">
                            <p className="text-xl font-bold font-bengali text-slate-400 flex items-center gap-4">
                                টাকা যে অবস্থায় আছে = 
                                <span className="bg-slate-800 border-b-2 border-slate-600 px-10 py-2 text-white font-mono min-w-[200px] text-center inline-block">
                                    {(stats.prevAccumulation + stats.cashDepositThisMonth).toLocaleString()}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Right Section: Monthly Breakdown */}
                    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 shadow-inner">
                        <h4 className="text-xl font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                             <MedicineIcon className="w-5 h-5 text-rose-400" />
                             Annual Performance Chart
                        </h4>
                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                            {stats.monthlyList.length > 0 ? stats.monthlyList.map((m, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                                    <span className="font-bold text-slate-200">{m.name}/{String(selectedYear).slice(-2)}</span>
                                    <div className="flex gap-6">
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 uppercase block">Sell</span>
                                            <span className="font-bold text-emerald-400">৳{m.sell.toLocaleString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 uppercase block">Buy</span>
                                            <span className="font-bold text-rose-400">৳{m.buy.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-600 italic">No historical data found for {selectedYear}.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-20 text-center text-slate-500 text-sm italic border-t border-slate-800 pt-6">
                    &copy; 2024 Niramoy Clinic Accounts Management System. All financial data calculated based on system invoices.
                </div>
            </main>
        </div>
    );
};

export default MedicineAccountsPage;
