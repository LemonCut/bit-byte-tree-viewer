'use client';

import { useState } from 'react';
import { Unlock, KeyRound } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

export function AdminUnlock({ onUnlock }: { onUnlock: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handlePasswordSubmit = () => {
    // Note: This is not a secure way to handle passwords in a real application.
    // This is for demonstration purposes only.
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      toast({
        title: 'Success!',
        description: 'Admin view unlocked.',
      });
      onUnlock();
      setDialogOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Incorrect password.',
      });
    }
    setPassword('');
  };

  return (
    <>
      <div className="group fixed bottom-4 right-4 h-12 w-12 z-50">
        <Button
          onClick={() => setDialogOpen(true)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
            <DialogDescription>
              Enter the password to unlock administrative features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
                <Input
                    id="password"
                    type="password"
                    placeholder="Password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
             <Button type="button" onClick={handlePasswordSubmit}>
                <KeyRound className="mr-2" />
                Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
