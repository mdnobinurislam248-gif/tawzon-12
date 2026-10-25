import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Share2,
  Search,
  Filter,
  Eye,
  X,
  TrendingUp,
  PackageCheck,
  Ban,
  DollarSign,
  Phone,
  MapPin,
  ShoppingBag,
  Sparkles,
  Calculator,
  Info,
  Percent,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';

interface ReferralMember {
  id: string;
  name: string;
  phone: string;
  district?: string;
  thana?: string;
  status: string;
  registeredAt: string;
  avatarUrl?: string;
  orderCount?: number;
  referralCommission?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  totalSales?: number;
  paidCommission?: number;
  pendingCommission?: number;
}

interface ReferralData {
  referenceCode: string;
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  bonusEarned: number;
  referrals: ReferralMember[];
}

export const ResellerReferralTab: React.FC = () => {
  const { lang, employee, employeeToken, showToast } = useApp();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<ReferralMember | null>(null);

  const loadReferrals = async () => {
    if (!employeeToken) return;
    setLoading(true);
    try {
      const res = await api.employeeGetReferrals(employeeToken);
      setReferralData(res);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [employeeToken]);

  if (!employee) return null;

  const refCode = referralData?.referenceCode || employee.referenceCode || `REF-${(employee.phone ? employee.phone.slice(-5) : employee.id.slice(-5)).toUpperCase()}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tawzoonnexus.com';
  const referralLink = `${origin}/?portal=reseller&ref=${encodeURIComponent(refCode)}`;
  const whatsappMessage = `আসসালামু আলাইকুম! তাওজুন (Tawzoon) প্ল্যাটফর্মে রিসেলার হিসেবে যুক্ত হয়ে ঘরে বসে চমৎকার কমিশন আয় করুন। কোনো প্রকার ইনভেস্টমেন্ট ছাড়াই শুরু করুন আপনার অনলাইন রিসেলিং ব্যবসা।\n\n📌 আমার রেফারেন্স কোড: ${refCode}\n🔗 সরাসরি রেজিস্ট্রেশন লিংক: ${referralLink}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    showToast(lang === 'bn' ? 'রেফারেল কোড কপি হয়েছে!' : 'Referral code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast(lang === 'bn' ? 'রেফারেল লিংক কপি হয়েছে!' : 'Referral link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredReferrals = referralData?.referrals.filter(ref => 
    ref.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ref.phone.includes(searchTerm)
  ) || [];

  return (
    <div className="space-y-3 sm:space-y-5 pb-10">
      
      {/* Header Section (Compact & Sleek) */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
              {lang === 'bn' ? 'রেফারেল ও নেটওয়ার্ক' : 'Referral & Network'}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
              {lang === 'bn' ? 'যুক্ত হওয়া রিসেলার ও আয়ের বিস্তারিত' : 'Network details & earnings'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
           <button 
             onClick={loadReferrals}
             className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors border border-slate-200 cursor-pointer"
             title={lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
           >
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
           </button>
           <a
             href={whatsappShareUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
           >
             <MessageCircle className="w-3.5 h-3.5 fill-current" />
             <span>WhatsApp</span>
           </a>
        </div>
      </div>

      {/* Main Stats Grid (Compact & Perfectly Adjusted for Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: Total Referrals */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {lang === 'bn' ? 'মোট রেফারেল' : 'Total Referred'}
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {referralData?.totalCount || 0} {lang === 'bn' ? 'জন' : ''}
          </div>
        </div>

        {/* Card 2: Active Resellers */}
        <div className="bg-[#f0faf3] border border-[#d8f0e0] rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            {lang === 'bn' ? 'সক্রিয় সদস্য' : 'Active Resellers'}
          </span>
          <div className="text-base sm:text-lg font-black text-[#009245] font-mono">
            {referralData?.approvedCount || 0} {lang === 'bn' ? 'জন' : ''}
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            {lang === 'bn' ? 'পেন্ডিং আবেদন' : 'Pending'}
          </span>
          <div className="text-base sm:text-lg font-black text-amber-700 font-mono">
            {referralData?.pendingCount || 0} {lang === 'bn' ? 'জন' : ''}
          </div>
        </div>

        {/* Card 4: Total Referral Bonus */}
        <div className="bg-[#eafff3] border border-[#c6f6dd] rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
            {lang === 'bn' ? 'বোনাস আয়' : 'Bonus Earned'}
          </span>
          <div className="text-base sm:text-lg font-black text-[#009245] font-mono">
            ৳{(referralData?.bonusEarned || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Share Section (Compact & Clean) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Box 1: Referral Code */}
        <div className="bg-[#fdf2f8] border border-pink-100 rounded-xl p-3 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block">
            {lang === 'bn' ? 'রেফারেল কোড' : 'Referral Code'}
          </span>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-pink-200 rounded-lg py-1.5 px-3 text-center font-mono font-black text-base text-pink-600 tracking-wider shadow-inner select-all">
              {refCode}
            </div>
            <button 
              onClick={handleCopyCode}
              className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-bold ${
                copiedCode ? 'bg-emerald-500 text-white' : 'bg-white text-pink-600 border border-pink-200 hover:bg-pink-50'
              }`}
              title={lang === 'bn' ? 'কোড কপি' : 'Copy Code'}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Box 2: Online Invitation Link */}
        <div className="bg-[#f0faf3] border border-emerald-100 rounded-xl p-3 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block">
            {lang === 'bn' ? 'অনলাইন ইনভাইটেশন লিংক' : 'Invitation Link'}
          </span>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-emerald-200 rounded-lg py-1.5 px-2.5 text-xs font-mono text-slate-600 truncate shadow-inner select-all">
              {referralLink}
            </div>
            <button 
              onClick={handleCopyLink}
              className={`px-2.5 py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-bold ${
                copiedLink ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
              }`}
              title={lang === 'bn' ? 'লিংক কপি' : 'Copy Link'}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে ইনভাইটেশন লিংক শেয়ার' : 'Share on WhatsApp'}</span>
          </a>
        </div>
      </div>

      {/* Referral Policy & Automatic Profit Sharing Guide (Professional, Mobile-optimized) */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-white to-slate-50 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-950">
            <Calculator className="w-4 h-4 text-[#009245] shrink-0" />
            <span>{lang === 'bn' ? 'রেফারেল কমিশন ও প্রাইসিং নীতিমালা' : 'Referral Commission & Pricing Policy'}</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
            {lang === 'bn' ? 'অটো মেশিন ক্যালকুলেশন' : 'Auto Calculated'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {/* Rule 1: 10% Profit Sharing */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-3xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Percent className="w-3.5 h-3.5 text-[#009245]" />
              <span>{lang === 'bn' ? 'টিম প্রফিট শেয়ারিং (১০% কমিশন):' : 'Team Profit Sharing (10%):'}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার রেফারেল কোড দিয়ে খোলা অ্যাকাউন্টের রিসেলার পণ্যের অর্ডারে যত টাকা লাভ করবে, তার ১০% (সর্বোচ্চ লিমিট পর্যন্ত) আপনার ওয়ালেটে রেফারেল বোনাস হিসেবে যোগ হবে। ১০০ টাকার বেশি লাভ হলেও বোনাস নির্দিষ্ট লিমিটেই সীমাবদ্ধ থাকবে।'
                : 'Whenever a reseller referred by you earns profit, you earn 10% up to the maximum bonus limit (capped at 100-taka profit equivalent).'}
            </p>
            <div className="p-1.5 bg-emerald-50/70 rounded-lg border border-emerald-150 text-[10.5px] font-medium text-emerald-900 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>• ১০০ টাকা লাভে আপনি পাবেন:</span>
                <span className="font-bold font-mono text-[#009245]">৳১০ (সর্বোচ্চ লিমিট)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• ৫০ টাকা লাভে আপনি পাবেন:</span>
                <span className="font-bold font-mono text-[#009245]">৳৫</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• ২০০ বা ৫০০ টাকা লাভেও পাবেন:</span>
                <span className="font-bold font-mono text-[#009245]">৳১০ (সীমিত)</span>
              </div>
            </div>
          </div>

          {/* Rule 2: Wholesale Pricing & 10 TK Policy */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-3xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'bn' ? 'প্রোডাক্ট প্রাইসিং ও ১০ টাকা নীতি:' : 'Product Pricing & ৳10 Policy:'}</span>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
              <li className="flex items-start gap-1">
                <span className="text-[#009245] font-bold shrink-0">✓</span>
                <span>
                  <strong>অফিসিয়াল অ্যাকাউন্ট (বিশেষ কোড):</strong> মূল ওরিজিনাল প্রাইস দেখতে পাবেন; কোনো বাড়তি ফি বা বোনাস কাটা হবে না।
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>
                  <strong>রিসেলার রেফারেল:</strong> মূল পাইকারি প্রাইস থেকে স্বয়ংক্রিয়ভাবে ১০ টাকা বেশি থাকবে (রেফারেল নেটওয়ার্কের বোনাস নিশ্চিত করতে)।
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-slate-500 font-bold shrink-0">✓</span>
                <span>
                  <strong>রেফারেন্স ছাড়া অ্যাকাউন্ট:</strong> তাও মূল প্রাইস থেকে ১০ টাকা বেশি থাকবে এবং তা কোম্পানির বোনাস হিসেবে যুক্ত হবে। বাকি সকল উদ্বৃত্ত কোম্পানির অ্যাকাউন্টে সংরক্ষিত থাকে।
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Referral Members List */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">আপনার নেটওয়ার্ক সদস্যবৃন্দ</h3>
            <span className="text-[11px] font-bold text-slate-400">সর্বমোট {referralData?.referrals.length || 0} জন</span>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={lang === 'bn' ? 'নাম বা মোবাইল দিয়ে খুঁজুন...' : 'Search by name or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {referralData && filteredReferrals.length > 0 ? (
          <>
            {/* Mobile View: Cards (No horizontal cutoffs) */}
            <div className="block sm:hidden p-3 space-y-2.5">
              {filteredReferrals.map((ref) => (
                <div
                  key={ref.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        {ref.avatarUrl ? (
                          <img src={ref.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Users className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">{ref.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{ref.phone}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
                      ref.status === 'APPROVED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {ref.status === 'APPROVED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {ref.status === 'APPROVED' ? 'সক্রিয়' : 'পেন্ডিং'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">অর্ডার</span>
                      <span className="font-black text-slate-700">{ref.orderCount || 0}টি</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">বোনাস</span>
                      <span className="font-black text-emerald-600">৳{(ref.referralCommission || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">তারিখ</span>
                      <span className="font-mono text-slate-500 text-[10px]">
                        {new Date(ref.registeredAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReferral(ref)}
                    className="w-full py-1.5 px-3 bg-emerald-50/70 hover:bg-emerald-100/90 text-[#009245] hover:text-[#007a37] rounded-xl text-xs font-bold border border-emerald-200/90 transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#009245]" />
                    <span>বিস্তারিত দেখুন</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet View: Full Table */}
            <div className="hidden sm:block overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">সদস্যের নাম ও তথ্য</th>
                    <th className="px-4 py-4 text-center">স্ট্যাটাস</th>
                    <th className="px-4 py-4 text-center">অর্ডার সংখ্যা</th>
                    <th className="px-4 py-4 text-center">বোনাস</th>
                    <th className="px-4 py-4 text-center">অ্যাকশন</th>
                    <th className="px-6 py-4 text-right">নিবন্ধন তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {filteredReferrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {ref.avatarUrl ? (
                              <img src={ref.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{ref.name}</h4>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">{ref.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          ref.status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {ref.status === 'APPROVED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {ref.status === 'APPROVED' ? 'সক্রিয়' : 'পেন্ডিং'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <span className="text-xs font-black text-slate-700">{ref.orderCount || 0}টি</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <span className="text-xs font-black text-emerald-600">৳{(ref.referralCommission || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <button 
                           onClick={() => setSelectedReferral(ref)}
                           className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-xs"
                         >
                           <Eye className="w-4 h-4" />
                         </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-[11px] text-slate-500 font-bold font-mono">
                           {new Date(ref.registeredAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                {searchTerm ? 'অনুসন্ধান অনুযায়ী কেউ নেই' : 'এখনো কোনো রেফারেল যুক্ত হয়নি'}
              </p>
              <p className="text-xs text-slate-500 font-bold mt-1 max-w-xs mx-auto">
                {searchTerm ? 'দয়া করে অন্য কোনো নাম বা মোবাইল নম্বর দিয়ে চেষ্টা করুন।' : 'আপনার রেফারেল কোড ব্যবহার করে অন্যদের ইনভাইট করুন এবং বাড়তি কমিশন আয় করুন।'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Referral Details Modal (Compact, Top-Aligned on Mobile, Professional) */}
      {selectedReferral && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReferral(null);
          }}
          className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-start sm:items-center justify-center p-2.5 sm:p-5 pt-3 sm:pt-6 pb-20 sm:pb-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[86vh] sm:max-h-[88vh] animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-auto"
          >
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-emerald-50 via-slate-50 to-emerald-50/40 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
               <div className="flex items-center gap-2.5 min-w-0">
                 <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-[#009245] shadow-xs overflow-hidden shrink-0 flex items-center justify-center">
                   {selectedReferral.avatarUrl ? (
                     <img src={selectedReferral.avatarUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-[#009245] font-black text-sm">
                       {selectedReferral.name ? selectedReferral.name.charAt(0).toUpperCase() : 'R'}
                     </span>
                   )}
                 </div>
                 <div className="min-w-0">
                   <div className="flex items-center gap-1.5 flex-wrap">
                     <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                       {selectedReferral.name}
                     </h3>
                     <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0 ${
                       selectedReferral.status === 'APPROVED'
                         ? 'bg-emerald-100/90 text-emerald-800 border-emerald-200'
                         : 'bg-amber-100/90 text-amber-800 border-amber-200'
                     }`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${selectedReferral.status === 'APPROVED' ? 'bg-[#009245]' : 'bg-amber-500'}`} />
                       {selectedReferral.status === 'APPROVED' ? 'সক্রিয়' : 'পেন্ডিং'}
                     </span>
                   </div>
                   <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                     <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                     <span>নিবন্ধন: {new Date(selectedReferral.registeredAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                   </div>
                 </div>
               </div>

               <button 
                 type="button"
                 onClick={() => setSelectedReferral(null)}
                 className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-3xs cursor-pointer shrink-0"
                 aria-label="Close"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>

            {/* Modal Body (Scrollable, Ultra-Clean & Compact) */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 text-slate-800 text-xs">
               
               {/* 0. Unified Reference Profile Card */}
               <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/90 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-emerald-800 font-bold shrink-0">টাইপ:</span>
                    <span className="font-black text-emerald-950 flex items-center gap-1">
                      🤝 পার্সোনাল রিসেলার রেফারেল
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                    <span className="text-emerald-800 font-bold shrink-0">রেফারার নাম:</span>
                    <strong className="font-extrabold text-slate-900 truncate text-right">
                      {employee.name}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                    <span className="text-emerald-800 font-bold shrink-0">রেফারেল কোড:</span>
                    <span className="font-mono font-black text-slate-800 shrink-0">
                      {refCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                    <span className="text-emerald-800 font-bold shrink-0">ফি কর্তন:</span>
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      রেফারেল ফি কর্তন প্রযোজ্য (সিস্টেম নির্ধারিত ফি)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                    <span className="text-emerald-800 font-bold shrink-0">সর্বোচ্চ বোনাস লিমিট:</span>
                    <span className="font-mono font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 text-xs">
                      ৳{employee.referralCommissionRate || 10} টাকা প্রতি ১০০ টাকায় (১০০ টাকাতে ৳{employee.referralCommissionRate || 10} প্রফিট)
                    </span>
                  </div>
               </div>

               {/* 1. Contact & Location Info */}
               <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80">
                     <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                       <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                       <span>মোবাইল নম্বর</span>
                     </div>
                     <p className="text-xs font-bold text-slate-900 font-mono truncate">{selectedReferral.phone}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80">
                     <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                       <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                       <span>অবস্থান / ঠিকানা</span>
                     </div>
                     <p className="text-xs font-bold text-slate-800 truncate">
                       {selectedReferral.thana ? `${selectedReferral.thana}, ` : ''}{selectedReferral.district || 'অনুল্লেখিত'}
                     </p>
                  </div>
               </div>

               {/* 2. Order & Sales Performance */}
               <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>অর্ডার ও বিক্রয় পারফরম্যান্স</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                     <div className="p-2 bg-blue-50/70 rounded-xl border border-blue-100/90 text-center">
                        <span className="text-[9px] font-bold text-blue-600 block mb-0.5">মোট অর্ডার</span>
                        <p className="text-xs sm:text-sm font-black text-blue-800">{selectedReferral.orderCount || 0}টি</p>
                     </div>
                     <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-100/90 text-center">
                        <span className="text-[9px] font-bold text-emerald-600 block mb-0.5">ডেলিভারড</span>
                        <p className="text-xs sm:text-sm font-black text-emerald-800">{selectedReferral.deliveredOrders || 0}টি</p>
                     </div>
                     <div className="p-2 bg-rose-50/70 rounded-xl border border-rose-100/90 text-center">
                        <span className="text-[9px] font-bold text-rose-600 block mb-0.5">বাতিল</span>
                        <p className="text-xs sm:text-sm font-black text-rose-800">{selectedReferral.cancelledOrders || 0}টি</p>
                     </div>
                  </div>

                  {/* Total Sales Banner */}
                  <div className="p-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-between shadow-2xs">
                     <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
                       <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                       <span>মোট বিক্রয় (Sales Value)</span>
                     </div>
                     <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                       ৳{(selectedReferral.totalSales || 0).toLocaleString()}
                     </span>
                  </div>
               </div>

               {/* 3. Commission & Revenue Breakdown */}
               <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <DollarSign className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                    <span>কমিশন ও আয় বিবরণী</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-3xs">
                       <span className="text-[10px] font-bold text-slate-400 block mb-0.5">অর্জিত কমিশন</span>
                       <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">৳{(selectedReferral.referralCommission || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-150 rounded-xl">
                       <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">পরিশোধিত আয়</span>
                       <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono">৳{(selectedReferral.paidCommission || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-amber-50/50 border border-amber-150 rounded-xl">
                       <span className="text-[10px] font-bold text-amber-700 block mb-0.5">পেন্ডিং কমিশন</span>
                       <span className="text-xs sm:text-sm font-black text-amber-800 font-mono">৳{(selectedReferral.pendingCommission || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between">
                       <span className="text-[10px] font-bold text-slate-500 block mb-0.5">রেফারেল স্ট্যাটাস</span>
                       <span className={`inline-flex items-center gap-1 text-[10px] font-black w-fit px-2 py-0.5 rounded-full border ${
                         selectedReferral.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                       }`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${selectedReferral.status === 'APPROVED' ? 'bg-[#009245]' : 'bg-amber-500'}`} />
                         {selectedReferral.status === 'APPROVED' ? 'ভেরিফাইড' : 'অপেক্ষমান'}
                       </span>
                    </div>
                  </div>
               </div>

            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
               <span className="text-[10px] text-slate-400 font-medium">
                 রিসেলার রেফারেন্স নেটওয়ার্ক
               </span>
               <button 
                 type="button"
                 onClick={() => setSelectedReferral(null)}
                 className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-3xs transition cursor-pointer"
               >
                 বন্ধ করুন
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
