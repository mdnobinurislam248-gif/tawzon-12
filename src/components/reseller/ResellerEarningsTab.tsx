import React from 'react';
import {
  TrendingUp,
  Percent,
  CheckCircle,
  HelpCircle,
  Calendar,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Transaction, Sale } from '../../types/index.js';

interface ResellerEarningsTabProps {
  transactionsList: Transaction[];
  salesList: Sale[];
}

export const ResellerEarningsTab: React.FC<ResellerEarningsTabProps> = ({
  transactionsList,
  salesList,
}) => {
  const { lang, employee } = useApp();
  if (!employee) return null;

  const commissionTransactions = transactionsList.filter(
    (t) => t.type === 'COMMISSION_EARNED'
  );

  return (
    <div className="space-y-6">
      
      {/* Commission Structure & Rate Notice */}
      <div className="bg-gradient-to-r from-emerald-50/70 via-sky-50/50 to-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#009245] flex items-center justify-center shadow-xs shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900">
              {lang === 'bn' ? 'আপনার বর্তমান কমিশন রেট' : 'Your Commission Structure'}
            </h3>
            <p className="text-xs text-slate-600">
              {employee.customCommissionRate && employee.customCommissionRate > 0
                ? (lang === 'bn'
                    ? `অ্যাডমিন কর্তৃক স্পেশাল ফ্ল্যাট রেট: ${employee.customCommissionRate}% প্রতিটি সফল বিক্রয়ে যোগ হবে`
                    : `Special custom rate: ${employee.customCommissionRate}% on every sale`)
                : (lang === 'bn'
                    ? 'প্রতিটি পণ্যের ক্যাটাগরি ও সেল রেট অনুযায়ী নির্ধারিত আকর্ষণীয় সর্বোচ্চ মার্জিন'
                    : 'Standard enterprise commission margin per product')}
            </p>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto text-right">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
            {lang === 'bn' ? 'মোট উপার্জন' : 'Total Earned'}
          </span>
          <span className="text-lg font-black text-emerald-700">
            ৳{employee.wallet.totalEarnings.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Commission Earnings History Ledger */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#009245]" />
            <h3 className="text-sm font-bold text-slate-900">
              {lang === 'bn' ? 'কমিশন অর্জনের বিস্তারিত হিসাব' : 'Commission Breakdown Ledger'}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {commissionTransactions.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
          </span>
        </div>

        {commissionTransactions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'bn' ? 'এখনো কোনো কমিশন জমা হয়নি।' : 'No commissions recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px]">
                  <th className="pb-3 font-semibold">{lang === 'bn' ? 'বিবরণ' : 'Description'}</th>
                  <th className="pb-3 font-semibold">{lang === 'bn' ? 'রেফারেন্স / অর্ডার' : 'Reference'}</th>
                  <th className="pb-3 font-semibold">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                  <th className="pb-3 font-semibold text-right">{lang === 'bn' ? 'কমিশন যোগ' : 'Credit'}</th>
                  <th className="pb-3 font-semibold text-right">{lang === 'bn' ? 'পরবর্তী ব্যালেন্স' : 'Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {commissionTransactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pr-3 font-bold text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-sky-700">
                      {item.reference}
                    </td>
                    <td className="py-3 pr-3 text-slate-500">
                      {new Date(item.timestamp).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 pr-3 text-right font-bold text-emerald-700">
                      +৳{item.amount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900">
                      ৳{item.balanceAfter.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
