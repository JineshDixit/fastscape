'use client';

import { Fragment, useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import LoginModel from '@/components/auth/loginModel';
import RegisterModel from '@/components/auth/regidterModel';
import ForgotPassword from '@/components/auth/forgotPassword';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);

  return (
    <Fragment>
      <Header onLoginClick={() => setOpenLogin(true)} />
      {children}
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
