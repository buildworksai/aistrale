import axios, { AxiosInstance } from 'axios';

interface RunOptions {
    model?: string;
    provider?: string;
    [key: string]: any;
}

export class Aistrale {
    private apiKey: string;
    private apiUrl: string;
    private client: AxiosInstance;

    constructor(apiKey?: string, apiUrl?: string) {
        this.apiKey = apiKey || process.env.AISTRALE_API_KEY || '';
        this.apiUrl = apiUrl || process.env.AISTRALE_API_URL || 'http://localhost:8000/api';
        
        this.client = axios.create({
            baseURL: this.apiUrl,
            timeout: 60000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async run(prompt: string, options: RunOptions = {}): Promise<any> {
        const { model = "gpt-3.5-turbo", provider = "openai", ...kwargs } = options;

        if (process.env.AISTRALE_TEST_MODE) {
             return {
                id: "mock-id",
                object: "chat.completion",
                choices: [{ message: { role: "assistant", content: `Mock TS response for: ${prompt}` } }],
                usage: { total_tokens: 10 }
            };
        }

        try {
            const response = await this.client.post('/v1/inference/chat', {
                model,
                provider,
                messages: [{ role: "user", content: prompt }],
                ...kwargs
            });
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                 // Simplified error handling
                 return { error: error.message, status: error.response?.status };
            }
            throw error;
        }
    }
}
