import { getPlugin } from './wrapper';

export interface RcPackage {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'WEEKLY' | 'SIX_MONTH' | 'THREE_MONTH';
  product: {
    identifier: string;
    title: string;
    priceString: string;
    subscriptionPeriod: string;
  };
}

export interface RcEntitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  latestPurchaseDate: string;
  productIdentifier: string;
}

export const configurePurchases = async (apiKey: string, appUserID?: string) => {
  const plugin = await getPlugin('Purchases');
  if (!plugin) return null;
  return plugin.configure({ apiKey, appUserID });
};

export const getOfferings = async () => {
  const plugin = await getPlugin('Purchases');
  if (!plugin) return null;
  const res = await plugin.getOfferings();
  return res.offerings;
};

export const purchasePackage = async (aPackage: RcPackage) => {
  const plugin = await getPlugin('Purchases');
  if (!plugin) return null;
  return plugin.purchasePackage({ aPackage });
};

export const getCustomerInfo = async () => {
  const plugin = await getPlugin('Purchases');
  if (!plugin) return null;
  return plugin.getCustomerInfo();
};
