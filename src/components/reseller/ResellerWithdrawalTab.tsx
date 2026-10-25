import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Withdrawal } from '../../types/index.js';

interface ResellerWithdrawalTabProps {
  withdrawalsList: Withdrawal[];
  onRefresh: () => Promise<void>;
}

export const ResellerWithdrawalTab: React.FC<ResellerWithdrawalTabProps> = ({
  withdrawalsList,
  onRefresh,
}) => {
  const { lang, employee, employeeToken, refreshEmployeeProfile, showToast } = useApp();

  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!employee) return null;
  const availableBalance = employee.wallet.availableBalance;

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToken) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 500) {
      showToast(lang === 'bn' ? 'সর্বনিম্ন ৫০০ টাকা উত্তোলন করা যাবে।' : 'Minimum withdrawal is ৳500.', 'error');
      return;
    }
    if (numAmount > availableBalance) {
      showToast(lang === 'bn' ? 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।' : 'Insufficient balance.', 'error');
      return;
    }
    if (!account.trim()) {
      showToast(lang === 'bn' ? 'দয়া করে বিকাশ বা নগদ একাউন্ট নম্বর দিন।' : 'Please provide account number.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.employeeRequestWithdrawal(employeeToken, {
        amount: numAmount,
        paymentMethod: method,
        accountNumber: account.trim(),
        note: note.trim() || undefined,
      });
      showToast(lang === 'bn' ? 'উইথড্রয়াল আবেদন সফলভাবে জমা হয়েছে!' : 'Withdrawal request submitted!');
      setAmount('');
      setAccount('');
      setNote('');
      await refreshEmployeeProfile();
      await onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Withdrawal failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Two Column Layout: Balance & Withdrawal Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Balance Overview Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-[#009245] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                {lang === 'bn' ? 'উত্তোলনযোগ্য ব্যালেন্স' : 'Withdrawable Balance'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight">
              ৳{availableBalance.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-100 font-medium mt-1">
              {lang === 'bn' ? 'সর্বনিম্ন উত্তোলনের সীমা: ৳৫০০' : 'Minimum payout threshold: ৳500'}
            </p>
          </div>

          <div className="pt-4 border-t border-white/20 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-100">
              <span>{lang === 'bn' ? 'প্রক্রিয়াধীন টাকা:' : 'Pending Payout:'}</span>
              <span className="font-bold text-white">৳{employee.wallet.pendingWithdrawal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-100">
              <span>{lang === 'bn' ? 'মোট সফল উত্তোলন:' : 'Total Withdrawn:'}</span>
              <span className="font-bold text-white">৳{employee.wallet.totalWithdrawn.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Request Withdrawal Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ArrowDownLeft className="w-4 h-4 text-[#009245]" />
            <h3 className="text-sm font-bold text-slate-900">
              {lang === 'bn' ? 'নতুন টাকা উত্তোলনের আবেদন' : 'Request Payout / Withdrawal'}
            </h3>
          </div>

          <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (৳)'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="number"
                  min={500}
                  max={availableBalance}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'} <span className="text-[#009245]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('bKash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      method === 'bKash'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    বিকাশ (bKash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('Nagad')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      method === 'Nagad'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    নগদ (Nagad)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono font-semibold text-slate-900"
                />
              </div>

              {/* Note / Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'অতিরিক্ত নোট (ঐচ্ছিক)' : 'Note (Optional)'}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: পার্সোনাল নম্বর' : 'Personal number'}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || availableBalance < 500}
              className="w-full py-2.5 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? (lang === 'bn' ? 'আবেদন পাঠানো হচ্ছে...' : 'Submitting...')
                : (lang === 'bn' ? 'উইথড্রয়াল আবেদন কনফার্ম করুন' : 'Submit Withdrawal Request')}
            </button>

          </form>
        </div>

      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            {lang === 'bn' ? 'উইথড্রয়াল হিস্ট্রি ও পেমেন্ট রেকর্ড' : 'Withdrawal Request Records'}
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {withdrawalsList.length} {lang === 'bn' ? 'টি আবেদন' : 'requests'}
          </span>
        </div>

        {withdrawalsList.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'bn' ? 'পূর্বে কোনো উইথড্রয়াল রেকর্ড নেই।' : 'No withdrawal records found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px]">
                  <th className="pb-3">{lang === 'bn' ? 'পেমেন্ট মেথড' : 'Method'}</th>
                  <th className="pb-3">{lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}</th>
                  <th className="pb-3">{lang === 'bn' ? 'আবেদনের তারিখ' : 'Requested'}</th>
                  <th className="pb-3">{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="pb-3 text-right">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {withdrawalsList.map((wd) => {
                  const isApproved = wd.status === 'APPROVED';
                  const isRejected = wd.status === 'REJECTED';
                  return (
                    <tr key={wd.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-bold text-slate-900">
                        {wd.paymentMethod}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-700">
                        {wd.accountNumber}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(wd.requestDate).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 font-black text-slate-900">
                        ৳{wd.amount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{wd.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
