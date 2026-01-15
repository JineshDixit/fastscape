'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type FloatingInputProps = React.ComponentProps<'input'> & {
  label: string;
};

function FloatingInput({ className, type = 'text', label, id, ...props }: FloatingInputProps) {
  const inputId = id ?? React.useId();

  return (
    <div className="relative w-full">
      <input
        id={inputId}
        type={type}
        placeholder=" "
        className={cn(
          'peer bg-background h-14 w-full rounded-md px-3.5 pt-4 pb-1.5 text-sm outline-none',
          'transition-colors duration-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />

      <fieldset
        aria-hidden
        className={cn(
          'border-input/60 pointer-events-none absolute inset-0 m-0 rounded-md border',
          'transition-all duration-200',
          'peer-focus:border-primary peer-focus:border-2',
          'peer-aria-invalid:border-destructive peer-aria-invalid:border-2',
        )}
      >
        <legend
          className={cn(
            'text-xs transition-all duration-200',
            'invisible max-w-0 whitespace-nowrap',
            'peer-focus:visible peer-focus:max-w-full',
            'peer-not-placeholder-shown:visible peer-not-placeholder-shown:max-w-full',
          )}
        >
          <span className="px-0.5 opacity-0">{label}</span>
        </legend>
      </fieldset>

      <label
        htmlFor={inputId}
        className={cn(
          'pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2',
          'text-muted-foreground origin-top-left text-base',
          'transition-all duration-200 ease-out',
          'bg-background px-1',
          'peer-focus:-top-0.5 peer-focus:left-2.5',
          'peer-focus:translate-y-0 peer-focus:scale-75',
          'peer-focus:text-primary',
          'peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:left-2.5',
          'peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:scale-75',
          'peer-disabled:opacity-50',
          'peer-aria-invalid:text-destructive',
        )}
      >
        {label}
      </label>
    </div>
  );
}

export { FloatingInput };
