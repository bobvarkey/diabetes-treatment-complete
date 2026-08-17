import { createFileRoute } from '@tanstack/react-router';
import { DevMockControls } from '@/components/developer/DevMockControls';
import { SectionCard } from '@/components/diabetes/shared';
import { ShieldAlert, Code2 } from 'lucide-react';

export const Route = createFileRoute('/dev')({
  component: DevPage,
});

function DevPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SectionCard icon={<ShieldAlert className="w-5 h-5" />} title="Access Denied" tone="danger">
          <p className="text-center py-8">Developer tools are only available in development mode.</p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-primary/10">
          <Code2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Developer Tools</h1>
          <p className="text-sm text-muted-foreground">Internal debugging and mock bridge controls</p>
        </div>
      </div>

      <DevMockControls />
      
      <SectionCard title="System Diagnostics" icon={<Code2 className="w-5 h-5" />}>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-mono bg-muted px-2 py-0.5 rounded">{process.env.NODE_ENV}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">User Agent</span>
            <span className="truncate max-w-[300px] text-right">{typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
