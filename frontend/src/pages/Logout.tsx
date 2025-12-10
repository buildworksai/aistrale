import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await api.post('/api/auth/logout');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                // Always redirect to login, even if logout API call fails
                // Clear any cached state by doing a full redirect
                window.location.href = '/login';
            }
        };

        performLogout();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Logging out...</p>
            </div>
        </div>
    );
}

