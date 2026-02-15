'use client';

import * as React from 'react';
import { FloatingInput } from '@/components/ui/input';
import { useGooglePlaces, type PlacePrediction } from '@/app/axios/hooks/useGooglePlaces';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface GooglePlacesInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value?: string;
  onChange?: (value: string, placeId?: string) => void;
  onPlaceSelect?: (prediction: PlacePrediction) => void;
  restrictToDubai?: boolean;
  debounceMs?: number;
}

export const GooglePlacesInput = React.forwardRef<HTMLInputElement, GooglePlacesInputProps>(
  (
    {
      label,
      value = '',
      onChange,
      onPlaceSelect,
      restrictToDubai = true,
      debounceMs = 300,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = React.useState(value);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    
    const containerRef = React.useRef<HTMLDivElement>(null);
    const suggestionsRef = React.useRef<HTMLDivElement>(null);

    const { predictions, isLoading, error, searchPlaces, clearPredictions } = useGooglePlaces({
      debounceMs,
      restrictToDubai,
    });

    // Sync external value changes
    React.useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setSelectedIndex(-1);
      
      if (onChange) {
        onChange(newValue);
      }

      // Search for places
      if (newValue.trim().length >= 3) {
        searchPlaces(newValue);
        setShowSuggestions(true);
      } else {
        clearPredictions();
        setShowSuggestions(false);
      }
    };

    // Handle place selection
    const handlePlaceSelect = (prediction: PlacePrediction) => {
      setInputValue(prediction.description);
      setShowSuggestions(false);
      clearPredictions();
      setSelectedIndex(-1);

      if (onChange) {
        onChange(prediction.description, prediction.placeId);
      }

      if (onPlaceSelect) {
        onPlaceSelect(prediction);
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || predictions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && predictions[selectedIndex]) {
            handlePlaceSelect(predictions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    };

    // Scroll selected item into view
    React.useEffect(() => {
      if (selectedIndex >= 0 && suggestionsRef.current) {
        const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, [selectedIndex]);

    // Close suggestions when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showDropdown = showSuggestions && (predictions.length > 0 || isLoading || error);

    return (
      <div ref={containerRef} className="relative w-full">
        <FloatingInput
          ref={ref}
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          disabled={disabled}
          className={className}
          autoComplete="off"
          endContent={
            isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="size-4 animate-spin opacity-50" />
              </div>
            ) : undefined
          }
          {...props}
        />

        {/* Suggestions Dropdown */}
        {showDropdown && (
          <div
            className={cn(
              'bg-popover text-popover-foreground ring-foreground/10 absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md shadow-lg ring-1',
              'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
            )}
          >
            <div
              ref={suggestionsRef}
              className="max-h-[300px] overflow-y-auto overscroll-contain p-1"
              role="listbox"
            >
              {isLoading && predictions.length === 0 && (
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Searching places...</span>
                </div>
              )}

              {error && !isLoading && (
                <div className="text-destructive px-3 py-2 text-sm">{error}</div>
              )}

              {!isLoading && !error && predictions.length === 0 && inputValue.trim().length >= 3 && (
                <div className="text-muted-foreground px-3 py-6 text-center text-sm">
                  No places found in Dubai
                </div>
              )}

              {predictions.map((prediction, index) => (
                <button
                  key={prediction.placeId}
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => handlePlaceSelect(prediction)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-sm px-3 py-2 text-left text-sm outline-none transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    index === selectedIndex && 'bg-accent text-accent-foreground',
                  )}
                >
                  <span className="font-medium">{prediction.mainText}</span>
                  {prediction.secondaryText && (
                    <span className="text-muted-foreground text-xs">{prediction.secondaryText}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

GooglePlacesInput.displayName = 'GooglePlacesInput';
