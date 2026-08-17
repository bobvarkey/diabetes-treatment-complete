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

## Manual State Management & Reset

The mock bridge persists entitlement state in `localStorage`.

1. **Reset Entitlements Button**: Use the red button in the Dev Tools UI to wipe all mock state and return to a default "Free" state.
2. **Manual Console**: You can also run `localStorage.removeItem('__appbuild_mock_entitlements__')` manually.

## Testing Purchase & Restore Flows

### Automated Tests
Run the Playwright E2E suite to verify persistence and bridge logic:
```bash
python3 /tmp/browser/purchase_restore_e2e.py
```

### Manual Verification
1. Go to **Dev Tools** in the sidebar.
2. Click **Reset Entitlements** to start clean.
3. Toggle the **Premium Status** switch. This triggers a mock purchase flow.
4. Click **Refresh App**. The app should "restore" the state from the mock bridge during initialization.
5. Use **Scenario Presets** to quickly test specific states (e.g., Lapsed subscription).

### Unit Testing
Run `bunx vitest src/lib/appbuild/appbuild.test.ts` to verify the bridge logic programmatically.
