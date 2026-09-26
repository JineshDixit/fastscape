'use client';

import { Fragment, useEffect, useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import LoginModel from '@/components/auth/loginModel';
import RegisterModel from '@/components/auth/registerModel';
import ForgotPassword from '@/components/auth/forgotPassword';
import { usePathname } from '@/localization/navigation';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (openLogin || openRegister || openForgotPassword) return;

    // Defensive cleanup for occasional stale scroll-lock styles left by modal primitives on route transitions.
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('pointer-events');
    document.body.removeAttribute('data-scroll-locked');

    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('padding-right');
    document.documentElement.removeAttribute('data-scroll-locked');
  }, [pathname, openLogin, openRegister, openForgotPassword]);

  return (
    <Fragment>
      <Header onLoginClick={() => setOpenLogin(true)} />
      <div className="py-6">{children}</div>
      <Footer />
      <LoginModel
        open={openLogin}
        onOpenChange={setOpenLogin}
        onRegisterClick={() => setOpenRegister(true)}
        onForgotPasswordClick={() => setOpenForgotPassword(true)}
      />
      <RegisterModel open={openRegister} onOpenChange={setOpenRegister} onLoginClick={() => setOpenLogin(true)} />
      <ForgotPassword open={openForgotPassword} onOpenChange={setOpenForgotPassword} />
    </Fragment>
  );
}
