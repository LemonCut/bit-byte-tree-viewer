
import { TreeViewLogo } from '@/components/icons';

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="relative flex items-center justify-center w-32 h-32">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
        <TreeViewLogo className="w-16 h-16 text-primary" />
      </div>
      <p className="mt-6 text-lg font-semibold tracking-wider animate-pulse">
        Loading Trees...
      </p>
    </div>
  );
}
