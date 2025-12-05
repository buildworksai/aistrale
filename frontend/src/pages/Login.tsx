import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getBranding } from '../lib/branding';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const branding = getBranding();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting login form...");
        try {
            console.log("Calling api.post...");
            const response = await api.post('/api/auth/login', { email, password });
            console.log("api.post success:", response);
            navigate('/');
            console.log("Navigated to /");
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.response?.data?.detail || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-primary-main mb-6">
                    {branding.productName}
                </h2>
                <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-200 mb-6">Sign In</h3>
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                            autoComplete="off"
                            name="email_input_no_autofill"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                            autoComplete="new-password"
                            name="password_input_no_autofill"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-main hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
