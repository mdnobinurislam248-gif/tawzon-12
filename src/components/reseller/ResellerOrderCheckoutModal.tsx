import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  Package,
  ArrowRight,
  ShieldCheck,
  Search,
  Truck,
  Plus,
  ChevronDown,
  Check,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { bdDistrictsAndThanas, isSearchTextMatch } from '../../data/bdLocations.js';

export interface CheckoutOrderItem {
  id: string;
  nameBn: string;
  productCode: string;
  imageUrl?: string;
  size?: string;
  quantity: number;
  sellingPrice: number;
  profit: number;
  originalProductId: string;
}

interface ResellerOrderCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CheckoutOrderItem[];
  onOrderSuccess: (orderedItemIds: string[]) => void;
}

export const ResellerOrderCheckoutModal: React.FC<ResellerOrderCheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
}) => {
  const { lang, employee, employeeToken, showToast, brandSettings, setResellerTab } = useApp();

  // Active items in this checkout session
  const [activeItems, setActiveItems] = useState<CheckoutOrderItem[]>(items);
  const [confirmedOrderData, setConfirmedOrderData] = useState<any | null>(null);

  // Sync active items when props change (only if not currently showing memo)
  React.useEffect(() => {
    if (!confirmedOrderData && items && items.length > 0) {
      setActiveItems(items);
    }
  }, [items, confirmedOrderData]);

  // Step 1: Terms State
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isStep2Open, setIsStep2Open] = useState(false);
  // Step 2: Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Courier Check State
  const [isCourierChecking, setIsCourierChecking] = useState(false);
  const [courierReport, setCourierReport] = useState<{
    delivered: number;
    returned: number;
    totalOrders: number;
    successRate: number;
  } | null>(null);
  const [isReportBadgeAttached, setIsReportBadgeAttached] = useState(false);

  // Location Combobox States
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা');
  const [districtQuery, setDistrictSearchQuery] = useState('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  const [selectedThana, setSelectedThana] = useState('ধানমন্ডি');
  const [thanaQuery, setThanaSearchQuery] = useState('');
  const [isThanaDropdownOpen, setIsThanaDropdownOpen] = useState(false);

  const [specificAddress, setSpecificAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Delivery Fee Advance Toggle: null = unselected, 'no' = ৳120 COD, 'yes' = ৳0
  const [isDeliveryPaidAdvance, setIsDeliveryPaidAdvance] = useState<'yes' | 'no' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resellerPageName, setResellerPageName] = useState(() => localStorage.getItem('reseller_page_name') || '');
  const [isMemoGenerated, setIsMemoGenerated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;
  if (!confirmedOrderData && activeItems.length === 0) return null;

  // Filter Districts & Thanas
  const allDistricts = Object.keys(bdDistrictsAndThanas);
  const matchingDistricts = allDistricts.filter(dist =>
    isSearchTextMatch(dist, districtQuery)
  );

  const availableThanas = bdDistrictsAndThanas[selectedDistrict] || ['সদর'];
  const matchingThanas = availableThanas.filter(thana =>
    isSearchTextMatch(thana, thanaQuery)
  );

  // Financial Calculations
  const productsTotalAmount = activeItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const deliveryFee = isDeliveryPaidAdvance === 'yes' ? 0 : isDeliveryPaidAdvance === 'no' ? 120 : null;
  const grandTotalAmount = productsTotalAmount + (deliveryFee ?? 0);
  const totalProfit = activeItems.reduce((sum, item) => sum + item.profit * item.quantity, 0);

  // Courier Report Check
  const handleCheckCourierReport = async () => {
    if (!customerPhone || customerPhone.trim().length < 11) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে কাস্টমারের সচল ১১ ডিজিট নম্বর লিখুন' : 'Enter 11-digit phone number', 'error');
      return;
    }

    setIsCourierChecking(true);
    try {
      const res = await fetch(`/api/common/customer-history?phone=${encodeURIComponent(customerPhone.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const delivered = data.deliveredOrders || 0;
        const returned = data.rejectedOrders || 0;
        const total = delivered + returned;
        const successRate = total > 0 ? Math.round((delivered / total) * 100) : 100;
        setCourierReport({
          delivered,
          returned,
          totalOrders: data.totalOrders || 0,
          successRate,
        });
        showToast(lang === 'bn' ? 'ডেলিভারি হিস্ট্রি রিপোর্ট প্রস্তুত!' : 'Report ready!', 'success');
      } else {
        setCourierReport({
          delivered: 0,
          returned: 0,
          totalOrders: 0,
          successRate: 100,
        });
        showToast(lang === 'bn' ? 'নতুন কাস্টমার (০টি রেকর্ড)' : 'New customer (0 records)', 'success');
      }
    } catch {
      setCourierReport({
        delivered: 0,
        returned: 0,
        totalOrders: 0,
        successRate: 100,
      });
      showToast(lang === 'bn' ? 'নতুন কাস্টমার (০টি রেকর্ড)' : 'New customer (0 records)', 'success');
    } finally {
      setIsCourierChecking(false);
    }
  };

  // Submit Order
  const handleFinalOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItems.length === 0) {
      showToast(lang === 'bn' ? 'কোনো পণ্য সিলেক্ট করা নেই' : 'No items selected', 'error');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !specificAddress.trim()) {
      showToast(lang === 'bn' ? 'কাস্টমারের নাম, ফোন নম্বর ও হোম ডেলিভারি ঠিকানা পূরণ করুন' : 'Fill all required fields', 'error');
      return;
    }

    if (isDeliveryPaidAdvance === null) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে ডেলিভারি চার্জ অগ্রিম নেওয়া হয়েছে কিনা সিলেক্ট করুন' : 'Select delivery charge advance status', 'error');
      return;
    }

    if (!employeeToken) {
      showToast(lang === 'bn' ? 'সেশন মেয়াদোত্তীর্ণ, অনুগ্রহ করে লগইন করুন' : 'Please login again', 'error');
      return;
    }

    const fullAddress = `জেলা: ${selectedDistrict}, থানা: ${selectedThana}, ঠিকানা: ${specificAddress.trim()}`;
    const reportNote = isReportBadgeAttached && courierReport
      ? ` [রিপোর্ট: ডেলিভারি ${courierReport.delivered}টি, রিটার্ন ${courierReport.returned}টি, ${courierReport.successRate}%]`
      : '';
    const deliveryNote = isDeliveryPaidAdvance === 'yes' ? ' [ডেলিভারি চার্জ অগ্রিম পেইড]' : ' [ডেলিভারি চার্জ ক্যাশ অন ৳১২০]';

    setIsSubmitting(true);
    const sharedOrderCode = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    try {
      for (const item of activeItems) {
        const sizeNote = item.size ? ` [সাইজ: ${item.size}]` : '';
        const cleanProdId = item.originalProductId
          ? item.originalProductId.split('_')[0]
          : item.id.split('_')[0];
        await api.employeeRecordSale(employeeToken, {
          productId: cleanProdId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: fullAddress,
          quantity: item.quantity,
          actualSalePrice: item.sellingPrice,
          orderCode: sharedOrderCode,
          size: item.size,
          notes: `${specialNotes}${sizeNote}${deliveryNote}${reportNote}`.trim(),
        });
      }

      const orderRecord = {
        orderId: sharedOrderCode,
        date: new Date().toLocaleString('bn-BD'),
        brandName: brandSettings?.appName || employee?.name || 'Tawzoon Nexus',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        fullAddress,
        items: [...activeItems],
        productsTotalAmount,
        deliveryFee: deliveryFee ?? 0,
        grandTotalAmount,
        totalProfit,
      };

      showToast(
        lang === 'bn'
          ? `🎉 সফলভাবে ${activeItems.length}টি পণ্যের অর্ডার কনফার্ম হয়েছে!`
          : `🎉 Order confirmed for ${activeItems.length} items!`,
        'success'
      );

      setConfirmedOrderData(orderRecord);
      onOrderSuccess(activeItems.map(i => i.id));
      setIsStep2Open(false);
      setIsTermsAgreed(false);
    } catch (err: any) {
      showToast(err.message || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

    return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* CUSTOMER DELIVERY INFORMATION FORM (STEP 1 REMOVED PERMANENTLY) */}
      {/* ------------------------------------------------------------- */}
      {!confirmedOrderData && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm md:max-w-3xl lg:max-w-4xl rounded-3xl border border-emerald-100 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#009245] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm md:text-base font-black">কাস্টমারের ডেলিভারি তথ্য</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleFinalOrderSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              
              {/* 1. Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-black text-slate-800 block">
                  কাস্টমারের নাম <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 text-sm md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                  placeholder="যেমন: আরিফ হাসান"
                />
              </div>

              {/* 2. Customer Mobile Number + Delivery Report Check */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs md:text-sm font-black text-slate-800 block">
                    কাস্টমারের ফোন নম্বর <span className="text-[#009245]">*</span>
                  </label>
                  {isReportBadgeAttached && courierReport && (
                    <span className="text-[10px] md:text-xs font-black text-[#009245] bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-emerald-200">
                      ✅ {courierReport.successRate}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setCourierReport(null);
                      setIsReportBadgeAttached(false);
                    }}
                    className="flex-1 px-4 py-2.5 md:py-3 text-sm md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                    placeholder="01XXXXXXXXX"
                  />
                  <button
                    type="button"
                    onClick={handleCheckCourierReport}
                    disabled={isCourierChecking}
                    className="px-4 py-2.5 md:py-3 text-sm font-black text-white bg-linear-to-r from-[#009245] to-[#007a38] hover:from-[#007a38] hover:to-[#005e2b] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
                  >
                    {isCourierChecking ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <Search className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{isCourierChecking ? 'যাচাই হচ্ছে...' : 'রিপোর্ট চেক'}</span>
                  </button>
                </div>

                {/* Delivery History Report Card (Strict 1-Line Header + Only % + 2 Options: সর্বমোট ডেলিভারি ও সর্বমোট রিটার্ন) */}
                {courierReport && (
                  <div className="p-3 rounded-2xl bg-[#f0faf3] border border-emerald-200 space-y-2 animate-in fade-in duration-150">
                    <div className="w-full flex items-center justify-between text-[11px] font-black text-slate-900 whitespace-nowrap border-b border-emerald-200/80 pb-1.5">
                      <span className="flex items-center gap-1.5 shrink-0">
                        <Truck className="w-3.5 h-3.5 text-[#009245]" />
                        <span>কাস্টমার ডেলিভারি রিপোর্ট</span>
                      </span>
                      <span className="text-[#009245] font-mono font-black shrink-0 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                        {courierReport.successRate}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-bold">
                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 flex items-center justify-between shadow-3xs">
                        <span className="text-slate-700">সর্বমোট ডেলিভারি নিয়েছেঃ</span>
                        <span className="text-emerald-700 font-mono font-black text-xs sm:text-sm">
                          {courierReport.delivered}টি অর্ডার।
                        </span>
                      </div>

                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 flex items-center justify-between shadow-3xs">
                        <span className="text-slate-700">সর্বমোট রিটার্ন করেছেঃ</span>
                        <span className="text-rose-600 font-mono font-black text-xs sm:text-sm">
                          {courierReport.returned}টি অর্ডার।
                        </span>
                      </div>
                    </div>

                    {!isReportBadgeAttached ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsReportBadgeAttached(true);
                          showToast(lang === 'bn' ? 'রিপোর্ট নাম্বারের সাথে যুক্ত করা হয়েছে✓' : 'Report attached');
                        }}
                        className="w-full py-2 text-[11px] font-black text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>অর্ডারে রিপোর্ট যুক্ত করুন</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-black text-[#009245] block text-center py-0.5 bg-emerald-50 rounded-lg border border-emerald-200/70">
                        ✓ রিপোর্ট অর্ডারে যুক্ত করা হয়েছে
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 3. District Smart Single-Input Combobox */}
              <div className="space-y-1.5 relative">
                <label className="text-xs md:text-sm font-black text-slate-800 flex items-center justify-between">
                  <span>জেলা নির্বাচন করুন <span className="text-[#009245]">*</span></span>
                  <span className="text-xs font-bold text-[#009245]">📍 জেলা: {selectedDistrict}</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={isDistrictDropdownOpen ? districtQuery : `📍 জেলা: ${selectedDistrict}`}
                    onFocus={() => {
                      setIsDistrictDropdownOpen(true);
                      setDistrictSearchQuery('');
                    }}
                    onChange={(e) => {
                      setDistrictSearchQuery(e.target.value);
                      setIsDistrictDropdownOpen(true);
                    }}
                    placeholder="টাইপ করুন..."
                    className="w-full px-4 py-2.5 md:py-3 pr-8 text-sm md:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                  />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />

                  {isDistrictDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {matchingDistricts.length > 0 ? (
                        matchingDistricts.map((dist) => (
                          <button
                            key={dist}
                            type="button"
                            onClick={() => {
                              setSelectedDistrict(dist);
                              setIsDistrictDropdownOpen(false);
                              setDistrictSearchQuery('');
                              const thanas = bdDistrictsAndThanas[dist] || ['সদর'];
                              setSelectedThana(thanas[0] || 'সদর');
                            }}
                            className={`w-full px-3 py-2 text-left text-xs md:text-sm font-bold transition-colors flex items-center justify-between cursor-pointer ${
                              selectedDistrict === dist
                                ? 'bg-emerald-50 text-[#009245]'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <span>📍 জেলা: {dist}</span>
                            {selectedDistrict === dist && <Check className="w-3.5 h-3.5 text-[#009245]" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-xs md:text-sm text-slate-500 text-center font-medium">
                          কোনো জেলা পাওয়া যায়নি!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Thana Smart Single-Input Combobox */}
              <div className="space-y-1.5 relative">
                <label className="text-xs md:text-sm font-black text-slate-800 flex items-center justify-between">
                  <span>থানা / উপজেলা নির্বাচন করুন <span className="text-[#009245]">*</span></span>
                  <span className="text-xs font-bold text-[#009245]">🏢 থানা: {selectedThana}</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={isThanaDropdownOpen ? thanaQuery : `🏢 থানা: ${selectedThana}`}
                    onFocus={() => {
                      setIsThanaDropdownOpen(true);
                      setThanaSearchQuery('');
                    }}
                    onChange={(e) => {
                      setThanaSearchQuery(e.target.value);
                      setIsThanaDropdownOpen(true);
                    }}
                    placeholder="টাইপ করুন..."
                    className="w-full px-4 py-2.5 md:py-3 pr-8 text-sm md:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                  />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />

                  {isThanaDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {matchingThanas.length > 0 ? (
                        matchingThanas.map((thana) => (
                          <button
                            key={thana}
                            type="button"
                            onClick={() => {
                              setSelectedThana(thana);
                              setIsThanaDropdownOpen(false);
                              setThanaSearchQuery('');
                            }}
                            className={`w-full px-3 py-2 text-left text-xs md:text-sm font-bold transition-colors flex items-center justify-between cursor-pointer ${
                              selectedThana === thana
                                ? 'bg-emerald-50 text-[#009245]'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <span>🏢 থানা: {thana}</span>
                            {selectedThana === thana && <Check className="w-3.5 h-3.5 text-[#009245]" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-xs md:text-sm text-slate-500 text-center font-medium">
                          কোনো থানা পাওয়া যায়নি!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Specific Home Delivery Address */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-black text-slate-800 block whitespace-nowrap">
                  হোম ডেলিভারি ঠিকানা <span className="text-[#009245]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={specificAddress}
                  onChange={(e) => setSpecificAddress(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 text-sm md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900 resize-none"
                  placeholder="যেমন: রোড, বাসা নম্বর, গ্রাম/এলাকা..."
                />
              </div>

              {/* 6. Special Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-black text-slate-800 block">
                  বিশেষ নির্দেশনা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 text-sm md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-medium text-slate-900"
                  placeholder="যেমন: ডেলিভারি ম্যানকে ফোন দিতে বলবেন..."
                />
              </div>

              {/* 7. Ordered Items Preview Cards List */}
              <div className="space-y-2.5 pt-2.5 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs md:text-sm font-black text-slate-800 bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                  <span className="text-slate-700">অর্ডারকৃত পণ্যসমূহ ({activeItems.length}টি):</span>
                  <span className="text-[11px] md:text-xs text-[#009245]">ছবি ও সাইজ চেক করুন</span>
                </div>

                <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative p-3.5 rounded-2xl bg-[#f0faf3] border border-emerald-200/90 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={item.imageUrl || '/images/product_shop_dress_1790244714775.jpg'}
                            alt={item.nameBn}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0 shadow-3xs"
                          />

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="text-sm md:text-[15px] font-black text-slate-900 truncate max-w-[220px]">
                                {item.nameBn}
                              </h4>
                              <span className="font-mono text-[11px] md:text-xs font-bold text-[#009245] bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200/50">
                                #{item.productCode}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] md:text-xs font-bold text-slate-600 flex-wrap">
                              {item.size && (
                                <span className="bg-[#009245] text-white text-[10px] md:text-[11px] font-black px-2 py-0.5 rounded-md font-mono">
                                  সাইজ: {item.size}
                                </span>
                              )}
                              <span className="bg-slate-200/90 text-slate-800 text-[10px] md:text-[11px] font-black px-2 py-0.5 rounded-md font-mono">
                                পরিমাণ: {item.quantity} পিস
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (activeItems.length === 1) {
                              setIsStep2Open(false);
                              onClose();
                            } else {
                              setActiveItems(prev => prev.filter(i => i.id !== item.id));
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 shadow-3xs"
                          title="সরান"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Financials Row */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-emerald-200/60 text-sm md:text-sm font-bold text-slate-900">
                        <span className="text-slate-800">
                          বিক্রি: <span className="font-black text-rose-600 font-mono">৳{(item.sellingPrice * item.quantity).toLocaleString()}</span>
                        </span>
                        <span className="font-black text-[#009245] font-mono">
                          প্রফিট: +৳{(item.profit * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 8. Delivery Charge Advance Payment Option */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center space-y-3">
                <div className="text-xs md:text-sm font-black text-amber-950 text-center">
                  <span>ডেলিভারি চার্জ (৳১২০) অগ্রিম নিয়েছেন?</span>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs md:text-sm font-black pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsDeliveryPaidAdvance('yes')}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border transition-all cursor-pointer min-w-[110px] ${
                      isDeliveryPaidAdvance === 'yes'
                        ? 'bg-[#009245] text-white border-[#009245] shadow-2xs scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isDeliveryPaidAdvance === 'yes' ? 'bg-white text-[#009245]' : 'border border-slate-300'
                    }`}>
                      {isDeliveryPaidAdvance === 'yes' ? '✓' : ''}
                    </span>
                    <span>হ্যাঁ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeliveryPaidAdvance('no')}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border transition-all cursor-pointer min-w-[110px] ${
                      isDeliveryPaidAdvance === 'no'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isDeliveryPaidAdvance === 'no' ? 'bg-white text-rose-600' : 'border border-slate-300'
                    }`}>
                      {isDeliveryPaidAdvance === 'no' ? '✓' : ''}
                    </span>
                    <span>না</span>
                  </button>
                </div>
              </div>

              {/* 9. Final Sleek 1-Line Order Summary Row */}
              <div className="p-3.5 rounded-2xl bg-[#f0faf3] border border-emerald-200 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 shadow-3xs divide-x divide-emerald-200/80">
                <div className="px-1 text-center flex-1">
                  <span className="text-[10px] md:text-[11px] text-slate-500 block font-medium whitespace-nowrap">আইটেম</span>
                  <span className="text-slate-900 font-black font-mono text-sm md:text-sm whitespace-nowrap">{activeItems.length}টি</span>
                </div>

                <div className="px-1 text-center flex-1">
                  <span className="text-[10px] md:text-[11px] text-slate-500 block font-medium whitespace-nowrap">ডেলিভারি</span>
                  <span className="text-amber-800 font-mono font-black text-sm md:text-sm whitespace-nowrap">
                    {deliveryFee !== null ? `৳${deliveryFee}` : '--'}
                  </span>
                </div>

                <div className="px-1 text-center flex-1">
                  <span className="text-[10px] md:text-[11px] text-slate-500 block font-medium whitespace-nowrap">মোট বিল</span>
                  <span className="text-rose-600 font-mono font-black text-sm md:text-base whitespace-nowrap">
                    {deliveryFee !== null ? `৳${grandTotalAmount.toLocaleString()}` : '--'}
                  </span>
                </div>

                <div className="px-1 text-center flex-1">
                  <span className="text-[10px] md:text-[11px] text-emerald-800 block font-medium whitespace-nowrap">প্রফিট</span>
                  <span className="text-[#009245] font-mono font-black text-sm md:text-base whitespace-nowrap">+৳{totalProfit.toLocaleString()}</span>
                </div>
              </div>

              {/* 10. Submit Order Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isDeliveryPaidAdvance === null}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>অর্ডার প্রক্রিয়াজাত হচ্ছে...</span>
                  ) : isDeliveryPaidAdvance === null ? (
                    <span>⚠️ ডেলিভারি চার্জ অগ্রিম নিয়েছেন কিনা সিলেক্ট করুন</span>
                  ) : (
                    <span>কনফার্ম অর্ডার করুন 🚀 (৳{grandTotalAmount.toLocaleString()})</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
      {/* Order Memo Preview Modal */}
      {confirmedOrderData && (
        <div className="fixed inset-0 z-[100050] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
            
            {/* Header */}
            <div className="p-4 bg-[#009245] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm font-black">
                  {!isMemoGenerated ? 'মেমো ইনফরমেশন দিন' : 'কাস্টমার ক্যাশ মেমো'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrderData(null);
                  setIsMemoGenerated(false);
                  setResellerTab('orders');
                  onClose();
                }}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50 text-xs text-slate-800 font-medium">
              
              {!isMemoGenerated ? (
                /* Step A: Input Page/Brand Name */
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#009245] flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">আপনার নিজস্ব ক্যাশ মেমো তৈরি করুন</h3>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                      মেমোতে আপনার ফেসবুক পেইজ বা প্রতিষ্ঠানের নাম বসবে। এতে আপনার পাইকারি মূল্য, প্রফিট বা কোনো গোপন তথ্য কাস্টমার দেখতে পাবে না।
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      আপনার পেইজ / প্রতিষ্ঠানের নাম দিন <span className="text-[#009245]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={resellerPageName}
                      onChange={(e) => {
                        setResellerPageName(e.target.value);
                        localStorage.setItem('reseller_page_name', e.target.value);
                      }}
                      placeholder="যেমন: আরিয়ান কালেকশন / My Online Shop"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!resellerPageName.trim()}
                    onClick={() => setIsMemoGenerated(true)}
                    className="w-full py-3 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>মেমো তৈরি করুন 📄</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedOrderData(null);
                      setIsMemoGenerated(false);
                      setResellerTab('orders');
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    স্কিপ করুন
                  </button>
                </div>
              ) : (
                /* Step B: Beautiful Generated Memo with html2canvas target wrapper */
                <div className="space-y-3">
                  
                  {/* Container that html2canvas will convert into image */}
                  <div id="memo-canvas" className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-slate-800">
                    
                    {/* Header */}
                    <div className="text-center pb-3 border-b-2 border-dashed border-slate-200 space-y-1">
                      <h2 className="text-lg font-black text-emerald-700 tracking-tight leading-tight uppercase">
                        {resellerPageName}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-black tracking-wider uppercase">ক্যাশ মেমো ও ডেলিভারি ইনভয়েস</p>
                    </div>

                    {/* Memo Meta details */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold font-mono">
                      <span>মেমো নং: <strong className="text-slate-850 font-black">{confirmedOrderData.orderId}</strong></span>
                      <span>তারিখ: <strong className="text-slate-850">{confirmedOrderData.date}</strong></span>
                    </div>

                    {/* Customer Info Card */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">কাস্টমারের নাম:</span>
                        <span className="font-black text-slate-900">{confirmedOrderData.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">মোবাইল নম্বর:</span>
                        <span className="font-black text-slate-900 font-mono">{confirmedOrderData.customerPhone}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-bold text-slate-500 shrink-0">ডেলিভারি ঠিকানা:</span>
                        <span className="font-bold text-slate-900 text-right leading-tight">{confirmedOrderData.fullAddress}</span>
                      </div>
                    </div>

                    {/* Product List Table */}
                    <div className="space-y-1.5">
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                              <th className="p-2.5">পণ্য বিবরণী</th>
                              <th className="p-2.5 text-center">পরিমাণ</th>
                              <th className="p-2.5 text-right">মূল্য</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                            {confirmedOrderData.items.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-2.5 leading-snug">
                                  <span className="font-black text-slate-900 block truncate max-w-[150px]">{item.nameBn}</span>
                                  {item.size && (
                                    <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-black mt-0.5 inline-block">
                                      সাইজ: {item.size}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center font-mono font-black">{item.quantity} পিস</td>
                                <td className="p-2.5 text-right font-mono font-black text-slate-900">৳{(item.sellingPrice * item.quantity).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Price calculations without profit/agent commission */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">পণ্যের মূল্য:</span>
                        <span className="font-black text-slate-900 font-mono">৳{confirmedOrderData.productsTotalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">ডেলিভারি চার্জ:</span>
                        <span className="font-black text-slate-900 font-mono">৳{confirmedOrderData.deliveryFee}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200 text-sm font-black text-emerald-700">
                        <span>সর্বমোট দেয় বিল (COD):</span>
                        <span className="font-mono text-base">৳{confirmedOrderData.grandTotalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Thank you note */}
                    <p className="text-[9.5px] text-center text-slate-400 font-black tracking-wider uppercase pt-1">
                      * আমাদের থেকে কেনাকাটা করার জন্য ধন্যবাদ *
                    </p>

                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={async () => {
                        setIsDownloading(true);
                        try {
                          const itemsCount = confirmedOrderData.items.length;
                          const canvasWidth = 600;
                          const canvasHeight = 720 + (itemsCount * 55);

                          const scale = 3; // Ultra HD (Retina 3x scale)
                          const canvas = document.createElement('canvas');
                          canvas.width = canvasWidth * scale;
                          canvas.height = canvasHeight * scale;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) throw new Error('Could not get 2d context');

                          // Apply Retina scaling factor
                          ctx.scale(scale, scale);

                          // Enable high-quality image smoothing
                          ctx.imageSmoothingEnabled = true;
                          ctx.imageSmoothingQuality = 'high';

                          // 1. White Background
                          ctx.fillStyle = '#FFFFFF';
                          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                          // 2. Premium Top Bar with Gold Sub-Line
                          ctx.fillStyle = '#15803d'; // Rich forest green
                          ctx.fillRect(0, 0, canvasWidth, 14);
                          ctx.fillStyle = '#d97706'; // Golden yellow accent line
                          ctx.fillRect(0, 14, canvasWidth, 3);

                          // 3. Draw Outer Border with subtle double frame
                          ctx.strokeStyle = '#cbd5e1';
                          ctx.lineWidth = 2;
                          ctx.strokeRect(8, 25, canvasWidth - 16, canvasHeight - 33);
                          ctx.strokeStyle = '#e2e8f0';
                          ctx.lineWidth = 1;
                          ctx.strokeRect(12, 29, canvasWidth - 24, canvasHeight - 41);

                          // 4. Subtle security seal watermark in background
                          ctx.save();
                          ctx.translate(canvasWidth / 2, canvasHeight / 2);
                          ctx.rotate(-Math.PI / 8); // rotate 22.5 degrees
                          ctx.strokeStyle = 'rgba(21, 128, 61, 0.05)';
                          ctx.lineWidth = 3;
                          ctx.beginPath();
                          ctx.arc(0, 0, 85, 0, Math.PI * 2);
                          ctx.stroke();
                          ctx.fillStyle = 'rgba(21, 128, 61, 0.05)';
                          ctx.textAlign = 'center';
                          ctx.font = 'bold 16px "Arial", sans-serif';
                          ctx.fillText('ORIGINAL MEMO', 0, -10);
                          ctx.fillText('★ VERIFIED ★', 0, 15);
                          ctx.restore();

                          // 5. Header: Page Name (Huge, Bold, Elegant)
                          ctx.fillStyle = '#15803d';
                          ctx.textAlign = 'center';
                          ctx.font = 'bold 30px "Arial", sans-serif';
                          ctx.fillText(resellerPageName.toUpperCase(), canvasWidth / 2, 68);

                          // Subtitle
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 12px "Arial", sans-serif';
                          ctx.fillText('ক্যাশ মেমো ও ডেলিভারি ইনভয়েস', canvasWidth / 2, 90);

                          // Styled Divider Line
                          ctx.strokeStyle = '#cbd5e1';
                          ctx.lineWidth = 1.5;
                          ctx.setLineDash([5, 3]);
                          ctx.beginPath();
                          ctx.moveTo(35, 108);
                          ctx.lineTo(canvasWidth - 35, 108);
                          ctx.stroke();
                          ctx.setLineDash([]); // Reset dash

                          // 6. Memo Meta Details (Left & Right aligned)
                          ctx.textAlign = 'left';
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 12px "Arial", sans-serif';
                          ctx.fillText(`মেমো নং: `, 35, 138);
                          ctx.fillStyle = '#0f172a';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.fillText(confirmedOrderData.orderId, 95, 138);

                          ctx.textAlign = 'right';
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 12px "Arial", sans-serif';
                          ctx.fillText(`তারিখ: `, canvasWidth - 190, 138);
                          ctx.fillStyle = '#0f172a';
                          ctx.font = 'bold 12px "Arial", sans-serif';
                          ctx.fillText(confirmedOrderData.date, canvasWidth - 35, 138);

                          // 7. Customer Info Box (With green left-highlight vertical bar)
                          const boxY = 160;
                          const boxHeight = 115;
                          const boxWidth = canvasWidth - 70;

                          // Rounded Background
                          ctx.fillStyle = '#f8fafc';
                          ctx.strokeStyle = '#cbd5e1';
                          ctx.lineWidth = 1;
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(35, boxY, boxWidth, boxHeight, 14);
                          } else {
                            ctx.rect(35, boxY, boxWidth, boxHeight);
                          }
                          ctx.fill();
                          ctx.stroke();

                          // Draw highlight bar on the left of customer card
                          ctx.fillStyle = '#15803d';
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(35, boxY, 6, boxHeight, [14, 0, 0, 14]);
                          } else {
                            ctx.fillRect(35, boxY, 6, boxHeight);
                          }
                          ctx.fill();

                          // Customer details labels and values
                          ctx.textAlign = 'left';
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.fillText('কাস্টমারের নাম:', 55, boxY + 32);
                          ctx.fillText('মোবাইল নম্বর:', 55, boxY + 62);
                          ctx.fillText('ডেলিভারি ঠিকানা:', 55, boxY + 92);

                          ctx.fillStyle = '#0f172a';
                          ctx.font = 'bold 14px "Arial", sans-serif';
                          ctx.fillText(confirmedOrderData.customerName, 175, boxY + 32);
                          ctx.font = 'bold 14px "Arial", sans-serif';
                          ctx.fillText(confirmedOrderData.customerPhone, 175, boxY + 62);
                          
                          // Wrap and draw address
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          const addressText = confirmedOrderData.fullAddress;
                          const maxAddressWidth = canvasWidth - 230;
                          ctx.fillText(addressText, 175, boxY + 92, maxAddressWidth);

                          // 8. Product List Table Header
                          let currentY = boxY + boxHeight + 35;
                          ctx.fillStyle = '#15803d';
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(35, currentY, boxWidth, 38, [10, 10, 0, 0]);
                          } else {
                            ctx.fillRect(35, currentY, boxWidth, 38);
                          }
                          ctx.fill();

                          ctx.fillStyle = '#ffffff';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.textAlign = 'left';
                          ctx.fillText('পণ্য বিবরণী', 50, currentY + 24);
                          ctx.textAlign = 'center';
                          ctx.fillText('পরিমাণ', canvasWidth / 2 + 50, currentY + 24);
                          ctx.textAlign = 'right';
                          ctx.fillText('মূল্য', canvasWidth - 50, currentY + 24);

                          // Items Rows with alternate background styling
                          currentY += 38;
                          confirmedOrderData.items.forEach((item: any, idx: number) => {
                            // Alternate shading
                            ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                            ctx.fillRect(35, currentY, boxWidth, 50);

                            ctx.strokeStyle = '#e2e8f0';
                            ctx.lineWidth = 1;
                            ctx.strokeRect(35, currentY, boxWidth, 50);

                            ctx.textAlign = 'left';
                            ctx.fillStyle = '#0f172a';
                            ctx.font = 'bold 13px "Arial", sans-serif';
                            ctx.fillText(item.nameBn, 50, currentY + 20, 260);

                            ctx.fillStyle = '#64748b';
                            ctx.font = 'bold 10.5px "Arial", sans-serif';
                            const sizeText = item.size ? ` [সাইজ: ${item.size}]` : '';
                            ctx.fillText(`#${item.productCode}${sizeText}`, 50, currentY + 38);

                            ctx.textAlign = 'center';
                            ctx.fillStyle = '#0f172a';
                            ctx.font = 'bold 13px "Arial", sans-serif';
                            ctx.fillText(`${item.quantity} পিস`, canvasWidth / 2 + 50, currentY + 29);

                            ctx.textAlign = 'right';
                            ctx.font = 'bold 13px "Arial", sans-serif';
                            ctx.fillText(`৳${(item.sellingPrice * item.quantity).toLocaleString()}`, canvasWidth - 50, currentY + 29);

                            currentY += 50;
                          });

                          // 9. Totals summary Card
                          currentY += 20;
                          ctx.fillStyle = '#f8fafc';
                          ctx.strokeStyle = '#cbd5e1';
                          ctx.lineWidth = 1;
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(35, currentY, boxWidth, 115, 12);
                          } else {
                            ctx.rect(35, currentY, boxWidth, 115);
                          }
                          ctx.fill();
                          ctx.stroke();

                          ctx.textAlign = 'left';
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.fillText('পণ্যের মূল্য:', 55, currentY + 30);
                          ctx.fillText('ডেলিভারি চার্জ:', 55, currentY + 60);
                          
                          ctx.fillStyle = '#15803d';
                          ctx.font = 'bold 14px "Arial", sans-serif';
                          ctx.fillText('সর্বমোট দেয় বিল (COD):', 55, currentY + 92);

                          ctx.textAlign = 'right';
                          ctx.fillStyle = '#0f172a';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.fillText(`৳${confirmedOrderData.productsTotalAmount.toLocaleString()}`, canvasWidth - 55, currentY + 30);
                          ctx.fillText(`৳${confirmedOrderData.deliveryFee}`, canvasWidth - 55, currentY + 60);
                          
                          ctx.fillStyle = '#15803d';
                          ctx.font = 'bold 17px "Arial", sans-serif';
                          ctx.fillText(`৳${confirmedOrderData.grandTotalAmount.toLocaleString()}`, canvasWidth - 55, currentY + 92);

                          // 10. Official Signature Block section (Premium)
                          currentY += 165;
                          ctx.strokeStyle = '#94a3b8';
                          ctx.lineWidth = 1;
                          ctx.setLineDash([4, 3]);

                          // Left side: Customer sign line
                          ctx.beginPath();
                          ctx.moveTo(35, currentY - 50);
                          ctx.lineTo(155, currentY - 50);
                          ctx.stroke();

                          // Right side: Authorized sign line
                          ctx.beginPath();
                          ctx.moveTo(canvasWidth - 155, currentY - 50);
                          ctx.lineTo(canvasWidth - 35, currentY - 50);
                          ctx.stroke();

                          ctx.setLineDash([]); // Reset line dash

                          ctx.fillStyle = '#64748b';
                          ctx.font = 'bold 11px "Arial", sans-serif';
                          ctx.textAlign = 'center';
                          ctx.fillText('ক্রেতার স্বাক্ষর', 95, currentY - 32);
                          ctx.fillText('অনুমোদিত স্বাক্ষর', canvasWidth - 95, currentY - 32);

                          // 11. Custom Thank you note footer
                          ctx.textAlign = 'center';
                          ctx.fillStyle = '#64748b';
                          ctx.font = 'bold 11px "Arial", sans-serif';
                          ctx.fillText('* আমাদের থেকে কেনাকাটা করার জন্য ধন্যবাদ *', canvasWidth / 2, currentY);

                          // Trigger HD download trigger
                          const imgData = canvas.toDataURL('image/png');
                          const link = document.createElement('a');
                          link.download = `MEMO_${resellerPageName.replace(/\s+/g, '_')}_${confirmedOrderData.orderId}.png`;
                          link.href = imgData;
                          link.click();
                          showToast(lang === 'bn' ? 'মেমো ইমেজ সফলভাবে ডাউনলোড হয়েছে!' : 'Memo downloaded!', 'success');
                        } catch (err: any) {
                          console.error('Canvas download error:', err);
                          showToast(lang === 'bn' ? `ডাউনলোড সমস্যা: ${err?.message || err}` : 'Download failed', 'error');
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{isDownloading ? 'মেমো তৈরি হচ্ছে...' : 'মেমো ডাউনলোড করুন 📥'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMemoGenerated(false)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
                      >
                        এডিট করুন ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmedOrderData(null);
                          setIsMemoGenerated(false);
                          setResellerTab('orders');
                          onClose();
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#009245] font-black text-xs transition-colors cursor-pointer text-center"
                      >
                        ঠিক আছে ✅
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </>
  );
};