
'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
}

export const NumberInput = React.forwardRef<
  HTMLInputElement,
  NumberInputProps
>(({ className, value, onValueChange, min, max, step = 1, ...props }, ref) => {
  const minValue = typeof min === 'string' ? parseFloat(min) : min;
  const maxValue = typeof max === 'string' ? parseFloat(max) : max;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? '' : Number(e.target.value);
    if (newValue === '') {
        onValueChange(minValue ?? 0);
    } else if (!isNaN(newValue)) {
        let boundedValue = newValue;
        if (minValue !== undefined) {
            boundedValue = Math.max(minValue, boundedValue);
        }
        if (maxValue !== undefined) {
            boundedValue = Math.min(maxValue, boundedValue);
        }
        onValueChange(boundedValue);
    }
  };

  const handleStep = (direction: 'increment' | 'decrement') => {
    let newValue = value + (direction === 'increment' ? Number(step) : -Number(step));
     if (minValue !== undefined) {
        newValue = Math.max(minValue, newValue);
    }
    if (maxValue !== undefined) {
        newValue = Math.min(maxValue, newValue);
    }
    onValueChange(newValue);
  };
  
  const handleBlur = () => {
    if (value < (minValue ?? -Infinity)) {
        onValueChange(minValue as number);
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleStep('decrement')}
        disabled={minValue !== undefined && value <= minValue}
      >
        <Minus className="h-4 w-4" />
        <span className="sr-only">Decrement</span>
      </Button>
      <Input
        ref={ref}
        type="number"
        className="h-8 text-center"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        {...props}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleStep('increment')}
        disabled={maxValue !== undefined && value >= maxValue}
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Increment</span>
      </Button>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';
