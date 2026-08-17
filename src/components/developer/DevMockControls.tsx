import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function DevMockControls() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [isPremium, setIsPremium] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [scenario, setScenario] = useState<string>(() => localStorage.getItem('__appbuild_mock_scenario__') || 'default');

  useEffect(() => {
    // Poll for mock status
    const checkMock = () => {
      const wrapper = (window as any).AppbuildWrapper;
      if (wrapper) {
        setIsReady(true);
        // Load current state from mock
        const entitlements = JSON.parse(localStorage.getItem('__appbuild_mock_entitlements__') || '{}');
        setIsPremium(!!entitlements.premium);
        
        const plugin = wrapper.plugin('Purchases');
        if (plugin) {
          plugin.getOfferings().then((res: any) => setOfferings(res.offerings));
          plugin.getCustomerInfo().then((res: any) => setCustomerInfo(res.customerInfo));
        }

        wrapper.ready.then((info: any) => {
          setPlatform(info.appInfo.platform);
        });
      }
    };
    checkMock();
    const timer = setInterval(checkMock, 1000);
    return () => clearInterval(timer);
  }, []);

  const applyScenario = (id: string) => {
    localStorage.setItem('__appbuild_mock_scenario__', id);
    setScenario(id);
    
    const wrapper = (window as any).AppbuildWrapper;
    if (!wrapper) return;
    
    const plugin = wrapper.plugin('Purchases');
    
    if (id.includes('premium')) {
      // Simulate purchase if not already premium
      plugin.purchasePackage({ 
        aPackage: { 
          identifier: '$rc_monthly',
          product: { identifier: 'com.psycognito.clinical.premium.monthly' }
        } 
      }).then(() => {
        toast.success(`Applied ${id} scenario`);
        const targetPlatform = id.includes('android') ? 'android' : 'ios';
        if (targetPlatform !== platform) {
           toast.info('Platform change requires refresh', { duration: 5000 });
        }
      });
    } else {
      plugin.__mockExpirePremium?.();
      toast.info(`Applied ${id} scenario`);
      const targetPlatform = id.includes('android') ? 'android' : 'ios';
      if (targetPlatform !== platform) {
         toast.info('Platform change requires refresh', { duration: 5000 });
      }
    }
  };

  const togglePremium = () => {
    const wrapper = (window as any).AppbuildWrapper;
    if (!wrapper) return;
    
    const plugin = wrapper.plugin('Purchases');
    if (isPremium) {
      plugin.__mockExpirePremium?.();
      toast.info('Mock subscription revoked');
    } else {
      // Trigger a fake purchase
      plugin.purchasePackage({ 
        aPackage: { 
          identifier: '$rc_monthly',
          product: { identifier: 'com.psycognito.clinical.premium.monthly' }
        } 
      }).then(() => {
        toast.success('Mock purchase successful');
      });
    }
    setIsPremium(!isPremium);
  };

  const resetEntitlements = () => {
    localStorage.removeItem('__appbuild_mock_entitlements__');
    localStorage.removeItem('__appbuild_mock_scenario__');
    setIsPremium(false);
    setScenario('default');
    const wrapper = (window as any).AppbuildWrapper;
    if (wrapper) {
      const plugin = wrapper.plugin('Purchases');
      plugin.__mockExpirePremium?.();
    }
    toast.success('Entitlements reset to default');
  };

  if (!isReady) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Mock Bridge Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The AppbuildWrapper mock is not active. Ensure you are in development mode and the script is loaded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scenario Presets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant={scenario === 'ios_premium' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => applyScenario('ios_premium')}
              data-testid="preset-ios-premium"
            >
              iOS Premium
            </Button>
            <Button 
              variant={scenario === 'android_premium' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => applyScenario('android_premium')}
              data-testid="preset-android-premium"
            >
              Android Premium
            </Button>
            <Button 
              variant={scenario === 'ios_lapsed' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => applyScenario('ios_lapsed')}
              data-testid="preset-ios-lapsed"
            >
              iOS Lapsed
            </Button>
            <Button 
              variant={scenario === 'android_lapsed' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => applyScenario('android_lapsed')}
              data-testid="preset-android-lapsed"
            >
              Android Lapsed
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Presets automatically update entitlements. Platform changes (iOS/Android) require a page refresh.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Native Bridge Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Premium Status</Label>
              <p className="text-sm text-muted-foreground">Toggle active entitlements</p>
            </div>
            <Switch checked={isPremium} onCheckedChange={togglePremium} />
          </div>

          <div className="space-y-2">
            <Label>Simulated Platform</Label>
            <Select 
              value={platform} 
              onValueChange={(v: 'ios' | 'android') => {
                setPlatform(v);
                toast.warning('Platform change requires page refresh to take effect in .ready promise');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ios">iOS (StoreKit)</SelectItem>
                <SelectItem value="android">Android (Play Billing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Mock Bridge Info</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-muted p-2 rounded">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-500">Connected</span>
              <span className="text-muted-foreground">Ready:</span>
              <span>true</span>
              <span className="text-muted-foreground">Storage Key:</span>
              <span className="truncate">__appbuild_mock_entitlements__</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Mappings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Active Entitlements</Label>
            <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-auto max-h-40 border">
              {JSON.stringify(customerInfo?.entitlements?.active || {}, null, 2)}
            </pre>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Available Offerings</Label>
            <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-auto max-h-40 border">
              {JSON.stringify(offerings?.current?.availablePackages || [], null, 2)}
            </pre>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-semibold mb-1">Raw Customer Info Payload</h4>
            <pre className="text-[9px] font-mono bg-black/5 p-2 rounded overflow-auto max-h-32 border text-muted-foreground">
              {JSON.stringify(customerInfo, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 w-full">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Refresh App
        </Button>
        <Button 
          variant="destructive"
          onClick={resetEntitlements}
          data-testid="reset-entitlements"
        >
          Reset Entitlements
        </Button>
      </div>
    </div>
  );
}