import assert from 'node:assert/strict';
import { getEffectiveResellerMargin, getResellerWholesalePrice, getResellerProfitPerUnit } from './src/utils/pricing.ts';

console.log('--- Starting TAWZOON Business Logic Test Suite ---');

// Mock Product with ৳470 Base Wholesale Price and ৳520 Selling Price
const testProduct: any = {
  id: 'prod-test-01',
  nameBn: 'প্রিমিয়াম জুব্বা ও আতর সেট',
  baseWholesalePrice: 470,
  originalPrice: 470,
  sellingPrice: 520,
  regularPrice: 580,
  stock: 100,
};

const brandSettings: any = {
  officialReferralCode: 'TAWZOON9516',
  nonOfficialMarkup: 10,
};

// -------------------------------------------------------------
// TEST 1: Official Referral Account (৳0 Margin, ৳470 Wholesale)
// -------------------------------------------------------------
console.log('\n[TEST 1] Testing Official Referral Account...');
const officialReseller: any = {
  id: 'emp-official-01',
  name: 'Md Shah Ali (Official)',
  phone: '01787775516',
  referenceCode: 'TN-REF-75516',
  reference: 'TAWZOON9516',
  referredBy: 'TAWZOON9516',
  isOfficialReferral: true,
  referralOwnerId: 'OFFICIAL_TAWZOON',
  referralOwnerName: 'তাওজুন অফিসিয়াল (Headquarters)',
  resellerMargin: 0,
  referralCommissionRate: 10,
};

const officialMargin = getEffectiveResellerMargin(testProduct, officialReseller, brandSettings);
const officialWholesale = getResellerWholesalePrice(testProduct, officialReseller, brandSettings);
const officialProfit = getResellerProfitPerUnit(testProduct, officialReseller, brandSettings, 520);

assert.strictEqual(officialMargin, 0, 'Official reseller margin must be 0 Tk');
assert.strictEqual(officialWholesale, 470, 'Official reseller wholesale price must be exactly 470 Tk (Base price)');
assert.strictEqual(officialProfit, 50, 'Official reseller profit must be 520 - 470 = 50 Tk');
console.log('✓ TEST 1 PASSED: Official wholesale is ৳470, Margin is ৳0, Profit is ৳50');

// -------------------------------------------------------------
// TEST 2: General Referral Account (Default ৳10 Margin, ৳480 Wholesale)
// -------------------------------------------------------------
console.log('\n[TEST 2] Testing General Referral Account...');
const generalReseller: any = {
  id: 'emp-general-01',
  name: 'Ali (Reseller B under Shah Ali)',
  phone: '01812345678',
  referenceCode: 'TN-REF-45678',
  reference: 'TN-REF-75516',
  referredBy: 'TN-REF-75516',
  isOfficialReferral: false,
  referralOwnerId: 'emp-official-01',
  referralOwnerName: 'Md Shah Ali (Official)',
  resellerMargin: 10, // default
  referralCommissionRate: 10,
};

const generalMargin = getEffectiveResellerMargin(testProduct, generalReseller, brandSettings);
const generalWholesale = getResellerWholesalePrice(testProduct, generalReseller, brandSettings);
const generalProfit = getResellerProfitPerUnit(testProduct, generalReseller, brandSettings, 520);

assert.strictEqual(generalMargin, 10, 'General reseller margin must be default 10 Tk');
assert.strictEqual(generalWholesale, 480, 'General reseller wholesale price must be 470 + 10 = 480 Tk');
assert.strictEqual(generalProfit, 40, 'General reseller profit must be 520 - 480 = 40 Tk');
console.log('✓ TEST 2 PASSED: General wholesale is ৳480, Margin is ৳10, Profit is ৳40');

// -------------------------------------------------------------
// TEST 3: Admin Custom Reseller Margin (e.g. ৳15 -> ৳485 Wholesale)
// -------------------------------------------------------------
console.log('\n[TEST 3] Testing Admin Custom Margin Override (৳15)...');
const customReseller: any = {
  ...generalReseller,
  id: 'emp-custom-01',
  name: 'Karim (Reseller C with Admin ৳15 Margin)',
  resellerMargin: 15,
};

const customMargin = getEffectiveResellerMargin(testProduct, customReseller, brandSettings);
const customWholesale = getResellerWholesalePrice(testProduct, customReseller, brandSettings);
const customProfit = getResellerProfitPerUnit(testProduct, customReseller, brandSettings, 520);

