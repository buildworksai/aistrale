import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getBranding } from '../lib/branding';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const navigate = useNavigate();
    const branding = getBranding();

    // Clear error when user starts typing
    useEffect(() => {
        if (error && (email || password)) {
            setError('');
        }
    }, [email, password, error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/api/auth/login', { email, password });
            
            // Small delay for better UX feedback
            await new Promise(resolve => setTimeout(resolve, 300));
            
            navigate('/');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Login failed. Please check your credentials and try again.';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const isFormValid = email.trim() !== '' && password.trim() !== '';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-main/10 via-white to-info-main/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo/Branding Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-main to-info-main rounded-2xl shadow-lg mb-4 transform transition-transform hover:scale-105">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {branding.productName}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                        {branding.productTagline}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                                Welcome back
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Sign in to your account to continue
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div 
                                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 duration-300"
                                role="alert"
                                aria-live="polite"
                            >
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Authentication failed
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            {/* Email Field */}
                            <div>
                                <label 
                                    htmlFor="email" 
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg 
                                            className={`h-5 w-5 transition-colors ${
                                                focusedField === 'email' 
                                                    ? 'text-primary-main' 
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-200 ${
                                            error && !email
                                                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500'
                                                : focusedField === 'email'
                                                ? 'border-primary-main focus:border-primary-main focus:ring-2 focus:ring-primary-main/20'
                                                : 'border-gray-300 dark:border-gray-600 focus:border-primary-main focus:ring-2 focus:ring-primary-main/20'
                                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="you@example.com"
                                        required
                                        autoComplete="email"
                                        aria-invalid={error && !email ? 'true' : 'false'}
                                        aria-describedby={error && !email ? 'email-error' : undefined}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label 
                                        htmlFor="password" 
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-sm text-primary-main hover:text-primary-dark font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-main/20 rounded"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg 
                                            className={`h-5 w-5 transition-colors ${
                                                focusedField === 'password' 
                                                    ? 'text-primary-main' 
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-200 ${
                                            error && !password
                                                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500'
                                                : focusedField === 'password'
                                                ? 'border-primary-main focus:border-primary-main focus:ring-2 focus:ring-primary-main/20'
                                                : 'border-gray-300 dark:border-gray-600 focus:border-primary-main focus:ring-2 focus:ring-primary-main/20'
                                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                        aria-invalid={error && !password ? 'true' : 'false'}
                                        aria-describedby={error && !password ? 'password-error' : undefined}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!isFormValid || loading}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                                    isFormValid && !loading
                                        ? 'bg-primary-main hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                                        : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                }`}
                                aria-busy={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign in</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                {branding.footerText}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Need help?{' '}
                        <a 
                            href={branding.websiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-main hover:text-primary-dark font-medium transition-colors"
                        >
                            Visit our website
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
