import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, Wallet, Smartphone, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import ActionModal from '../components/ActionModal';

type AuthMode = 'login' | 'register' | 'forgot';
type Role = 'passenger' | 'conductor' | 'operator';

// ─── Backend API integration point (Issue #14) ─────────────────────────────
// TODO: replace stubs with real FastAPI calls, e.g.
//   POST /api/auth/login    { email, password, role }
//   POST /api/auth/register { firstName, lastName, email, phone, nic, password, role, ... }
//   Response: { token, user } | { detail: error }
// The forms below already collect/validate all required fields so wiring is a
// drop-in replacement inside handleSubmit.
async function authApiLogin(_payload: { email: string; password: string; role: Role }): Promise<void> {
  return Promise.resolve();
}
async function authApiRegister(_payload: Record<string, string>): Promise<void> {
  return Promise.resolve();
}

function getPasswordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
}

export default function AuthPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState<AuthMode>(location.pathname === '/register' ? 'register' : 'login');
  const [activeRole, setActiveRole] = useState<Role>('passenger');

  // State for forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Dynamic fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [brn, setBrn] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [license, setLicense] = useState('');
  const [assignedBus, setAssignedBus] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', msg: '' });

  const handleAction = (title: string, msg: string) => {
    setModalContent({ title, msg });
    setModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        handleAction('Security Alert', 'Only strict PDF files are allowed for security reasons.');
        e.target.value = '';
      } else if (file.size > 2 * 1024 * 1024) {
        handleAction('File Too Large', 'The selected PDF exceeds the strict 2MB limit.');
        e.target.value = '';
      }
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) next.email = 'Enter a valid email address.';
    if (authMode !== 'forgot') {
      if (password.length < 8) next.password = 'Use at least 8 characters.';
      if (authMode === 'register' && password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    }
    if (authMode === 'register') {
      if (!firstName.trim()) next.firstName = 'First name is required.';
      if (!lastName.trim()) next.lastName = 'Last name is required.';
      if (activeRole === 'passenger') {
        if (!/^\+?[0-9\s-]{7,15}$/.test(phone.trim())) next.phone = 'Enter a valid phone number.';
        if (!nic.trim()) next.nic = 'NIC / ID number is required.';
      }
      if (activeRole === 'operator') {
        if (!companyName.trim()) next.companyName = 'Company name is required.';
        if (!brn.trim()) next.brn = 'Business registration number is required.';
        if (!fleetSize || Number(fleetSize) < 1) next.fleetSize = 'Fleet size must be at least 1.';
      }
      if (activeRole === 'conductor') {
        if (!nic.trim()) next.nic = 'NIC / ID number is required.';
        if (!license.trim()) next.license = 'License number is required.';
        if (!assignedBus.trim()) next.assignedBus = 'Assigned bus plate is required.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (authMode === 'forgot') {
      handleAction('Reset Link Sent', 'If an account exists for this email, a password reset link has been sent.');
    } else if (authMode === 'register') {
      // TODO: await authApiRegister({ firstName, lastName, email, phone, nic, password, role: activeRole, ... });
      await authApiRegister({ email });
      handleAction('Registration Received', 'Your account details and KYC documents have been submitted for review.');
    } else {
      // TODO: await authApiLogin({ email, password, role: activeRole });
      await authApiLogin({ email, password, role: activeRole });
      // Login route bypass simulation for demo
      if (activeRole === 'passenger') navigate('/passenger');
      if (activeRole === 'conductor') navigate('/conductor');
      if (activeRole === 'operator') navigate('/operator');
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrors({});
  };

  const roles: { id: Role; label: string }[] = [
    { id: 'passenger', label: 'Passenger' },
    { id: 'conductor', label: 'Conductor' },
    { id: 'operator', label: 'Bus Owner' },
  ];

  const pwStrength = getPasswordStrength(password);
  const inputCls =
    'w-full min-w-0 bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all';
  const errCls = 'text-xs text-red-600 mt-1';

  return (
    <div className="min-h-screen bg-white md:bg-slate-50 md:flex md:items-center md:justify-center md:p-8 font-sans">
      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        message={modalContent.msg}
      />

      {/* ── MOBILE HERO HEADER (Issue #23: Figma curved blue header, mobile only) ── */}
      <div className="md:hidden bg-blue-600 px-6 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-blue-700 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-6 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.jpeg" alt="TapRide logo" className="w-10 h-10 rounded-xl shadow-sm object-cover" />
            <span className="text-xl font-bold text-white tracking-wide">TapRide</span>
          </div>
          <h1 className="text-[28px] leading-tight font-bold text-white">
            {authMode === 'login' ? 'Welcome back' : authMode === 'register' ? 'Join TapRide' : 'Reset password'}
          </h1>
          <p className="text-sm text-blue-100 mt-2 max-w-[280px]">
            {authMode === 'login'
              ? 'Sign in to manage your journeys, wallet and smart transport services.'
              : authMode === 'register'
                ? 'Create your account and start enjoying a smarter public transport experience.'
                : 'We will send you reset instructions.'}
          </p>
        </div>
      </div>

      <div className="w-full md:max-w-[1100px] bg-white rounded-t-[32px] -mt-6 md:mt-0 relative z-10 md:rounded-[24px] shadow-2xl flex overflow-hidden md:border md:border-gray-100">
        {/* LEFT PANEL - BRANDING (Hidden on Mobile, intact on desktop) */}
        <div className="hidden md:flex w-1/2 bg-blue-600 p-12 flex-col justify-between relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-700 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo.jpeg" alt="TapRide logo" className="w-10 h-10 rounded-xl shadow-sm object-cover" />
              <span className="text-xl font-bold text-white tracking-wide">TapRide</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              {authMode === 'login' ? (
                <>
                  Smarter journeys.
                  <br />
                  Seamless travel.
                </>
              ) : (
                <>
                  Start your
                  <br />
                  smarter journey.
                </>
              )}
            </h1>
            <p className="text-blue-100 text-sm lg:text-base mb-12 max-w-sm leading-relaxed">
              {authMode === 'login'
                ? 'A modern digital public transport platform designed to make bus travel faster, easier, and more convenient.'
                : 'Create your TapRide account and experience a simpler, smarter way to manage public transport journeys.'}
            </p>

            <div className="space-y-5">
              {[
                { icon: QrCode, text: 'Fast QR-based boarding' },
                { icon: Wallet, text: 'Secure digital wallet & payments' },
                { icon: Smartphone, text: 'Digital journey records' },
                { icon: ShieldCheck, text: 'Smart fare management' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-4 text-blue-50">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-xs text-blue-200/60 font-medium">
            © 2026 TapRide. Smart Public Transport Platform.
          </div>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className="w-full md:w-1/2 px-6 py-8 md:p-12 lg:p-16 flex flex-col justify-center md:max-h-[90vh] md:overflow-y-auto">
          {/* Mobile Logo (kept minimal — hero above carries branding) */}
          <div className="md:hidden flex items-center gap-3 mb-6" onClick={() => navigate('/')}>
            <img src="/logo.jpeg" alt="TapRide logo" className="w-9 h-9 rounded-xl shadow-sm object-cover" />
            <span className="text-lg font-bold text-slate-900">TapRide</span>
          </div>

          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {authMode === 'login' ? (
                <>
                  <span className="md:hidden">Sign in</span>
                  <span className="hidden md:inline">Welcome back</span>
                </>
              ) : authMode === 'register' ? (
                <>
                  <span className="md:hidden">Create account</span>
                  <span className="hidden md:inline">Create your account</span>
                </>
              ) : (
                'Reset password'
              )}
            </h2>
            <p className="text-sm text-slate-500">
              {authMode === 'login' ? (
                <>
                  <span className="md:hidden">Enter your account details to continue.</span>
                  <span className="hidden md:inline">Sign in to continue to your TapRide account.</span>
                </>
              ) : authMode === 'register' ? (
                <>
                  <span className="md:hidden">Enter your details to get started.</span>
                  <span className="hidden md:inline">Register with TapRide to get started.</span>
                </>
              ) : (
                'Enter your email to receive reset instructions.'
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6" noValidate>
            {/* ROLE SELECTOR — 3 independent bordered cards (Issue #23 Figma) */}
            {authMode !== 'forgot' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  {authMode === 'login' ? 'Login as' : 'Select account type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActiveRole(r.id)}
                      aria-pressed={activeRole === r.id}
                      className={`py-2.5 px-1 text-[13px] font-semibold rounded-xl border transition-all ${
                        activeRole === r.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                          : 'bg-white border-gray-200 text-slate-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DYNAMIC REGISTRATION FIELDS */}
            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputCls}
                    placeholder="John"
                    required
                  />
                  {errors.firstName && <p className={errCls}>{errors.firstName}</p>}
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputCls}
                    placeholder="Doe"
                    required
                  />
                  {errors.lastName && <p className={errCls}>{errors.lastName}</p>}
                </div>
              </div>
            )}

            {/* EMAIL FIELD */}
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
                required
              />
              {errors.email && <p className={errCls}>{errors.email}</p>}
            </div>

            {/* KYC EXTENDED FIELDS (Only in register mode) */}
            {authMode === 'register' && activeRole === 'passenger' && (
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                    placeholder="+94 7X XXX XXXX"
                    required
                  />
                  {errors.phone && <p className={errCls}>{errors.phone}</p>}
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">NIC / ID number</label>
                  <input
                    type="text"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    className={inputCls}
                    placeholder="199XXXXXXXXX"
                    required
                  />
                  {errors.nic && <p className={errCls}>{errors.nic}</p>}
                </div>
              </div>
            )}

            {authMode === 'register' && activeRole === 'operator' && (
              <>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={inputCls}
                      placeholder="Superline Travels"
                      required
                    />
                    {errors.companyName && <p className={errCls}>{errors.companyName}</p>}
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputCls}
                      placeholder="+94 7X XXX XXXX"
                      required
                    />
                    {errors.phone && <p className={errCls}>{errors.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Business Reg (BRN)</label>
                    <input
                      type="text"
                      value={brn}
                      onChange={(e) => setBrn(e.target.value)}
                      className={inputCls}
                      placeholder="PV-123456"
                      required
                    />
                    {errors.brn && <p className={errCls}>{errors.brn}</p>}
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Fleet Size</label>
                    <input
                      type="number"
                      value={fleetSize}
                      onChange={(e) => setFleetSize(e.target.value)}
                      className={inputCls}
                      placeholder="e.g. 5"
                      min="1"
                      required
                    />
                    {errors.fleetSize && <p className={errCls}>{errors.fleetSize}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Reg Docs (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="w-full min-w-0 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl bg-white p-1.5"
                    required
                  />
                </div>
              </>
            )}

            {authMode === 'register' && activeRole === 'conductor' && (
              <>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">NIC / ID number</label>
                    <input
                      type="text"
                      value={nic}
                      onChange={(e) => setNic(e.target.value)}
                      className={inputCls}
                      placeholder="199XXXXXXXXX"
                      required
                    />
                    {errors.nic && <p className={errCls}>{errors.nic}</p>}
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">License No.</label>
                    <input
                      type="text"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      className={inputCls}
                      placeholder="NTC-C-XXXX"
                      required
                    />
                    {errors.license && <p className={errCls}>{errors.license}</p>}
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned Bus Plate</label>
                  <input
                    type="text"
                    value={assignedBus}
                    onChange={(e) => setAssignedBus(e.target.value)}
                    className={inputCls}
                    placeholder="NC-XXXX"
                    required
                  />
                  {errors.assignedBus && <p className={errCls}>{errors.assignedBus}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Upload License (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="w-full min-w-0 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl bg-white p-1.5"
                    required
                  />
                </div>
              </>
            )}

            {/* PASSWORD FIELDS */}
            {authMode !== 'forgot' && (
              <div className={authMode === 'register' ? 'grid grid-cols-2 gap-3 md:gap-4' : ''}>
                <div className="min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputCls} pr-11`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className={errCls}>{errors.password}</p>}
                  {authMode === 'register' && (
                    <div className="mt-2">
                      {/* 4-segment password strength bars (Issue #23 Figma) */}
                      <div className="flex gap-1.5" aria-label="Password strength">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${
                              i < pwStrength ? (pwStrength <= 1 ? 'bg-red-500' : pwStrength === 2 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1.5">Use at least 8 characters.</p>
                    </div>
                  )}
                </div>
                {authMode === 'register' && (
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputCls}
                      placeholder="Confirm password"
                      required
                    />
                    {errors.confirmPassword && <p className={errCls}>{errors.confirmPassword}</p>}
                  </div>
                )}
              </div>
            )}

            {/* OPTIONS (Remember Me / Terms) */}
            {authMode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {authMode === 'register' && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  required
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" className="font-bold text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="font-bold text-blue-600 hover:underline">
                    Privacy Policy
                  </a>{' '}
                  of TapRide.
                </span>
              </label>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-600/20 transition-all text-sm"
            >
              {authMode === 'login' ? 'Sign in to TapRide' : authMode === 'register' ? 'Create TapRide Account' : 'Send Reset Link'}
            </button>

            {/* OR divider + trust badge (Issue #23 Figma, mobile + desktop) */}
            {authMode === 'login' && (
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] font-semibold text-slate-400">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3 h-3" />
              {authMode === 'login' ? 'Your information is securely protected' : 'Your personal information is securely protected'}
            </p>

            {/* FOOTER TOGGLE */}
            <div className="pt-1 text-center">
              <span className="text-xs text-slate-500">
                {authMode === 'login'
                  ? "Don't have a TapRide account? "
                  : authMode === 'register'
                    ? 'Already have an account? '
                    : 'Remembered your password? '}
              </span>
              <button
                type="button"
                onClick={() => switchMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {authMode === 'login' ? 'Create an account' : 'Sign in'}
              </button>
            </div>

            {/* Mobile copyright footer (Issue #23 Figma) */}
            <p className="md:hidden text-center text-[11px] text-slate-400 pt-4 pb-2">
              © 2026 TapRide · Smart Public Transport Platform
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
