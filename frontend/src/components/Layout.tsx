import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getBranding } from '../lib/branding';
import api from '../lib/api';
import { ModeToggle } from './mode-toggle';

export default function Layout({ children }: { children: React.ReactNode }) {
    const branding = getBranding();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout');
            navigate('/login');
        } catch (e) {
            console.error(e);
        }
    };

    const navItems = [
        { label: 'Dashboard', path: '/' },
        { label: 'Tokens', path: '/tokens' },
        { label: 'Inference', path: '/inference' },
        { label: 'Telemetry', path: '/telemetry' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-lg font-bold text-primary-main">{branding.companyName}</h1>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path
                                ? 'bg-primary-main text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-left transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {location.pathname === '/inference' 
                                ? 'Inference Chat' 
                                : location.pathname === '/'
                                ? `Welcome to ${branding.fullProductName}`
                                : navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                        {location.pathname === '/inference' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Interact with AI models through natural conversation</p>
                        )}
                        {location.pathname === '/' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your central hub for managing AI tokens and running secure inference tasks.</p>
                        )}
                    </div>
                    <ModeToggle />
                </header>
                <main className="p-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
