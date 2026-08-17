/**
* appbuild-wrapper-sdk.mock.js
* -----------------------------------------------------------------------
* RECONSTRUCTED DEV-MOCK — NOT THE REAL APPBUILD.DIY SCRIPT.
*
* This is not extracted, decompiled, or copied from the live
* https://appbuild.diy/snippets/appbuild-wrapper-sdk.js file — that file
* was never accessible to fetch or inspect. This is an original,
* from-scratch reimplementation of the *shape* of window.AppbuildWrapper,
* built only from:
*
* 1. The consumer code already in this repo (src/lib/appbuild/*.ts),
* which tells us exactly which methods/fields the real object
* must expose: `.ready` (a Promise resolving to {appInfo, capabilities})
* and `.plugin(name)` (returns a native plugin handle, e.g. 'Purchases').
* 2. AppBuild.diy's own public marketing copy, which states that
* (a) the wrapper is a native shell pointed at your web app's URL,
* (b) it replaces Stripe with native StoreKit/Play Billing sheets
* via a RevenueCat integration under the hood, and
* (c) subscription/entitlement state is "injected back" into the
* web app through the same bridge used for push.
*
* Purpose: let you develop and test wrapper.ts / revenuecat.ts / the
* Paywall / usePremiumEntitlement hook in a plain browser — where
* window.AppbuildWrapper is normally just undefined — by dropping this
* script in *before* your app bundle during local dev only.
*
* DO NOT ship this in a production build. It fakes purchases, storage,
* and push locally; it proves nothing about App Store / Play billing
* compliance.
* -----------------------------------------------------------------------
*/
(function (window) {
'use strict';

// ---------------------------------------------------------------------
// Config — tweak these to simulate different environments.
// ---------------------------------------------------------------------
const MOCK_CONFIG = {
platform: 'ios', // 'ios' | 'android'
readyDelayMs: 150, // simulate native boot latency
startPremium: false, // does the mock user already own 'premium'?
logPrefix: '[AppbuildMock]',
};

function log(...args) {
console.log(MOCK_CONFIG.logPrefix, ...args);
}

// ---------------------------------------------------------------------
// In-memory "entitlement store" — stands in for what the real wrapper
// would sync from RevenueCat's servers after a StoreKit/Play Billing
// purchase. Persisted to localStorage only so a page refresh doesn't
// lose your test state; the real native wrapper does not use
// localStorage for this (per Docs/iOS-Architecture.md offline notes,
// localStorage there is reserved for UI state like active tab).
// ---------------------------------------------------------------------
const STORAGE_KEY = '__appbuild_mock_entitlements__';

function loadEntitlements() {
try {
return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
} catch {
return {};
}
}

function saveEntitlements(map) {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
} catch {
/* ignore quota errors in mock */
}
}

if (MOCK_CONFIG.startPremium) {
const existing = loadEntitlements();
if (!existing.premium) {
existing.premium = {
identifier: 'premium',
isActive: true,
willRenew: true,
productIdentifier: 'com.psycognito.clinical.premium.monthly',
latestPurchaseDate: new Date().toISOString(),
};
saveEntitlements(existing);
}
}

// ---------------------------------------------------------------------
// Mock offerings catalog — shape matches RcPackage's `raw` expectations
// (product.title, product.priceString, packageType, etc.) so
// src/lib/appbuild/revenuecat.ts's getOfferings() mapping works
// unmodified against this mock.
// ---------------------------------------------------------------------
const MOCK_OFFERINGS = {
current: {
identifier: 'default',
availablePackages: [
{
identifier: '$rc_monthly',
packageType: 'MONTHLY',
product: {
identifier: 'com.psycognito.clinical.premium.monthly',
title: 'Cognito Premium (Monthly)',
priceString: '$9.99',
subscriptionPeriod: 'P1M',
},
},
{
identifier: '$rc_annual',
packageType: 'ANNUAL',
product: {
identifier: 'com.psycognito.clinical.premium.annual',
title: 'Cognito Premium (Annual)',
priceString: '$79.99',
subscriptionPeriod: 'P1Y',
},
},
],
},
};

// ---------------------------------------------------------------------
// Mock 'Purchases' plugin — mirrors the Capacitor RevenueCat plugin
// surface that src/lib/appbuild/revenuecat.ts already calls:
// configure, getOfferings, purchasePackage, restorePurchases,
// getCustomerInfo.
// ---------------------------------------------------------------------
function createPurchasesPlugin() {
let configuredApiKey = null;
let appUserID = null;

return {
async configure({ apiKey, appUserID: uid } = {}) {
configuredApiKey = apiKey ?? null;
appUserID = uid ?? 'mock-anonymous-user';
log('Purchases.configure', { apiKey: configuredApiKey, appUserID });
return { success: true };
},

async getOfferings() {
log('Purchases.getOfferings ->', MOCK_OFFERINGS);
return { offerings: MOCK_OFFERINGS };
},

async purchasePackage({ aPackage } = {}) {
log('Purchases.purchasePackage', aPackage?.identifier);
// Simulate the native StoreKit / Play Billing sheet + webhook round trip.
await new Promise((r) => setTimeout(r, 400));

const entitlements = loadEntitlements();
entitlements.premium = {
identifier: 'premium',
isActive: true,
willRenew: true,
productIdentifier: aPackage?.product?.identifier ?? 'unknown-product',
latestPurchaseDate: new Date().toISOString(),
};
saveEntitlements(entitlements);

return {
customerInfo: { entitlements: { active: entitlements } },
};
},

async restorePurchases() {
log('Purchases.restorePurchases');
const entitlements = loadEntitlements();
return {
customerInfo: { entitlements: { active: entitlements } },
};
},

async getCustomerInfo() {
const entitlements = loadEntitlements();
return {
customerInfo: { entitlements: { active: entitlements } },
};
},

/** Mock-only helper, not part of the real plugin surface: lets test
* code revoke the mock subscription without clearing all storage. */
__mockExpirePremium() {
const entitlements = loadEntitlements();
delete entitlements.premium;
saveEntitlements(entitlements);
log('Purchases.__mockExpirePremium: premium entitlement cleared');
},
};
}

// ---------------------------------------------------------------------
// Mock 'Push' plugin — stands in for AppBuild's native push registration.
// Not currently consumed by this repo's TS (no push.ts exists yet), but
// included because AppBuild's marketing copy describes push status
// flowing through "the same bridge" as entitlements.
// ---------------------------------------------------------------------
function createPushPlugin() {
const listeners = new Map();
return {
async register() {
const token = 'mock-push-token-' + Math.random().toString(36).slice(2);
log('Push.register ->', token);
return { token };
},
addListener(eventName, cb) {
listeners.set(eventName, cb);
return { remove: () => listeners.delete(eventName) };
},
/** Mock-only: fire a fake push to test in-app handling. */
__mockReceive(eventName, payload) {
listeners.get(eventName)?.(payload);
},
};
}

// ---------------------------------------------------------------------
// Plugin registry — mirrors `wrapper.plugin(name)` from the repo's
// wrapper.ts / the generic getPlugin(name) reconstruction.
// ---------------------------------------------------------------------
const PLUGINS = {
Purchases: createPurchasesPlugin(),
Push: createPushPlugin(),
};

// ---------------------------------------------------------------------
// The global object itself.
// ---------------------------------------------------------------------
const readyPromise = new Promise((resolve) => {
setTimeout(() => {
resolve({
appInfo: {
platform: MOCK_CONFIG.platform,
appVersion: '2.0.0-mock',
bundleId: 'com.psycognito.clinical',
},
capabilities: {
push: true,
purchases: true,
haptics: false, // matches Docs/iOS-Architecture.md: haptics = "(Future)"
},
});
log('ready', { platform: MOCK_CONFIG.platform });
}, MOCK_CONFIG.readyDelayMs);
});

window.AppbuildWrapper = {
ready: readyPromise,
plugin(name) {
const p = PLUGINS[name];
if (!p) {
log(`plugin('${name}') requested but not mocked`);
return null;
}
return p;
},
};

log('mock installed — window.AppbuildWrapper is now defined');
})(window);