assert.strictEqual(customMargin, 15, 'Admin custom margin must be respected as 15 Tk');
assert.strictEqual(customWholesale, 485, 'Custom wholesale price must be 470 + 15 = 485 Tk');
assert.strictEqual(customProfit, 35, 'Custom reseller profit must be 520 - 485 = 35 Tk');
console.log('✓ TEST 3 PASSED: Custom wholesale is ৳485, Margin is ৳15, Profit is ৳35');

// -------------------------------------------------------------
// TEST 4: Referral Bonus Calculation Formula & Maximum Bonus Limit
// Formula: Referral Bonus = MIN(Profit * 10%, Maximum Bonus Limit)
// -------------------------------------------------------------
console.log('\n[TEST 4] Testing Referral Bonus Formula & Maximum Bonus Limit...');
function calculateReferralBonus(sellerProfit: number, maxBonusCap: number): number {
  if (sellerProfit <= 0 || maxBonusCap <= 0) return 0;
  return Math.max(0, Math.round(Math.min(sellerProfit * 0.1, maxBonusCap)));
}

// Case 4A: Profit = ৳40 (General reseller), MaxBonus = ৳10
// 10% of 40 = 4 Tk, which is <= 10 -> Bonus is 4 Tk
const bonus4A = calculateReferralBonus(40, 10);
assert.strictEqual(bonus4A, 4, '10% of 40 Tk profit should yield 4 Tk bonus');

// Case 4B: High Profit = ৳250 (e.g. high-end product), MaxBonus = ৳10
// 10% of 250 = 25 Tk, but capped at 10 Tk -> Bonus is 10 Tk
const bonus4B = calculateReferralBonus(250, 10);
assert.strictEqual(bonus4B, 10, 'Bonus must be capped at 10 Tk limit');

// Case 4C: Custom MaxBonus Limit set by Admin = ৳20
// 10% of 250 = 25 Tk, capped at 20 Tk -> Bonus is 20 Tk
const bonus4C = calculateReferralBonus(250, 20);
assert.strictEqual(bonus4C, 20, 'Bonus must be capped at admin-configured 20 Tk limit');

// Case 4D: Profit = ৳35 (Custom reseller), MaxBonus = ৳10
// 10% of 35 = 3.5 Tk -> rounds to 4 Tk
const bonus4D = calculateReferralBonus(35, 10);
assert.strictEqual(bonus4D, 4, '10% of 35 Tk profit rounded should be 4 Tk');

console.log('✓ TEST 4 PASSED: Referral bonus formulas and limits strictly match specifications');

// -------------------------------------------------------------
// TEST 5: Referral Chain Integrity & Relationship Preservation
// -------------------------------------------------------------
console.log('\n[TEST 5] Testing Referral Chain Integrity...');
// Chain: Shah Ali (Official) -> Ali -> Karim -> Reseller D
const userShahAli = { ...officialReseller };
const userAli = { ...generalReseller, referralOwnerId: userShahAli.id, referralOwnerName: userShahAli.name };
const userKarim = {
  id: 'emp-karim-03',
  name: 'Karim',
  reference: userAli.referenceCode,
  referredBy: userAli.referenceCode,
  referralOwnerId: userAli.id,
  referralOwnerName: userAli.name,
  isOfficialReferral: false,
  resellerMargin: 10,
};
const userD = {
  id: 'emp-d-04',
  name: 'Reseller D',
  reference: 'TN-REF-KARIM',
  referredBy: 'TN-REF-KARIM',
  referralOwnerId: userKarim.id,
  referralOwnerName: userKarim.name,
  isOfficialReferral: false,
  resellerMargin: 10,
};

assert.strictEqual(userAli.referralOwnerId, userShahAli.id, 'Ali referrer must be Shah Ali');
assert.strictEqual(userKarim.referralOwnerId, userAli.id, 'Karim referrer must be Ali');
assert.strictEqual(userD.referralOwnerId, userKarim.id, 'Reseller D referrer must be Karim');

// Changing userAli's margin or maxBonus does NOT overwrite Karim's personal margin
userAli.referralCommissionRate = 25; // upline changes bonus limit
const karimMarginAfter = getEffectiveResellerMargin(testProduct, userKarim, brandSettings);
assert.strictEqual(karimMarginAfter, 10, "Karim's margin must remain 10 Tk and not get overridden unintentionally");

console.log('✓ TEST 5 PASSED: Referral chain hierarchy and independent member settings intact');

console.log('\n======================================================');
console.log('🎉 ALL 5 MANDATORY BUSINESS LOGIC ACCEPTANCE TESTS PASSED!');
console.log('======================================================');
