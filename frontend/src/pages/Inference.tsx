import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

interface Token {
    id: number;
    provider: string;
    label: string;
    is_default: boolean;
}

export default function Inference() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [selectedTokenId, setSelectedTokenId] = useState<number | ''>('');
    const [model, setModel] = useState('');
    const [input, setInput] = useState(''); // Renamed from inputText
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hfProvider, setHfProvider] = useState('auto');
    const [task, setTask] = useState('auto');
    const [chatHistory, setChatHistory] = useState<any[]>([]); // New state for chat history
    const chatHistoryEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchTokens = async () => {
            const res = await api.get('/api/tokens/');
            setTokens(res.data);

            // Auto-select default token if no token is currently selected
            const defaultToken = res.data.find((t: Token) => t.is_default);
            if (defaultToken && !selectedTokenId) {
                setSelectedTokenId(defaultToken.id);
            }
        };
        fetchTokens();
        fetchChatHistory(); // Fetch chat history on component mount
    }, []);

    const fetchChatHistory = async () => {
        try {
            const res = await api.get('/api/inference/history');
            setChatHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    // Auto-scroll to bottom when chat history or loading state changes
    useEffect(() => {
        // Use setTimeout to ensure DOM has updated
        const timer = setTimeout(() => {
            if (chatHistoryEndRef.current) {
                chatHistoryEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [chatHistory, loading]);

    const handleClearHistory = async () => {
        try {
            await api.delete('/api/inference/history');
            setChatHistory([]);
            setResult(null); // Clear any displayed non-text result
        } catch (err) {
            console.error("Failed to clear history", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTokenId) {
            setError('Please select a token');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null); // Clear previous non-text result

        // Optimistic update for user message
        const newMessage = { role: 'user', content: input };
        setChatHistory(prev => [...prev, newMessage]);

        try {
            const selectedToken = tokens.find(t => t.id === Number(selectedTokenId));
            if (!selectedToken) {
                throw new Error("Please select a token");
            }

            const res = await api.post('/api/inference/run', {
                provider: selectedToken.provider,
                model: model,
                input_text: input, // Use 'input' state
                token_id: selectedToken.id,
                hf_provider: hfProvider,
                task: task
            });

            setResult(res.data.result);

            // Add assistant's response to history if it's a string
            if (typeof res.data.result === 'string') {
                setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.result }]);
            } else {
                // If it's not a string (e.g., binary data), we might want to add a placeholder or handle differently
                // For now, we'll just display it in the dedicated result area below the chat
                setChatHistory(prev => [...prev, { role: 'assistant', content: `[${res.data.result.mime_type || 'Binary data'}]` }]);
            }

        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'An error occurred');
            // If an error occurs, remove the optimistic user message
            setChatHistory(prev => prev.slice(0, prev.length - 1));
        } finally {
            setLoading(false);
            setInput(''); // Clear input after send
        }
    };

    return (
        <Layout>
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                {/* Main Chat Interface */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="p-3 flex flex-col flex-1 min-h-0">
                        {/* Configuration Panel */}
                        <div className="mb-3 flex-shrink-0 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Token (Provider) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="inference_token"
                                        value={selectedTokenId}
                                        onChange={(e) => setSelectedTokenId(Number(e.target.value))}
                                        className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main text-sm px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                        required
                                    >
                                        <option value="">Select a token</option>
                                        {tokens.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.label} ({t.provider}){t.is_default ? ' - Default' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Model
                                    </label>
                                    <input
                                        name="inference_model"
                                        type="text"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        placeholder="e.g. gpt-3.5-turbo, meta-llama/Llama-2-7b-chat-hf"
                                        className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main text-sm px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        HF Provider
                                    </label>
                                    <select
                                        name="hf_provider"
                                        value={hfProvider}
                                        onChange={(e) => setHfProvider(e.target.value)}
                                        className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main text-sm px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="fal-ai">fal.ai</option>
                                        <option value="replicate">Replicate</option>
                                        <option value="sambanova">SambaNova</option>
                                        <option value="together">Together</option>
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Task
                                    </label>
                                    <select
                                        name="inference_task"
                                        value={task}
                                        onChange={(e) => setTask(e.target.value)}
                                        className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main text-sm px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="text-generation">Text Generation</option>
                                        <option value="text-to-image">Text to Image</option>
                                        <option value="text-to-video">Text to Video</option>
                                        <option value="chat-completion">Chat Completion</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Chat History Display */}
                        <div className="mb-3 flex flex-col flex-1 min-h-0">
                            <div className="flex justify-between items-center mb-1 flex-shrink-0">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat History</h4>
                                <button
                                    onClick={handleClearHistory}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Clear
                                </button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-2 bg-gray-50 dark:bg-gray-900/30">
                            {chatHistory.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start a conversation by sending a message below</p>
                                </div>
                            )}
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-main flex items-center justify-center text-white text-xs font-medium">
                                            AI
                                        </div>
                                    )}
                                    <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-lg px-3 py-1.5 shadow-sm ${msg.role === 'user'
                                                ? 'bg-primary-main text-white rounded-br-none'
                                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 px-1">
                                            {msg.role === 'user' ? 'You' : 'Assistant'}
                                        </span>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-medium">
                                            U
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-2 justify-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-main flex items-center justify-center text-white text-xs font-medium">
                                        AI
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg rounded-bl-none px-3 py-1.5 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Invisible element to scroll to */}
                            <div ref={chatHistoryEndRef} />
                            </div>
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSubmit} className="space-y-2 flex-shrink-0" autoComplete="off">
                            <div className="flex flex-col">
                                <label htmlFor="inference_input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <textarea
                                        id="inference_input"
                                        name="inference_input"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        rows={4}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-main focus:ring-primary-main text-sm px-3 py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors"
                                        placeholder="Type your message here..."
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Enter</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Shift</kbd> for new line
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-main hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-start gap-3">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="font-medium">Error</p>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Result Display for non-text results (images/videos) */}
                {result && typeof result !== 'string' && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generated Result</h4>
                        </div>
                        <div className="p-6">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto">
                                {result.binary_data ? (
                                    <div className="flex flex-col items-center">
                                        {result.mime_type?.startsWith('video') ? (
                                            <video controls className="max-w-full h-auto mb-4 rounded-lg shadow-lg">
                                                <source src={`data:${result.mime_type};base64,${result.binary_data}`} type={result.mime_type} />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : (
                                            <img
                                                src={`data:${result.mime_type || 'image/png'};base64,${result.binary_data}`}
                                                alt="Generated result"
                                                className="max-w-full h-auto mb-4 rounded-lg shadow-lg object-contain"
                                            />
                                        )}
                                        <a
                                            href={`data:${result.mime_type};base64,${result.binary_data}`}
                                            download={`output.${result.mime_type?.split('/')[1] || 'bin'}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-main hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download {result.mime_type?.startsWith('image') ? 'Image' : 'Video'}
                                        </a>
                                    </div>
                                ) : (
                                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
