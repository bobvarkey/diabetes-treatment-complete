export interface AppInfo {
  platform: 'ios' | 'android';
  appVersion: string;
  bundleId: string;
}

export interface Capabilities {
  push: boolean;
  purchases: boolean;
  haptics: boolean;
}

export interface AppbuildReady {
  appInfo: AppInfo;
  capabilities: Capabilities;
}

declare global {
  interface Window {
    AppbuildWrapper?: {
      ready: Promise<AppbuildReady>;
      plugin: (name: string) => any;
    };
  }
}

export const getWrapper = async () => {
  if (typeof window === 'undefined' || !window.AppbuildWrapper) {
    return null;
  }
  return window.AppbuildWrapper;
};

export const getPlugin = async (name: string) => {
  const wrapper = await getWrapper();
  if (!wrapper) return null;
  return wrapper.plugin(name);
};
