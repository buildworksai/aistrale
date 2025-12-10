import axios from 'axios';

// Base API URL - assumes proxy or direct connection
// Base API URL - assumes proxy or direct connection
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:16000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

export interface AuditLog {
    id: number;
    timestamp: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details: string;
}

export const securityService = {
    redactPii: async (text: string): Promise<string> => {
        const res = await api.post('/api/dlp/redact', { text });
        return res.data.redacted_text;
    },
    getAuditLogs: async (): Promise<AuditLog[]> => {
        const res = await api.get('/api/security-audit/');
        return res.data;
    },
    dispatchGdprRequest: async (userId: string) => {
        const res = await api.post('/api/compliance/gdpr-export', { user_id: userId });
        return res.data;
    }
};

export const costService = {
    getBudget: async () => {
        const res = await api.get('/api/cost/budget');
        return res.data;
    }
};

export const providerService = {
    getHealth: async () => {
        const res = await api.get('/api/multi-provider/health');
        return res.data;
    },
    compare: async (p1: string, p2: string, metric: string) => {
        const res = await api.post(`/api/multi-provider/compare?provider1=${p1}&provider2=${p2}&metric=${metric}`);
        return res.data;
    }
};

export const reliabilityService = {
    getCircuitBreaker: async (provider: string) => {
        const res = await api.get(`/api/reliability/circuit-breakers/${provider}`);
        return res.data;
    },
    simulateFailure: async (provider: string) => {
        const res = await api.post(`/api/reliability/circuit-breakers/${provider}/simulate-failure`);
        return res.data;
    }
};

export const webhookService = {
    dispatchTest: async (workspaceId: number, eventType: string, payload: any) => {
        const res = await api.post('/api/webhooks/dispatch-test', {
            workspace_id: workspaceId,
            event_type: eventType,
            payload
        });
        return res.data;
    }
};
