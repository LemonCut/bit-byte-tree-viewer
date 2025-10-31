'use client';

import { Unlock } from 'lucide-react';
import { Button } from './ui/button';

export function AdminUnlock({ onUnlock }: { onUnlock: () => void }) {
  
  return (
    <>
      <div className="group fixed bottom-4 right-4 h-12 w-12 z-50">
        <Button
          onClick={onUnlock}
          variant="outline"
          size="icon"
          className="
            absolute right-0 h-12 w-12 rounded-full
            translate-x-16 group-hover:translate-x-0 transition-transform duration-300 ease-in-out
            shadow-lg
          "
        >
          <Unlock className="h-6 w-6" />
          <span className="sr-only">Unlock Admin View</span>
        </Button>
      </div>
    </>
  );
}
