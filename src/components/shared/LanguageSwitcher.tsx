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
import { useAuthContext } from '@/context/authContext';
import { adminUserService } from '@/api/services/adminUserService';
import { toast } from 'sonner';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ar', name: 'العربية' },
];

/**
 * Authenticated Language Switcher - For authenticated pages
 * Changes i18n language AND syncs with backend
 */
export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { refreshProfile } = useAuthContext();
  const [isUpdating, setIsUpdating] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language) return;

    setIsUpdating(true);
    try {
      // Update language in backend
      await adminUserService.updateLanguage(languageCode);

      // Change i18n language
      await i18n.changeLanguage(languageCode);

      // Refresh user profile to get updated language
      await refreshProfile();

      // Update localStorage
      localStorage.setItem('i18nextLng', languageCode);

      toast.success('Language updated successfully');
    } catch (error: any) {
      console.error('Failed to update language:', error);
      toast.error(error.response?.data?.message || 'Failed to update language');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={currentLanguage.code}
      onValueChange={handleLanguageChange}
      disabled={isUpdating}
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
