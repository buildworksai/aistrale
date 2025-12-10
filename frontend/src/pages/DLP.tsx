import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface DLPRule {
    id: number;
    name: string;
    pattern: string;
    action: string;
    is_active: boolean;
    priority: number;
}

interface Violation {
    rule_name: string;
    violation_type: string;
    message: string;
}

export default function DLP() {
    const [rules, setRules] = useState<DLPRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testText, setTestText] = useState('');
    const [testResult, setTestResult] = useState<{ redacted_text: string; is_blocked: boolean; violations: string[] } | null>(null);
    const [testing, setTesting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [pattern, setPattern] = useState('');
    const [action, setAction] = useState<'block' | 'redact' | 'warn'>('warn');
    const [isActive, setIsActive] = useState(true);
    const [priority, setPriority] = useState(0);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/dlp/rules');
            setRules(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch DLP rules');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !pattern.trim()) {
            setError('Rule name and pattern are required');
            return;
        }

        // Validate regex pattern
        try {
            new RegExp(pattern);
        } catch (err) {
            setError('Invalid regex pattern');
            return;
        }

        try {
            setCreating(true);
            setError('');
            await api.post('/api/dlp/rules', {
                name,
                pattern,
                action,
                is_active: isActive,
                priority,
            });
            setIsCreateModalOpen(false);
            setName('');
            setPattern('');
            setAction('warn');
            setIsActive(true);
            setPriority(0);
            fetchRules();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create DLP rule');
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id: number, currentState: boolean) => {
        try {
            await api.patch(`/api/dlp/rules/${id}`, { is_active: !currentState });
            fetchRules();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to update rule');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this DLP rule? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/api/dlp/rules/${id}`);
            fetchRules();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to delete rule');
        }
    };

    const handleTest = async () => {
        if (!testText.trim()) {
            setError('Please enter text to test');
            return;
        }

        try {
            setTesting(true);
            setError('');
            const res = await api.post('/api/dlp/redact', { text: testText });
            setTestResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to test pattern');
        } finally {
            setTesting(false);
        }
    };

    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Data Loss Prevention</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage DLP rules and protect sensitive data</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsTestModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Test Pattern
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                            aria-label="Create DLP rule"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Rule
                        </button>
                    </div>
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

                {/* DLP Rules List */}
                {!loading && rules.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Rule Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Pattern
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-h-[44px]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {sortedRules.map(rule => (
                                        <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {rule.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-mono text-xs">
                                                {rule.pattern}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    rule.action === 'block'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        : rule.action === 'redact'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                }`}>
                                                    {rule.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {rule.priority}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggle(rule.id, rule.is_active)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 ${
                                                        rule.is_active ? 'bg-primary-main' : 'bg-gray-200 dark:bg-gray-600'
                                                    }`}
                                                    aria-label={`Toggle rule ${rule.name}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                            rule.is_active ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                    aria-label={`Delete rule ${rule.name}`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && rules.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No DLP rules found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first DLP rule</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 transition-colors min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Rule
                        </button>
                    </div>
                )}

                {/* Create Rule Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create DLP Rule</h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setName('');
                                        setPattern('');
                                        setAction('warn');
                                        setIsActive(true);
                                        setPriority(0);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label htmlFor="rule-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Rule Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="rule-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        placeholder="Block Auth Tokens"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label htmlFor="rule-pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Regex Pattern <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="rule-pattern"
                                        value={pattern}
                                        onChange={(e) => setPattern(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main font-mono text-sm min-h-[44px]"
                                        placeholder="(sk-[a-zA-Z0-9]{20,})"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Enter a valid regular expression pattern
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="rule-action" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Action <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="rule-action"
                                        value={action}
                                        onChange={(e) => setAction(e.target.value as 'block' | 'redact' | 'warn')}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                        required
                                    >
                                        <option value="warn">Warn</option>
                                        <option value="redact">Redact</option>
                                        <option value="block">Block</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="rule-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Priority
                                        </label>
                                        <input
                                            type="number"
                                            id="rule-priority"
                                            value={priority}
                                            onChange={(e) => setPriority(Number(e.target.value))}
                                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-main focus:border-primary-main min-h-[44px]"
                                            min="0"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={(e) => setIsActive(e.target.checked)}
                                                className="w-5 h-5 text-primary-main border-gray-300 rounded focus:ring-primary-main"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setName('');
                                            setPattern('');
                                            setAction('warn');
                                            setIsActive(true);
                                            setPriority(0);
                                        }}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !name.trim() || !pattern.trim()}
                                        className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {creating ? 'Creating...' : 'Create Rule'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Test Pattern Modal */}
                {isTestModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsTestModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Test DLP Pattern</h2>
                                <button
                                    onClick={() => {
                                        setIsTestModalOpen(false);
                                        setTestText('');
                                        setTestResult(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="test-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Test Text
                                    </label>
                                    <textarea
                                        id="test-text"
                                        value={testText}
                                        onChange={(e) => setTestText(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-main focus:border-primary-main min-h-[120px]"
                                        placeholder="Enter text to test against all DLP rules..."
                                    />
                                </div>

                                <button
                                    onClick={handleTest}
                                    disabled={testing || !testText.trim()}
                                    className="w-full px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                >
                                    {testing ? 'Testing...' : 'Test Pattern'}
                                </button>

                                {testResult && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Result
                                            </label>
                                            <div className={`p-4 rounded-lg ${
                                                testResult.is_blocked
                                                    ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                                                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                            }`}>
                                                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                                    {testResult.redacted_text}
                                                </p>
                                            </div>
                                        </div>
                                        {testResult.violations.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Violations ({testResult.violations.length})
                                                </label>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {testResult.violations.map((violation, idx) => (
                                                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                                            {violation}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {testResult.is_blocked && (
                                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                                    ⚠️ Content blocked by DLP rules
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

