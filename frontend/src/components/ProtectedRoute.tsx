import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../lib/api';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await api.get('/api/auth/me');
                setIsAuthenticated(true);
            } catch (error: any) {
                // If 401, user is not authenticated
                if (error.response?.status === 401) {
                    setIsAuthenticated(false);
                } else {
                    // For other errors, assume not authenticated to be safe
                    setIsAuthenticated(false);
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login with return URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

