import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ticket, Lock, User as UserIcon, Mail } from 'lucide-react';
import { appConfig } from '../config/appConfig';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    const result = await register(fullName, email, password, keepLoggedIn);
    setIsLoading(false);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Failed to register.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center text-white mx-auto shadow-md shadow-orange-200 mb-3">
          <Ticket className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-[#111111] tracking-tight">{appConfig.name}</h2>
        <p className="text-xs text-[#6B7280] mt-1 font-medium">{appConfig.subtitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-black/5 rounded-2xl border border-[#E5E5E5] sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Maria Clara Santos"
              leftAddon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mariaclara@example.com"
              leftAddon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftAddon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              leftAddon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] accent-[#F97316] cursor-pointer"
                />
                <span className="text-xs font-semibold text-neutral-700">Keep me logged in</span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#F97316] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
