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

## App Store Submission & Distribution

### Individual Commands
```bash
# Validate app
$ xcrun altool --validate-app -f file -t platform -u username [-p password] [--output-format xml]

# Upload app
$ xcrun altool --upload-app -f file -t platform -u username [-p password] [--output-format xml]

# Notarize app
$ xcrun altool --notarize-app -f file --primary-bundle-id bundle_id -u username -p password
```

### Distribution Checklist
To distribute your app, follow this ordered checklist:

1.  **Validate**: Verify the build meets App Store requirements.
    ```bash
    xcrun altool --validate-app -f <PATH_TO_IPA> -t ios -u <APPLE_ID> -p <APP_SPECIFIC_PASSWORD>
    ```
2.  **Upload**: Submit the build to App Store Connect.
    ```bash
    xcrun altool --upload-app -f <PATH_TO_IPA> -t ios -u <APPLE_ID> -p <APP_SPECIFIC_PASSWORD>
    ```
3.  **Wait for Processing**: Wait for Apple to process the build (check App Store Connect or email).
4.  **Notarize**: (Primarily for macOS/Independent distribution) Submit for notarization.
    ```bash
    xcrun altool --notarize-app -f <PATH_TO_APP> --primary-bundle-id <BUNDLE_ID> -u <APPLE_ID> -p <APP_SPECIFIC_PASSWORD>
    ```
5.  **Staple**: Attach the notarization ticket to the app.
    ```bash
    xcrun stapler staple <PATH_TO_APP>
    ```

## Fastlane Release Configuration

To run the release lane:
```bash
fastlane release
```

```ruby
lane :release do
  build_app(scheme: "MyApp",
            workspace: "Example.xcworkspace",
            include_bitcode: true)
end
```
