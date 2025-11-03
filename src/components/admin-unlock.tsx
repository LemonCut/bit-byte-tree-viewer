
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Unlock } from 'lucide-react';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { verifyAdminPassword } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Verifying...' : 'Unlock'}
    </Button>
  );
}

export function AdminUnlock({ onUnlock }: { onUnlock: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [state, formAction] = useActionState(verifyAdminPassword, {
    success: false,
    message: '',
  });

  useEffect(() => {
    if (state.success) {
      onUnlock();
      setOpen(false);
      toast({
        title: 'Success!',
        description: state.message,
      });
    } else if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, onUnlock, toast]);

  return (
    <>
      <div className="group fixed bottom-20 left-4 h-12 w-12 z-50">
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="icon"
          className="
            absolute left-0 h-12 w-12 rounded-full
            -translate-x-16 group-hover:translate-x-0 transition-transform duration-300 ease-in-out
            shadow-lg
          "
        >
          <Unlock className="h-6 w-6" />
          <span className="sr-only">Unlock Admin View</span>
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
            <DialogDescription>
              Enter the password to unlock admin mode.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password-input" className="text-right">
                  Password
                </Label>
                <Input
                  id="password-input"
                  name="password"
                  type="password"
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
