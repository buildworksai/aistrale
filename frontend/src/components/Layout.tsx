import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getBranding } from '../lib/branding';
import api from '../lib/api';
import { ModeToggle } from './mode-toggle';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    section?: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const branding = getBranding();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>('Core'); // Core section expanded by default

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/auth/me');
                setCurrentUser(res.data);
            } catch (e: any) {
                // User not authenticated - this is expected if not logged in
                if (e.response?.status !== 401) {
                    console.error('Failed to fetch current user:', e);
                }
            }
        };
        fetchUser();
    }, []);

    // Auto-expand section containing the active page
    useEffect(() => {
        const activeItem = filteredNavItems.find(item => isActive(item.path));
        if (activeItem && activeItem.section) {
            setExpandedSection(activeItem.section);
        } else if (location.pathname === '/' || !activeItem) {
            // Keep Core section expanded for dashboard
            setExpandedSection('Core');
        }
    }, [location.pathname, currentUser]);

    const handleLogout = async () => {
        // Clear user state immediately
        setCurrentUser(null);
        // Navigate to logout route which will handle API call and redirect
        navigate('/logout', { replace: true });
    };

    const navItems: NavItem[] = [
        // Core
        {
            label: 'Dashboard',
            path: '/',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            label: 'Inference',
            path: '/inference',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            label: 'LLM Prompts',
            path: '/prompts',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            label: 'Prompt Optimization',
            path: '/prompt-optimization',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            )
        },
        {
            label: 'API Keys Tokens',
            path: '/tokens',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            )
        },
        {
            label: 'Telemetry',
            path: '/telemetry',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        // Enterprise Security & Compliance
        {
            label: 'Workspaces',
            path: '/workspaces',
            section: 'Enterprise',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Projects',
            path: '/projects',
            section: 'Enterprise',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Permissions',
            path: '/permissions',
            section: 'Enterprise',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Compliance',
            path: '/compliance',
            section: 'Enterprise',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Data Residency',
            path: '/data-residency',
            section: 'Enterprise',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'DLP',
            path: '/dlp',
            section: 'Enterprise',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Security Audit',
            path: '/security-audit',
            section: 'Enterprise',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            adminOnly: true
        },
        // Cost Optimization
        {
            label: 'Cost Dashboard',
            path: '/cost-optimization',
            section: 'Cost',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Budgets',
            path: '/budgets',
            section: 'Cost',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Cost Forecasting',
            path: '/cost-forecasting',
            section: 'Cost',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Optimization',
            path: '/optimization-recommendations',
            section: 'Cost',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            adminOnly: true
        },
        // Multi-Provider Intelligence
        {
            label: 'Provider Health',
            path: '/provider-health',
            section: 'Providers',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Provider Comparison',
            path: '/provider-comparison',
            section: 'Providers',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'A/B Testing',
            path: '/ab-testing',
            section: 'Providers',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Model Abstraction',
            path: '/model-abstraction',
            section: 'Providers',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Smart Routing',
            path: '/smart-routing',
            section: 'Providers',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Failover',
            path: '/failover',
            section: 'Providers',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            adminOnly: true
        },
        // Production Reliability
        {
            label: 'Reliability',
            path: '/reliability',
            section: 'Reliability',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Queue Management',
            path: '/queue-management',
            section: 'Reliability',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Circuit Breakers',
            path: '/circuit-breakers',
            section: 'Reliability',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Load Balancing',
            path: '/load-balancing',
            section: 'Reliability',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            adminOnly: true
        },
        // Developer Experience
        {
            label: 'SDKs',
            path: '/sdks',
            section: 'Developer',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Webhooks',
            path: '/webhooks',
            section: 'Developer',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Developer Settings',
            path: '/developer-settings',
            section: 'Developer',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            adminOnly: true
        },
        // Evaluation & Testing
        {
            label: 'Evaluation',
            path: '/evaluation',
            section: 'Testing',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            adminOnly: true
        },
        // Admin
        {
            label: 'Users',
            path: '/users',
            section: 'Admin',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            adminOnly: true
        },
        {
            label: 'Admin',
            path: '/admin',
            section: 'Admin',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            adminOnly: true
        },
    ];

    const filteredNavItems = useMemo(
        () => navItems.filter(item => !item.adminOnly || currentUser?.role === 'admin'),
        [currentUser]
    );

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    // Auto-expand section containing the active page
    useEffect(() => {
        const activeItem = filteredNavItems.find(item => isActive(item.path));
        if (activeItem && activeItem.section) {
            setExpandedSection(activeItem.section);
        } else if (location.pathname === '/' || !activeItem) {
            // Keep Core section expanded for dashboard
            setExpandedSection('Core');
        }
    }, [location.pathname, filteredNavItems]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white dark:bg-gray-800 
                border-r border-gray-200 dark:border-gray-700 
                flex flex-col transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                shadow-lg lg:shadow-none
            `}>
                {/* Logo & Brand */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary-main rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{branding.productName}</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">LLM Engineering Platform</p>
                        </div>
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                    {(() => {
                        const sections: { [key: string]: NavItem[] } = {};
                        filteredNavItems.forEach(item => {
                            const section = item.section || 'Core';
                            if (!sections[section]) {
                                sections[section] = [];
                            }
                            sections[section].push(item);
                        });

                        const handleSectionToggle = (sectionName: string) => {
                            setExpandedSection(expandedSection === sectionName ? null : sectionName);
                        };

                        return Object.entries(sections).map(([sectionName, items]) => {
                            const isExpanded = expandedSection === sectionName;
                            const isCore = sectionName === 'Core';
                            
                            return (
                                <div key={sectionName} className="mb-2">
                                    {!isCore && (
                                        <button
                                            onClick={() => handleSectionToggle(sectionName)}
                                            className="w-full flex items-center justify-between px-3 py-2 mb-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                                            aria-expanded={isExpanded}
                                            aria-label={`Toggle ${sectionName} section`}
                                        >
                                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-hover:text-gray-700 dark:group-hover:text-gray-300">
                                                {sectionName}
                                            </h3>
                                            <svg
                                                className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                                                    isExpanded ? 'rotate-180' : ''
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    )}
                                    {(isCore || isExpanded) && (
                                        <div className={`space-y-1 transition-all duration-200 ${isCore ? '' : 'overflow-hidden'}`}>
                                            {items.map((item) => (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={() => {
                                                        if (isMobile) setSidebarOpen(false);
                                                        // Auto-expand section when clicking an item (accordion behavior)
                                                        if (item.section && !isCore) {
                                                            setExpandedSection(item.section);
                                                        }
                                                    }}
                                                    className={`
                                                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                                                        transition-all duration-200
                                                        ${isActive(item.path)
                                                            ? 'bg-primary-main text-white shadow-md'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }
                                                    `}
                                                >
                                                    {item.icon}
                                                    <span>{item.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </nav>

                {/* User Section - Following Laws of UX: Progressive Disclosure & Contextual Information */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    {currentUser && (
                        <div className="group relative">
                            {/* Compact User Avatar - Shows on hover/click (Progressive Disclosure) */}
                            <button
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                aria-label="User account menu"
                                title={`${currentUser.email} (${currentUser.role})`}
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-main to-info-main flex items-center justify-center text-white text-sm font-semibold shadow-md flex-shrink-0">
                                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Show only name/username, not full email (Hick's Law - Reduce Information) */}
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {currentUser.email?.split('@')[0] || 'User'}
                                    </p>
                                    {/* Role badge - Only show if admin (Contextual Information) */}
                                    {currentUser.role === 'admin' && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <svg className="w-3 h-3 text-warning-main" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                Administrator
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {/* Dropdown Menu - Appears on hover/focus (Progressive Disclosure) */}
                            <div className="absolute bottom-full left-0 right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]">
                                    {/* Full email shown in dropdown (Contextual - only when needed) */}
                                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Signed in as</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {currentUser.email}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                                            {currentUser.role} account
                                        </p>
                                    </div>
                                    
                                    {/* Account Actions */}
                                    <div className="py-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-left"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Sign out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {filteredNavItems.find(i => isActive(i.path))?.label || 'Dashboard'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {filteredNavItems.find(i => isActive(i.path))?.section && (
                                    <span className="capitalize">{filteredNavItems.find(i => isActive(i.path))?.section} • </span>
                                )}
                                {location.pathname === '/' && 'Overview and quick actions'}
                                {location.pathname === '/inference' && 'Interact with AI models'}
                                {location.pathname === '/prompts' && 'Manage prompt templates'}
                                {location.pathname === '/prompt-optimization' && 'Optimize prompts for performance'}
                                {location.pathname === '/tokens' && 'Manage API tokens'}
                                {location.pathname === '/telemetry' && 'View analytics and logs'}
                                {location.pathname === '/workspaces' && 'Manage workspaces'}
                                {location.pathname === '/projects' && 'Manage projects'}
                                {location.pathname === '/permissions' && 'Manage permissions'}
                                {location.pathname === '/compliance' && 'Compliance reports'}
                                {location.pathname === '/data-residency' && 'Data residency controls'}
                                {location.pathname === '/dlp' && 'Data loss prevention'}
                                {location.pathname === '/budgets' && 'Budget management'}
                                {location.pathname === '/cost-forecasting' && 'Cost forecasting'}
                                {location.pathname === '/optimization-recommendations' && 'Optimization recommendations'}
                                {location.pathname === '/provider-health' && 'Provider health monitoring'}
                                {location.pathname === '/provider-comparison' && 'Compare providers'}
                                {location.pathname === '/ab-testing' && 'A/B testing'}
                                {location.pathname === '/model-abstraction' && 'Model abstraction'}
                                {location.pathname === '/smart-routing' && 'Smart routing rules'}
                                {location.pathname === '/failover' && 'Failover configuration'}
                                {location.pathname === '/queue-management' && 'Queue management'}
                                {location.pathname === '/circuit-breakers' && 'Circuit breakers'}
                                {location.pathname === '/load-balancing' && 'Load balancing'}
                                {location.pathname === '/sdks' && 'SDKs and integration'}
                                {location.pathname === '/webhooks' && 'Webhook management'}
                                {location.pathname === '/evaluation' && 'Evaluation test suites'}
                                {location.pathname === '/users' && 'User management'}
                                {location.pathname === '/security-audit' && 'Security event logs'}
                                {location.pathname === '/admin' && 'Administrative controls'}
                                {location.pathname === '/security-compliance' && 'Manage compliance and data residency'}
                                {location.pathname === '/cost-optimization' && 'Monitor budgets and spending'}
                                {location.pathname === '/provider-intelligence' && 'Compare provider health and performance'}
                                {location.pathname === '/reliability' && 'System stability and circuit breakers'}
                                {location.pathname === '/developer-settings' && 'Webhooks and API configuration'}
                            </p>
                        </div>
                    </div>
                    <ModeToggle />
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        {branding.footerText || `${branding.productName} by ${branding.companyName}`}
                    </p>
                </footer>
            </div>
        </div>
    );
}
