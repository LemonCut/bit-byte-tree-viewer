
'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export function HelpDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <HelpCircle className="h-6 w-6" />
          <span className="sr-only">Help</span>
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              For any bugs, inaccuracies, or suggestions, please DM lemoncut on Discord.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
