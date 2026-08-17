# Appbuild Mock Bridge Developer Guide

This project includes a mock bridge for the native `AppbuildWrapper` and `RevenueCat` plugins, allowing you to develop and test premium features directly in the browser.

## Enabling the Mock Bridge

The mock bridge is automatically injected in **Development Mode** via `src/routes/__root.tsx`.

- **Development**: The script `/mock/appbuild-wrapper-sdk.mock.js` is loaded, providing a global `window.AppbuildWrapper` that simulates the native environment.
- **Production**: The mock script is NOT loaded, and the app expects a real native bridge.

## Real-time Testing with Dev Tools

A dedicated **Dev Tools** page is available in the sidebar (under the "Developer" group).

1.  **Premium Toggle**: Instantly switch between "Free" and "Premium" states to test UI gating.
2.  **Platform Simulation**: Switch between iOS and Android modes to verify platform-specific logic.
3.  **Purchase Simulation**: Clicking "Purchase Premium" triggers the mock purchase flow, which persists to `localStorage`.

## Manual State Management

The mock bridge persists entitlement state in `localStorage`.

-   **Reset Entitlements**: Run `localStorage.removeItem('__appbuild_mock_entitlements__')` in the console and refresh.
-   **Expire Premium**: Use the Dev Tools UI or call `window.AppbuildWrapper.plugin("RevenueCat").__mockExpirePremium()` from the console.

## Purchase & Restore Flows

-   **Testing Purchases**: Call `purchasePackage(pack)` from `src/lib/appbuild/revenuecat.ts`. In mock mode, this immediately grants the `premium` entitlement.
-   **Testing Restores**: Call `restorePurchases()`. The mock bridge simulates a successful restore if any previous purchases exist in its internal mock store.
-   **Unit Testing**: Run `bunx vitest src/lib/appbuild/appbuild.test.ts` to verify the bridge logic programmatically.
