import React, { useState, useEffect } from 'react';
import {
  User,
  Camera,
  Copy,
  Check,
  Users,
  Lock,
  MessageCircle,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
  ShieldCheck,
  Share2,
  ExternalLink,
  Sparkles,
  Eye,
  X,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { isOfficialReferenceCode } from '../../utils/pricing.js';

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

interface ResellerProfileTabProps {
  onOpenWithdrawal: () => void;
  onRefresh: () => void;
}

export const ResellerProfileTab: React.FC<ResellerProfileTabProps> = ({
  onOpenWithdrawal,
  onRefresh,
}) => {
  const { lang, employee, employeeToken, setEmployeeSession, showToast, brandSettings } = useApp();

  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [copiedRefCode, setCopiedRefCode] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralMember | null>(null);

  // Edit Name & Avatar Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(employee?.name || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(employee?.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password Change
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadReferralStats = async () => {
    if (!employeeToken) return;
    setLoadingReferrals(true);
    try {
      const res = await api.employeeGetReferrals(employeeToken);
      setReferralData(res);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    loadReferralStats();
  }, [employeeToken]);

  if (!employee) return null;

  const refCode = referralData?.referenceCode || employee.referenceCode || `REF-${(employee.phone ? employee.phone.slice(-5) : employee.id.slice(-5)).toUpperCase()}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tawzoonnexus.com';
  const referralLink = `${origin}/?portal=reseller&ref=${encodeURIComponent(refCode)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedRefCode(true);
    showToast(lang === 'bn' ? 'রেফারেল কোড কপি হয়েছে!' : 'Referral code copied!');
    setTimeout(() => setCopiedRefCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedRefLink(true);
    showToast(lang === 'bn' ? 'রেফারেল আমন্ত্রণ লিংক কপি হয়েছে!' : 'Referral invitation link copied!');
    setTimeout(() => setCopiedRefLink(false), 2000);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employeeToken) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === 'bn' ? 'ছবির সাইজ ৫MB এর কম হতে হবে।' : 'Image size must be under 5MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await api.employeeUploadAvatar(employeeToken, base64);
          setEditAvatarUrl(res.url);
          showToast(lang === 'bn' ? 'ছবি আপলোড হয়েছে!' : 'Avatar uploaded!');
        } catch (err: any) {
          showToast(err.message || 'Upload failed', 'error');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToken || !editName.trim()) return;

    setIsSaving(true);
    try {
      const res = await api.employeeUpdateProfile(employeeToken, {
        name: editName.trim(),
        avatarUrl: editAvatarUrl || undefined,
      });
      setEmployeeSession(employeeToken, res.employee);
      setIsEditModalOpen(false);
      onRefresh();
      showToast(lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(lang === 'bn' ? 'নতুন পাসওয়ার্ড দুটি মেলেনি।' : 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    if (!employeeToken) return;

    setPasswordLoading(true);
    try {
      await api.employeeChangePassword(employeeToken, {
        oldPassword,
        newPassword,
      });
      setIsPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : 'Password changed successfully!');
    } catch (err: any) {
      setPasswordError(err.message || 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`TAWZOON এ রিসেলার হিসেবে যুক্ত হয়ে ঘরে বসে কমিশন আয় করুন! আমার রেফারেল কোড: ${refCode} । জয়েনিং লিংক: ${referralLink}`)}`;

  return (
    <div className="space-y-6">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP PROFILE HERO CARD (Compact, Sleek & Professional)       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          
          {/* Avatar & Reseller Info */}
          <div className="flex items-center gap-3 text-left w-full sm:w-auto flex-1 min-w-0">
            
            {/* 100% Round Avatar with Edit Camera Button */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-[#009245] to-emerald-400 shadow-xs flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white flex items-center justify-center shadow-inner">
                  {employee.avatarUrl ? (
                    <img
                      src={employee.avatarUrl}
                      alt={employee.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-lg sm:text-xl font-black text-[#009245]">
                      {employee.name ? employee.name.charAt(0).toUpperCase() : 'R'}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Camera Button */}
              <button
                type="button"
                onClick={() => {
                  setEditName(employee.name);
                  setEditAvatarUrl(employee.avatarUrl || '');
                  setIsEditModalOpen(true);
                }}
                className="absolute -bottom-0.5 -right-0.5 w-5.5 h-5.5 rounded-full bg-white border border-emerald-300 shadow-xs flex items-center justify-center text-[#009245] hover:bg-emerald-50 transition-all cursor-pointer"
                title={lang === 'bn' ? 'ছবি ও প্রোফাইল পরিবর্তন' : 'Edit Profile'}
              >
                <Camera className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Profile Information: Name, Active date, Phone, Email, Location */}
            <div className="space-y-1 min-w-0 flex-1">
              
              {/* Row 1: Name + Active Badge + Active Since Date */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                  {employee.name}
                </h1>
                
                {/* Active Status Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#eafff3] text-[#009245] border border-[#c6f6dd]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009245] animate-pulse" />
                  <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                </span>

                {/* Account Active Date */}
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  🗓️ {lang === 'bn' ? 'একটিভ:' : 'Active:'}{' '}
                  {new Date(employee.registeredAt).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Row 2: Mobile Number + Email */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1 text-[11px] sm:text-xs">
                  <Phone className="w-3 h-3 text-[#009245]" />
                  <span>{employee.phone}</span>
                </span>

                {employee.email && (
                  <>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="text-slate-600 font-medium flex items-center gap-1 truncate max-w-[190px] sm:max-w-[260px] text-[11px] sm:text-xs" title={employee.email}>
                      <Mail className="w-3 h-3 text-[#009245] shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Row 3: Location (District, Thana) + Referral Code */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {(employee.district || employee.thana) && (
                  <span className="text-slate-600 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                    <MapPin className="w-3 h-3 text-[#009245]" />
                    <span>{employee.thana ? `${employee.thana}, ` : ''}{employee.district}</span>
                  </span>
                )}

                {(employee.district || employee.thana) && <span className="text-slate-300">•</span>}

                {/* Reference Code Badge */}
                <div className="inline-flex items-center gap-1 bg-[#f0faf3] px-2 py-0.5 rounded-md border border-[#c6f6dd] text-[11px] font-bold text-[#009245]">
                  <Hash className="w-2.5 h-2.5 text-[#009245]" />
                  <span>{lang === 'bn' ? 'রেফারেন্স:' : 'Ref:'}</span>
                  <span className="font-mono font-black">{refCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="ml-0.5 text-emerald-600 hover:text-emerald-900 transition-colors cursor-pointer"
                    title={lang === 'bn' ? 'কপি করুন' : 'Copy'}
                  >
                    {copiedRefCode ? <Check className="w-2.5 h-2.5 text-emerald-700" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Action Buttons: Edit Profile & Change Password */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditName(employee.name);
                setEditAvatarUrl(employee.avatarUrl || '');
                setIsEditModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-bold text-[#009245] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer shadow-3xs"
            >
              <Edit2 className="w-3 h-3" />
              <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>{lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* UPLINE REFERRER ACCOUNT CARD (রিসেলারের কার রেফারেন্সে অ্যাকাউন্ট) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
            🔗
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {lang === 'bn' ? 'কার রেফারেন্সে একাউন্ট' : 'Upline Referrer Profile'}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">রেফারারের নাম ও মোবাইল নাম্বার</p>
          </div>
        </div>

        {(() => {
          const isOfficial = employee.isOfficialReferral === true || employee.referralOwnerId === 'OFFICIAL_TAWZOON';
          const uplineName = isOfficial ? 'তাওজুন অফিসিয়াল (Tawzoon Official)' : (employee.referralOwnerName || 'রিসেলার রেফারেল');
          const uplinePhone = isOfficial ? '০১৭৮৭৭৭৫৫১৬' : (employee.referralOwnerPhone || '—');

          return (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              {/* Referrer Name */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-bold shrink-0">রেফারারের নাম:</span>
                <strong className="font-extrabold text-slate-900 truncate text-right">{uplineName}</strong>
              </div>

              {/* Mobile Number */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                <span className="text-slate-600 font-bold shrink-0">মোবাইল নম্বর:</span>
                <strong className="font-mono font-bold text-emerald-800 shrink-0">{uplinePhone}</strong>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ------------------------------------------------------------- */}
      
      {/* 2. REFERRAL PROGRAM DASHBOARD (রেফারেন্স আর্নিং ও নেটওয়ার্ক)    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* Referral Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#009245]" />
              <span>{lang === 'bn' ? 'রেফারেল প্রোগ্রাম ও নেটওয়ার্ক' : 'Referral Network & Bonus'}</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'আপনার রেফারেল কোড বা লিংক শেয়ার করে নতুন রিসেলার যুক্ত করুন'
                : 'Invite new resellers with your referral code or link'}
            </p>
          </div>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>{lang === 'bn' ? 'WhatsApp এ শেয়ার' : 'Share on WhatsApp'}</span>
          </a>
        </div>

        {/* Referral Code & Invitation Link Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Box 1: Reference Code */}
          <div className="bg-[#f0faf3] rounded-xl p-3 border border-[#d8f0e0] space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              {lang === 'bn' ? 'রেফারেল কোড' : 'Referral Code'}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-sm font-mono font-black text-[#009245] tracking-wider text-center select-all">
                {refCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-[#009245] hover:bg-[#007a3a] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                {copiedRefCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRefCode ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Box 2: Invitation Link */}
          <div className="bg-[#f0faf3] rounded-xl p-3 border border-[#d8f0e0] space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              {lang === 'bn' ? 'ইনভাইটেশন লিংক' : 'Invitation Link'}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-mono text-slate-700 truncate select-all">
                {referralLink}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#009245] hover:bg-[#007a3a] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                {copiedRefLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRefLink ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Live Server Referral Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          
          {/* Card 1: Total Referrals */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'bn' ? 'মোট রেফারেল' : 'Total Referred'}
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {referralData?.totalCount || 0}
            </div>
          </div>

          {/* Card 2: Active Resellers */}
          <div className="bg-[#f0faf3] rounded-xl p-3 border border-[#d8f0e0] shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
              {lang === 'bn' ? 'সক্রিয় সদস্য' : 'Active Members'}
            </span>
            <div className="text-lg sm:text-xl font-black text-[#009245] font-mono">
              {referralData?.approvedCount || 0}
            </div>
          </div>

          {/* Card 3: Pending Approvals */}
          <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              {lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-700 font-mono">
              {referralData?.pendingCount || 0}
            </div>
          </div>

          {/* Card 4: Total Referral Bonus */}
          <div className="bg-[#eafff3] rounded-xl p-3 border border-[#c6f6dd] shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide">
              {lang === 'bn' ? 'রেফারেল বোনাস' : 'Referral Bonus'}
            </span>
            <div className="text-lg sm:text-xl font-black text-[#009245] font-mono">
              ৳{(referralData?.bonusEarned || 0).toLocaleString()}
            </div>
          </div>

        </div>

        {/* Referred Members Table / List */}
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold text-slate-800">
            {lang === 'bn' ? 'আপনার মাধ্যমে যুক্ত হওয়া রিসেলার তালিকা' : 'Referred Members List'}
          </h3>

          {loadingReferrals ? (
            <div className="p-6 text-center text-xs text-slate-500">
              {lang === 'bn' ? 'তথ্য লোড হচ্ছে...' : 'Loading referral network...'}
            </div>
          ) : referralData && referralData.referrals.length > 0 ? (
            <>
              {/* Mobile View: Clean, Compact Cards (No horizontal cut-offs) */}
              <div className="block sm:hidden space-y-2">
                {referralData.referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2 hover:border-emerald-300 transition-colors"
                  >
                    {/* Top Row: Avatar + Name + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {ref.avatarUrl ? (
                          <img
                            src={ref.avatarUrl}
                            alt={ref.name}
                            className="w-7 h-7 rounded-full object-cover border border-emerald-300 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#009245] font-black text-[11px] flex items-center justify-center shrink-0">
                            {ref.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {ref.name}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 shrink-0 ${
                          ref.status === 'APPROVED'
                            ? 'bg-[#eafff3] text-[#009245] border border-[#c6f6dd]'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ref.status === 'APPROVED' ? 'bg-[#009245]' : 'bg-amber-500'}`} />
                        <span>{ref.status === 'APPROVED' ? (lang === 'bn' ? 'সক্রিয়' : 'Active') : (lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending')}</span>
                      </span>
                    </div>

                    {/* Bottom Row: Phone, District, Date */}
                    <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 text-[11px]">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'bn' ? 'মোবাইল' : 'Phone'}</span>
                        <span className="font-mono font-bold text-slate-700 text-[11px] truncate">{ref.phone}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'bn' ? 'জেলা' : 'District'}</span>
                        <span className="font-medium text-slate-700 text-[11px] truncate">{ref.district || '—'}</span>
                      </div>
                      <div className="flex flex-col text-right min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'bn' ? 'তারিখ' : 'Date'}</span>
                        <span className="font-mono text-slate-600 text-[10px] truncate">
                          {new Date(ref.registeredAt).toLocaleDateString('bn-BD', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* View Details Action Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedReferral(ref)}
                      className="w-full py-1.5 px-3 bg-emerald-50/70 hover:bg-emerald-100/90 text-[#009245] hover:text-[#007a37] rounded-xl text-xs font-bold border border-emerald-200/90 transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#009245]" />
                      <span>{lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Tablet & Desktop View: Table */}
              <div className="hidden sm:block bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-[#f0faf3] text-slate-700 font-bold border-b border-emerald-100 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">{lang === 'bn' ? 'সদস্যের নাম' : 'Member'}</th>
                        <th className="py-2.5 px-2.5">{lang === 'bn' ? 'মোবাইল' : 'Phone'}</th>
                        <th className="py-2.5 px-2.5">{lang === 'bn' ? 'জেলা' : 'District'}</th>
                        <th className="py-2.5 px-2.5">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th className="py-2.5 px-2.5 text-center">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                        <th className="py-2.5 px-3 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {referralData.referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              {ref.avatarUrl ? (
                                <img src={ref.avatarUrl} alt={ref.name} className="w-6 h-6 rounded-full object-cover border border-emerald-300" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#009245] font-black text-[11px] flex items-center justify-center">
                                  {ref.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-bold text-slate-900">{ref.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-600 text-[11px]">{ref.phone}</td>
                          <td className="py-2.5 px-2.5 text-slate-600 text-[11px]">{ref.district || '—'}</td>
                          <td className="py-2.5 px-2.5 text-slate-500 font-mono text-[10px]">
                            {new Date(ref.registeredAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-2.5 px-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${
                                ref.status === 'APPROVED'
                                ? 'bg-[#eafff3] text-[#009245] border border-[#c6f6dd]'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {ref.status === 'APPROVED' ? (lang === 'bn' ? 'সক্রিয়' : 'Active') : (lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedReferral(ref)}
                              className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#009245] rounded-lg text-xs font-bold border border-slate-200 hover:border-emerald-250 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-3xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{lang === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              {lang === 'bn' ? 'এখনো কোনো রিসেলার যুক্ত হয়নি।' : 'No resellers referred yet.'}
            </div>
          )}
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: EDIT NAME & AVATAR (100% Round Shape & Security)    */}
      {/* ------------------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-3xl border border-emerald-100 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {lang === 'bn' ? 'প্রোফাইল তথ্য পরিবর্তন' : 'Edit Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* 100% Round Avatar Upload */}
              <div className="flex flex-col items-center gap-3 py-2 bg-[#f0faf3] rounded-2xl p-4 border border-[#d8f0e0]">
                <div className="w-22 h-22 rounded-full bg-white border-3 border-[#009245] overflow-hidden shadow-sm flex items-center justify-center relative">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-10 h-10 text-emerald-400" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/85 flex items-center justify-center text-xs font-bold text-[#009245] rounded-full">
                      {lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </div>
                  )}
                </div>

                <label className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploading ? (lang === 'bn' ? 'অপেক্ষা করুন...' : 'Processing...') : (lang === 'bn' ? 'নতুন ছবি বাছুন' : 'Upload Photo')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-[10px] text-slate-500">JPG, PNG বা WEBP (সর্বোচ্চ ৫ MB)</p>
              </div>

              {/* Editable Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} <span className="text-[#009245]">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#009245] bg-[#eafff3] px-2 py-0.2 rounded border border-[#c6f6dd]">
                    {lang === 'bn' ? 'পরিবর্তনযোগ্য' : 'Editable'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                />
              </div>

              {/* Locked Registration Fields */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Lock className="w-3 h-3 text-[#009245]" />
                    <span>{lang === 'bn' ? 'স্থায়ী তথ্য (অপরিবর্তনযোগ্য)' : 'Locked Account Details'}</span>
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                    🔒 {lang === 'bn' ? 'লক করা' : 'Locked'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Phone */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                    </span>
                    <span className="font-mono font-bold text-slate-700 text-[11px] truncate block">
                      {employee.phone}
                    </span>
                  </div>

                  {/* Reference Code */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'bn' ? 'রেফারেন্স কোড' : 'Ref Code'}
                    </span>
                    <span className="font-mono font-bold text-[#009245] text-[11px] truncate block">
                      {refCode}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'bn' ? 'ইমেইল' : 'Email'}
                    </span>
                    <span className="font-medium text-slate-700 text-[11px] truncate block" title={employee.email}>
                      {employee.email || (lang === 'bn' ? 'প্রদান করা হয়নি' : 'N/A')}
                    </span>
                  </div>

                  {/* District & Thana */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'bn' ? 'ঠিকানা' : 'Location'}
                    </span>
                    <span className="font-medium text-slate-700 text-[11px] truncate block">
                      {employee.thana ? `${employee.thana}, ` : ''}{employee.district || (lang === 'bn' ? 'তথ্য নেই' : 'N/A')}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 bg-[#f0faf3] p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                  <span>{lang === 'bn' ? 'নিরাপত্তার কারণে শুধুমাত্র নাম ও প্রোফাইল ছবি এডিট করা যাবে।' : 'Only name and photo can be modified.'}</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: CHANGE PASSWORD                                      */}
      {/* ------------------------------------------------------------- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-3xl border border-emerald-100 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#009245]" />
                <span>{lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'New Password (min 6 chars)'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {passwordLoading ? (lang === 'bn' ? 'পরিবর্তন হচ্ছে...' : 'Updating...') : (lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: REFERRAL DETAILS (Compact, Top-Aligned & Professional) */}
      {/* ------------------------------------------------------------- */}
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
                       {selectedReferral.status === 'APPROVED' ? (lang === 'bn' ? 'সক্রিয়' : 'Active') : (lang === 'bn' ? 'পেন্ডিং' : 'Pending')}
                     </span>
                   </div>
                   <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                     <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                     <span>{lang === 'bn' ? 'নিবন্ধন:' : 'Joined:'} {new Date(selectedReferral.registeredAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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

            {/* Modal Body */}
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
                    <span className="font-mono font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                      ৳{employee.referralCommissionRate || 10} টাকা প্রতি ১০০ টাকায় (১০০ টাকাতে ৳{employee.referralCommissionRate || 10} প্রফিট)
                    </span>
                  </div>
               </div>

               {/* 1. Contact & Location Info */}
               <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80">
                     <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                       <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                       <span>{lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}</span>
                     </div>
                     <p className="text-xs font-bold text-slate-900 font-mono truncate">{selectedReferral.phone}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80">
                     <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                       <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                       <span>{lang === 'bn' ? 'অবস্থান / ঠিকানা' : 'Location'}</span>
                     </div>
                     <p className="text-xs font-bold text-slate-800 truncate">
                       {selectedReferral.thana ? `${selectedReferral.thana}, ` : ''}{selectedReferral.district || (lang === 'bn' ? 'অনুল্লেখিত' : 'N/A')}
                     </p>
                  </div>
               </div>

               {/* 2. Order & Sales Performance */}
               <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'bn' ? 'অর্ডার ও বিক্রয় পারফরম্যান্স' : 'Order & Sales Performance'}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                     <div className="p-2 bg-blue-50/70 rounded-xl border border-blue-100/90 text-center">
                        <span className="text-[9px] font-bold text-blue-600 block mb-0.5">{lang === 'bn' ? 'মোট অর্ডার' : 'Total Orders'}</span>
                        <p className="text-xs sm:text-sm font-black text-blue-800">{selectedReferral.orderCount || 0}টি</p>
                     </div>
                     <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-100/90 text-center">
                        <span className="text-[9px] font-bold text-emerald-600 block mb-0.5">{lang === 'bn' ? 'ডেলিভারড' : 'Delivered'}</span>
                        <p className="text-xs sm:text-sm font-black text-emerald-800">{selectedReferral.deliveredOrders || 0}টি</p>
                     </div>
                     <div className="p-2 bg-rose-50/70 rounded-xl border border-rose-100/90 text-center">
                        <span className="text-[9px] font-bold text-rose-600 block mb-0.5">{lang === 'bn' ? 'বাতিল' : 'Cancelled'}</span>
                        <p className="text-xs sm:text-sm font-black text-rose-800">{selectedReferral.cancelledOrders || 0}টি</p>
                     </div>
                  </div>

                  {/* Total Sales Banner */}
                  <div className="p-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-between shadow-2xs">
                     <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
                       <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                       <span>{lang === 'bn' ? 'মোট বিক্রয় (Sales Value)' : 'Total Sales'}</span>
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
                    <span>{lang === 'bn' ? 'কমিশন ও আয় বিবরণী' : 'Earnings Breakdown'}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-3xs">
                       <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{lang === 'bn' ? 'অর্জিত কমিশন' : 'Earned Bonus'}</span>
                       <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">৳{(selectedReferral.referralCommission || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-150 rounded-xl">
                       <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">{lang === 'bn' ? 'পরিশোধিত আয়' : 'Paid Bonus'}</span>
                       <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono">৳{(selectedReferral.paidCommission || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-amber-50/50 border border-amber-150 rounded-xl">
                       <span className="text-[10px] font-bold text-amber-700 block mb-0.5">{lang === 'bn' ? 'পেন্ডিং কমিশন' : 'Pending Bonus'}</span>
                       <span className="text-xs sm:text-sm font-black text-amber-800 font-mono">৳{(selectedReferral.pendingCommission || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between">
                       <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{lang === 'bn' ? 'রেফারেল স্ট্যাটাস' : 'Status'}</span>
                       <span className={`inline-flex items-center gap-1 text-[10px] font-black w-fit px-2 py-0.5 rounded-full border ${
                         selectedReferral.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                       }`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${selectedReferral.status === 'APPROVED' ? 'bg-[#009245]' : 'bg-amber-500'}`} />
                         {selectedReferral.status === 'APPROVED' ? (lang === 'bn' ? 'ভেরিফাইড' : 'Verified') : (lang === 'bn' ? 'অপেক্ষমান' : 'Pending')}
                       </span>
                    </div>
                  </div>
               </div>

            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
               <span className="text-[10px] text-slate-400 font-medium">
                 {lang === 'bn' ? 'রিসেলার রেফারেন্স নেটওয়ার্ক' : 'Reseller Reference Network'}
               </span>
               <button 
                 type="button"
                 onClick={() => setSelectedReferral(null)}
                 className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-3xs transition cursor-pointer"
               >
                 {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
