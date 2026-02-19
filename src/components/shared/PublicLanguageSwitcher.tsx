import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ar', name: 'العربية' },
];

/**
 * Public Language Switcher - For unauthenticated pages (login, register, etc.)
 * Only changes i18n language locally, doesn't sync with backend
 */
export const PublicLanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language) return;

    setIsChanging(true);
    try {
      // Change i18n language
      await i18n.changeLanguage(languageCode);

      // Update localStorage for persistence
      localStorage.setItem('i18nextLng', languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Select
      value={currentLanguage.code}
      onValueChange={handleLanguageChange}
      disabled={isChanging}
    >
      <SelectTrigger className="w-[160px] h-10 border-border bg-background">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-sm">{currentLanguage.name}</span>
            </div>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem
            key={language.code}
            value={language.code}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full gap-3">
            <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
