/**
 * Supabase-backed account sign-in and registration view
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { AuthService } from '../../services/authService';
import {
  GraduationCap,
  Sparkles,
  Users,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  Award,
  CheckCircle2,
  Lock,
  BookOpen,
  Cpu,
  Flame,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  isPasswordRecovery?: boolean;
  onPasswordResetComplete?: () => Promise<void> | void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, isPasswordRecovery = false, onPasswordResetComplete }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'register'>('student');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleTabChange = (newTab: 'student' | 'teacher' | 'register') => {
    setActiveTab(newTab);
    setErrorMsg(null);
    setStatusMsg(null);
    setEmailOrUsername('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setBusy(true);

    try {
      if (isPasswordRecovery) {
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        if (password !== passwordConfirmation) throw new Error('The passwords do not match.');
        await AuthService.updatePassword(password);
        setStatusMsg('Password updated. Sign in with your new password.');
        await onPasswordResetComplete?.();
      } else if (activeTab === 'register') {
        if (!emailOrUsername.includes('@')) throw new Error('Enter a valid email address.');
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        if (!displayName.trim()) throw new Error('Enter your full name.');
        const result = await AuthService.register({
          email: emailOrUsername,
          password,
          displayName,
          studentId: studentRollNo || undefined,
        });
        if (result.user) onLoginSuccess(result.user);
        else setStatusMsg('Account created. Check your email to verify the account, then sign in.');
      } else {
        const user = await AuthService.login(emailOrUsername, password, activeTab);
        onLoginSuccess(user);
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    if (!emailOrUsername.trim()) {
      setErrorMsg('Enter your email address first.');
      return;
    }
    setBusy(true);
    try {
      await AuthService.requestPasswordReset(emailOrUsername);
      setStatusMsg('If an account exists for that email, Supabase will send a password reset link.');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Could not send the password reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Left Column: Brand, Team & Fast Demo Switches */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 flex flex-col justify-between space-y-6 border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/40 text-white">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white tracking-tight">AAK Exam</h1>
                <p className="text-xs text-indigo-300">Adaptive Assessment & ML Mastery Engine</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Teacher-Specific Grading Pattern Learning (Random Forest) + Bayesian Knowledge Tracing (BKT) + A* Adaptive Exam Generation.
            </p>

            {/* Team Credits Banner */}
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800/90 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="text-indigo-400">PROJECT TEAM</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Teacher: Ms Annapurna</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-400">
                <div className="flex justify-between items-center bg-slate-900/60 px-2 py-1 rounded">
                  <span className="text-slate-200 font-medium">Ankur Anil Jadhav</span>
                  <span className="font-mono text-[10px] text-indigo-300">24BDS0162</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 px-2 py-1 rounded">
                  <span className="text-slate-200 font-medium">Akshat Gupta</span>
                  <span className="font-mono text-[10px] text-indigo-300">24BCE2930</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 px-2 py-1 rounded">
                  <span className="text-slate-200 font-medium">Karan Singh</span>
                  <span className="font-mono text-[10px] text-indigo-300">24BCI0287</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
            Account passwords are verified and managed by Supabase Auth.
          </div>
        </div>

        {/* Right Column: Role-Specific Login & Signup Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-5">
          {/* Role Navigation Tabs */}
          {!isPasswordRecovery && <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => handleTabChange('student')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student Portal</span>
            </button>
            <button
              onClick={() => handleTabChange('teacher')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Teacher Portal</span>
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Register</span>
            </button>
          </div>}

          <div>
            <h2 className="text-xl font-bold text-white">
              {isPasswordRecovery
                ? 'Choose a New Password'
                : activeTab === 'student'
                ? 'Student Sign In'
                : activeTab === 'teacher'
                ? 'Teacher / Instructor Access'
                : 'Create Academic Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isPasswordRecovery
                ? 'Set a new password for your account.'
                : activeTab === 'student'
                ? 'Sign in with your student email and password to continue learning.'
                : activeTab === 'teacher'
                ? 'Sign in with your verified teacher account to access instructor tools.'
                : 'Create a student account. Teacher access is granted separately by an administrator.'}
            </p>
          </div>

          {!AuthService.isConfigured && (
            <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-3 text-xs text-amber-200">
              Authentication setup is incomplete. Add the Supabase URL and publishable key as Vite environment variables, then restart or redeploy the app.
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 font-semibold">
              {errorMsg}
            </div>
          )}
          {statusMsg && <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/40 p-3 text-xs text-emerald-300 font-semibold">{statusMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {!isPasswordRecovery && activeTab === 'register' && (
              <>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Student Roll Number / ID (optional)</label>
                  <input
                    type="text"
                    value={studentRollNo}
                    onChange={e => setStudentRollNo(e.target.value)}
                    placeholder="e.g. 24BDS0999"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {!isPasswordRecovery && <div>
              <label className="text-slate-400 font-bold block mb-1">Email</label>
              <input
                required
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-bold block">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition focus:outline-none"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Hide password</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Show password</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={activeTab === 'register' || isPasswordRecovery ? 8 : undefined}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isPasswordRecovery ? 'Enter your new password' : 'Enter your password'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 pr-10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition focus:outline-none rounded-lg"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-indigo-400" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isPasswordRecovery && (
              <div>
                <label className="text-slate-400 font-bold block mb-1">Confirm new password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={e => setPasswordConfirmation(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            )}

            {!isPasswordRecovery && activeTab !== 'register' && (
              <div className="text-right">
                <button type="button" onClick={handleForgotPassword} disabled={busy} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition shadow-lg flex items-center justify-center gap-2 ${
                !isPasswordRecovery && activeTab === 'teacher'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              <span>
                {busy ? 'Please wait…' : isPasswordRecovery
                  ? 'Update Password'
                  : activeTab === 'register'
                  ? 'Create Academic Account'
                  : activeTab === 'teacher'
                  ? 'Sign in to Teacher Portal'
                  : 'Enter Student Portal'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {!isPasswordRecovery && <div className="pt-2 text-center text-xs text-slate-400">
            {activeTab === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('student')}
                  className="text-indigo-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Need a student account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className="text-indigo-400 font-bold hover:underline"
                >
                  Register
                </button>
              </span>
            )}
          </div>}
        </div>
      </div>
    </div>
  );
};
