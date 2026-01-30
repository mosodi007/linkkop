import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

const LANGUAGES = [
  { code: 'en', key: 'languages.en' },
  { code: 'es', key: 'languages.es' },
  { code: 'fr', key: 'languages.fr' },
] as const;

function currentLanguageCode(lng: string): string {
  const code = lng.split('-')[0];
  return LANGUAGES.some((l) => l.code === code) ? code : 'en';
}

export function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const langCode = currentLanguageCode(i18n.language);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <img
          src="/Linkkop.png"
          alt="Linkkop"
          className="h-6 w-auto object-contain"
        />
        <Select
          value={langCode}
          onValueChange={(value) => i18n.changeLanguage(value)}
        >
          <SelectTrigger className="w-[140px] border-neutral-200 bg-neutral-50">
            <SelectValue placeholder={t('landing.language')} />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(({ code, key }) => (
              <SelectItem key={code} value={code}>
                {t(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <p className="text-neutral-600 text-lg leading-relaxed">
              {t('landing.tagline')}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/signup')}
              className="w-full h-12 rounded-xl text-base font-medium bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {t('landing.getStarted')}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-neutral-600"
              onClick={() => navigate('/signin')}
            >
              {t('landing.signIn')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
