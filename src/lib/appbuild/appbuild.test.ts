/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWrapper, getPlugin } from './wrapper';
import { getOfferings, getCustomerInfo, configurePurchases } from './revenuecat';

// Mock window.AppbuildWrapper
const mockReady = {
  appInfo: {
    platform: 'ios',
    appVersion: '1.0.0',
    bundleId: 'com.test.app',
  },
  capabilities: {
    push: true,
    purchases: true,
    haptics: true,
  },
};

const mockPlugin = {
  configure: vi.fn().mockResolvedValue({ success: true }),
  getOfferings: vi.fn().mockResolvedValue({
    offerings: {
      current: {
        identifier: 'default',
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'prod_1',
              title: 'Monthly',
              priceString: '$9.99',
              subscriptionPeriod: 'P1M',
            },
          },
        ],
      },
    },
  }),
  getCustomerInfo: vi.fn().mockResolvedValue({
    customerInfo: {
      entitlements: {
        active: {
          premium: {
            identifier: 'premium',
            isActive: true,
          },
        },
      },
    },
  }),
};

describe('Appbuild Wrapper & RevenueCat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup window mock
    (window as any).AppbuildWrapper = {
      ready: Promise.resolve(mockReady),
      plugin: vi.fn().mockReturnValue(mockPlugin),
    };
  });

  describe('wrapper.ts', () => {
    it('should return the wrapper instance', async () => {
      const wrapper = await getWrapper();
      expect(wrapper).toBeDefined();
      expect(wrapper?.ready).toBeDefined();
    });

    it('should return a plugin by name', async () => {
      const plugin = await getPlugin('Purchases');
      expect(plugin).toBeDefined();
      expect((window as any).AppbuildWrapper.plugin).toHaveBeenCalledWith('Purchases');
    });

    it('should return null if window.AppbuildWrapper is missing', async () => {
      const original = (window as any).AppbuildWrapper;
      (window as any).AppbuildWrapper = undefined;
      const wrapper = await getWrapper();
      expect(wrapper).toBeNull();
      (window as any).AppbuildWrapper = original;
    });
  });

  describe('revenuecat.ts', () => {
    it('should configure purchases', async () => {
      await configurePurchases('test_key', 'user_123');
      expect(mockPlugin.configure).toHaveBeenCalledWith({
        apiKey: 'test_key',
        appUserID: 'user_123',
      });
    });

    it('should fetch and map offerings', async () => {
      const offerings = await getOfferings();
      expect(offerings).toBeDefined();
      expect(offerings.current.identifier).toBe('default');
      expect(offerings.current.availablePackages[0].identifier).toBe('$rc_monthly');
    });

    it('should fetch customer info', async () => {
      const info = await getCustomerInfo();
      expect(info?.customerInfo.entitlements.active.premium.isActive).toBe(true);
    });
  });
});
