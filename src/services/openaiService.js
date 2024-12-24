import OpenAI from 'openai';
import config from '../config/env.js';

const client = new OpenAI({
    apiKey: config.CHATGPT_API_KEY,
});

const openAiservice = async (message) => {
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Comportarte como un veterinario. Responde en texto plano, como si fuera una conversación por WhatsApp. No saludes, solo responde a las preguntas.' },
                { role: 'user', content: message }
            ],
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
        return "Sorry, I couldn't process your request.";
    }
}

export default openAiservice;