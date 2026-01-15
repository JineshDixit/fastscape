import { ChipToggleProps } from '@/common/propTypes';
import { cn } from '@/lib/utils';

export function ChipToggle<T extends string>({ options, value, onChange, disabled, className }: ChipToggleProps<T>) {
  return (
    <div className="bg-background inline-flex gap-2 rounded-full">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(option.value)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-medium transition-all',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'border-primary text-primary hover:bg-primary/10 border',
              disabled && 'cursor-not-allowed opacity-50', className
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
