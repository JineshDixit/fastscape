'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, ArrowRight, Lock, LogIn, Mail, Phone, ChevronRight } from 'lucide-react';
import type { UserProfile } from '@/common/interfaces';
import { useAuth } from '@/app/axios';
import loginModel from '@/components/auth/loginModel';
import registerModel from '@/components/auth/registerModel';
import forgotPassword from '@/components/auth/forgotPassword';
import { useTranslations } from 'next-intl';

const LoginModel = loginModel;
const RegisterModel = registerModel;
const ForgotPasswordModel = forgotPassword;

interface IdentityStepProps {
  profile: UserProfile | null;
  onNext: (password: string) => void;
  isLoading?: boolean;
}

const IdentityStep: React.FC<IdentityStepProps> = ({ profile, onNext, isLoading }) => {
  const t = useTranslations('identityStep');
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [authView, setAuthView] = useState<'NONE' | 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('NONE');

  if (!user) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center space-y-8 py-16 duration-700">
        <div className="bg-primary/10 text-primary ring-primary/5 relative rounded-full p-6 ring-8">
          <LogIn className="h-12 w-12" />
        </div>
        <div className="space-y-3 text-center">
          <h3 className="text-3xl font-black tracking-tighter uppercase italic">{t('restricted')}</h3>
          <p className="mx-auto max-w-sm text-base font-medium text-gray-400">{t('authRequired')}</p>
        </div>
        <Button
          onClick={() => setAuthView('LOGIN')}
          className="shadow-primary/20 h-14 rounded-2xl px-12 text-xs font-black tracking-[0.2em] uppercase shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          {t('initializeLogin')}
        </Button>
        <LoginModel
          open={authView === 'LOGIN'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
          onRegisterClick={() => setAuthView('REGISTER')}
          onForgotPasswordClick={() => setAuthView('FORGOT_PASSWORD')}
        />
        <RegisterModel
          open={authView === 'REGISTER'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
          onLoginClick={() => setAuthView('LOGIN')}
        />
        <ForgotPasswordModel
          open={authView === 'FORGOT_PASSWORD'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header Info */}
      <div className="space-y-2">
        <h3 className="text-xl font-black tracking-tight text-gray-950 uppercase italic dark:text-white">
          {t('title')} <span className="text-primary">{t('verification')}</span>
        </h3>
        <p className="max-w-lg text-sm leading-relaxed font-medium text-gray-500">{t('description')}</p>
      </div>

      {/* Read-only Profile Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="group hover:border-primary/20 flex flex-col justify-center rounded-2xl border border-gray-100 bg-gray-50/50 p-6 transition-all dark:border-gray-800 dark:bg-gray-800/50">
          <div className="mb-3 flex items-center gap-3">
            <User className="text-primary h-4 w-4" />
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('callsign')}</span>
          </div>
          <p className="truncate text-lg font-black text-gray-950 uppercase dark:text-white">
            {profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : t('awaitingIntel')}
          </p>
        </div>

        <div className="group hover:border-primary/20 flex flex-col justify-center rounded-2xl border border-gray-100 bg-gray-50/50 p-6 transition-all dark:border-gray-800 dark:bg-gray-800/50">
          <div className="mb-3 flex items-center gap-3">
            <Mail className="text-primary h-4 w-4" />
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('commLink')}</span>
          </div>
          <p className="truncate text-base font-bold text-gray-600 dark:text-gray-400">{profile?.email}</p>
        </div>

        <div className="group hover:border-primary/20 flex flex-col justify-center rounded-2xl border border-gray-100 bg-gray-50/50 p-6 transition-all dark:border-gray-800 dark:bg-gray-800/50">
          <div className="mb-3 flex items-center gap-3">
            <Phone className="text-primary h-4 w-4" />
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('secureLine')}</span>
          </div>
          <p className="truncate text-base font-bold text-gray-600 dark:text-gray-400">
            {profile?.phone || t('fieldMissing')}
          </p>
        </div>

        <div className="group hover:border-primary/20 flex flex-col justify-center rounded-2xl border border-gray-100 bg-gray-50/50 p-6 transition-all dark:border-gray-800 dark:bg-gray-800/50">
          <div className="mb-3 flex items-center gap-3">
            <ShieldCheck className="text-primary h-4 w-4" />
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('status')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <p className="text-[11px] font-black tracking-tighter text-green-600 uppercase dark:text-green-500">
              {t('activeAuthorized')}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Section */}
      <div className="border-primary/10 bg-primary/5 dark:bg-primary/5 space-y-6 rounded-3xl border-2 p-8">
        <div className="space-y-2">
          <h4 className="text-lg font-black tracking-tight text-gray-950 dark:text-white">
            Profile Verification
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your profile information will be used for this booking. Please ensure all details are correct.
          </p>
        </div>

        <Button
          onClick={() => onNext('')}
          disabled={isLoading || !profile?.firstName || !profile?.lastName || !profile?.phone}
          className="group relative h-16 w-full overflow-hidden rounded-2xl bg-gray-950 font-black tracking-widest text-white uppercase transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
        >
          <div className="relative z-10 flex items-center justify-center gap-4">
            {isLoading ? t('processing') : t('authorizeAndProceed')}
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </div>
        </Button>
      </div>

      <p className="text-center text-[9px] font-bold tracking-widest text-gray-400 uppercase">{t('disclaimer')}</p>
    </div>
  );
};

export default IdentityStep;
