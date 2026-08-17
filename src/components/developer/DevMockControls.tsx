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

  useEffect(() => {
    // Poll for mock status
    const checkMock = () => {
      const wrapper = (window as any).AppbuildWrapper;
      if (wrapper) {
        setIsReady(true);
        // Load current state from mock
        const entitlements = JSON.parse(localStorage.getItem('__appbuild_mock_entitlements__') || '{}');
        setIsPremium(!!entitlements.premium);
      }
    };
    checkMock();
    const timer = setInterval(checkMock, 1000);
    return () => clearInterval(timer);
  }, []);

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

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => window.location.reload()}
      >
        Refresh App
      </Button>
    </div>
  );
}
