import { Aistrale } from '../src/client';

describe('Aistrale TS Client', () => {
    beforeAll(() => {
        process.env.AISTRALE_TEST_MODE = 'true';
    });

    test('should run inference', async () => {
        const client = new Aistrale('sk-test');
        const response = await client.run('Hello TS');

        expect(response.choices[0].message.content).toContain('Mock TS response');
        expect(response.choices[0].message.content).toContain('Hello TS');
    });
});
