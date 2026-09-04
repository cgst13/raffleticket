import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ticket, Lock, User as UserIcon } from 'lucide-react';
import { appConfig } from '../config/appConfig';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);

    if (result.success) {
      toast.success('Welcome back to RafflePro!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Failed to login.');
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
              label="Username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              leftAddon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftAddon={<Lock className="w-4 h-4" />}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoading}
              >
                Sign In to RafflePro
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#F97316] hover:underline">
              Create an account
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E5E5] text-center text-[11px] text-neutral-400">
            Prototype mode: Any username and password will sign in or register locally.
          </div>
        </div>
      </div>
    </div>
  );
};
