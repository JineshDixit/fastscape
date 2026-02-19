import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import logo from '@/assets/Logo.png';
import { useAuth } from '@/api/hooks/useAuth';
import { authCookies } from '@/api';
import type { FormErrors } from '@/common/interface/loginInterface';
import { Spinner } from '@/components/ui/spinner';
// import { PublicLanguageSwitcher } from '@/components/shared/PublicLanguageSwitcher';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated: isAuth } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const from = location.state?.from || '/dashboard';

  useEffect(() => {
    if (isAuth) {
      navigate(from, { replace: true });
    }
  }, [navigate, from, isAuth]);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [email, password, clearError]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login({ email, password });

      if (rememberMe) {
        authCookies.setRememberMe(true);
      } else {
        authCookies.setRememberMe(false);
      }

      // Redirect to the original page they were trying to access
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      {/* Language Switcher - Top Right Corner */}
      {/* <div className="absolute top-6 right-6">
        <PublicLanguageSwitcher />
      </div> */}

      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-48">
                <img src={logo} alt="Logo" />
              </div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-foreground text-2xl font-semibold">Welcome back!</CardTitle>
              <CardDescription className="text-muted-foreground">Log in to your Fastscape account</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Display API error */}
            {error && (
              <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
                <p className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="kai.doe@gmail.com"
                    value={email}
                    onChange={handleEmailChange}
                    className={`h-11 ${errors.email ? 'border-destructive focus-visible:border-destructive' : ''}`}
                    aria-invalid={!!errors.email}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground text-sm font-medium">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`h-11 pr-20 ${errors.password ? 'border-destructive focus-visible:border-destructive' : ''}`}
                    aria-invalid={!!errors.password}
                    disabled={isLoading}
                  />
                  <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2 focus:ring-offset-0"
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-foreground cursor-pointer text-sm">
                  Remember me
                </Label>
              </div>

              <Button type="submit" className="h-11 w-full text-base font-medium" size="lg" disabled={isLoading}>
                {isLoading && <Spinner />}
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
