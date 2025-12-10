import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Budget {
    id: number;
    workspace_id: number;
    project_id: number | null;
    amount: number;
    period: string;
    alert_thresholds: { warning?: number; critical?: number };
    created_at: string;
}

interface Workspace {
    id: number;
    name: string;
}

export default function Budgets() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);

    // Form state
    const [workspaceId, setWorkspaceId] = useState<number | ''>('');
    const [projectId, setProjectId] = useState<number | ''>('');
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState('monthly');
    const [warningThreshold, setWarningThreshold] = useState(80);
    const [criticalThreshold, setCriticalThreshold] = useState(100);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchBudgets();
        fetchWorkspaces();
    }, []);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/cost/budgets/');
            setBudgets(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch budgets';
            setError(errorMsg);
            setBudgets([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkspaces = async () => {
        try {
            const res = await api.get('/api/workspaces/');
            setWorkspaces(res.data);
            if (res.data.length > 0) {
                setWorkspaceId(res.data[0].id);
            }
        } catch (err: any) {
            console.error('Failed to fetch workspaces:', err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId || !amount) {
            setError('Workspace and amount are required');
            return;
        }

        try {
            setCreating(true);
            setError('');
            await api.post('/api/cost/budgets/', {
                workspace_id: workspaceId,
                project_id: projectId || null,
                amount: Number(amount),
                period,
                alert_thresholds: {
                    warning: warningThreshold,
                    critical: criticalThreshold,
                },
            });
            setIsCreateModalOpen(false);
            setWorkspaceId('');
            setProjectId('');
            setAmount('');
            setPeriod('monthly');
            setWarningThreshold(80);
            setCriticalThreshold(100);
            setWizardStep(1);
            fetchBudgets();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create budget');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this budget? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/api/cost/budgets/${id}`);
            fetchBudgets();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete budget');
        }
    };

    const getBudgetStatus = (budget: Budget) => {
        // In real app, calculate from actual spend
        const spent = 0; // Would come from telemetry
        const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        if (percentUsed >= (budget.alert_thresholds?.critical || 100)) {
            return { status: 'critical', color: 'red' };
        } else if (percentUsed >= (budget.alert_thresholds?.warning || 80)) {
            return { status: 'warning', color: 'yellow' };
        }
        return { status: 'healthy', color: 'green' };
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Budgets</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage budgets and spending limits</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        aria-label="Create budget"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Budget
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm flex-1">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Dismiss error"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading budgets...</p>
                    </div>
                )}

                {/* Budgets List */}
                {!loading && budgets.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budgets.map(budget => {
                            const status = getBudgetStatus(budget);
                            const workspace = workspaces.find(w => w.id === budget.workspace_id);
                            return (
                                <div
                                    key={budget.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                ${budget.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {workspace?.name || `Workspace ${budget.workspace_id}`} • {budget.period}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            status.color === 'red'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                : status.color === 'yellow'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        }`}>
                                            {status.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Warning Threshold:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {budget.alert_thresholds?.warning || 80}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Critical Threshold:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {budget.alert_thresholds?.critical || 100}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            Created {new Date(budget.created_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(budget.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                            aria-label={`Delete budget ${budget.id}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!loading && budgets.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No budgets found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first budget</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Budget
                        </button>
                    </div>
                )}

                {/* Create Budget Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Budget</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setWorkspaceId('');
                                        setProjectId('');
                                        setAmount('');
                                        setPeriod('monthly');
                                        setWarningThreshold(80);
                                        setCriticalThreshold(100);
                                        setWizardStep(1);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Wizard Steps Indicator */}
                            <div className="mb-6">
                                <div className="flex items-center">
                                    <div className={`flex items-center ${wizardStep >= 1 ? 'text-primary-main' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${wizardStep >= 1 ? 'border-primary-main bg-primary-main text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {wizardStep > 1 ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span>1</span>
                                            )}
                                        </div>
                                        <span className="ml-2 text-sm font-medium">Basic Info</span>
                                    </div>
                                    <div className={`flex-1 h-0.5 mx-4 ${wizardStep >= 2 ? 'bg-primary-main' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <div className={`flex items-center ${wizardStep >= 2 ? 'text-primary-main' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${wizardStep >= 2 ? 'border-primary-main bg-primary-main text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {wizardStep > 2 ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span>2</span>
                                            )}
                                        </div>
                                        <span className="ml-2 text-sm font-medium">Thresholds</span>
                                    </div>
                                    <div className={`flex-1 h-0.5 mx-4 ${wizardStep >= 3 ? 'bg-primary-main' : 'bg-gray-300 dark:border-gray-600'}`}></div>
                                    <div className={`flex items-center ${wizardStep >= 3 ? 'text-primary-main' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${wizardStep >= 3 ? 'border-primary-main bg-primary-main text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                            <span>3</span>
                                        </div>
                                        <span className="ml-2 text-sm font-medium">Review</span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                {wizardStep === 1 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="budget-workspace" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Workspace <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                id="budget-workspace"
                                                value={workspaceId}
                                                onChange={(e) => setWorkspaceId(e.target.value ? Number(e.target.value) : '')}
                                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                                required
                                            >
                                                <option value="">Select a workspace</option>
                                                {workspaces.map(ws => (
                                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Budget Amount <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 dark:text-gray-400">$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    id="budget-amount"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="block w-full pl-7 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                                    placeholder="1000.00"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="budget-period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Period
                                            </label>
                                            <select
                                                id="budget-period"
                                                value={period}
                                                onChange={(e) => setPeriod(e.target.value)}
                                                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setWizardStep(2)}
                                                disabled={!workspaceId || !amount}
                                                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="warning-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Warning Threshold (%)
                                            </label>
                                            <input
                                                type="range"
                                                id="warning-threshold"
                                                value={warningThreshold}
                                                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                                                min="0"
                                                max="100"
                                                step="5"
                                                className="block w-full h-11"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <span>0%</span>
                                                <span className="font-medium text-primary-main">{warningThreshold}%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="critical-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Critical Threshold (%)
                                            </label>
                                            <input
                                                type="range"
                                                id="critical-threshold"
                                                value={criticalThreshold}
                                                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                                                min="0"
                                                max="100"
                                                step="5"
                                                className="block w-full h-11"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <span>0%</span>
                                                <span className="font-medium text-primary-main">{criticalThreshold}%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setWizardStep(1)}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWizardStep(3)}
                                                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Budget Summary</h3>
                                            <dl className="space-y-2">
                                                <div className="flex justify-between">
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Workspace:</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-gray-100">
                                                        {workspaces.find(w => w.id === workspaceId)?.name || `Workspace ${workspaceId}`}
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Amount:</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-gray-100">
                                                        ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Period:</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-gray-100 capitalize">{period}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Warning:</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-gray-100">{warningThreshold}%</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Critical:</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-gray-100">{criticalThreshold}%</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        <div className="flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setWizardStep(2)}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={creating || !workspaceId || !amount}
                                                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                            >
                                                {creating ? 'Creating...' : 'Create Budget'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

