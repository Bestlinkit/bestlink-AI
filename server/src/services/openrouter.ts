import dotenv from 'dotenv';
import axios from 'axios';
import { FALLBACK_ORDER } from "../shared/models";

dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const openRouterService = {
  async streamChat(
    messages: any[],
    model: string = 'openrouter/free',
    options: any = {},
    onChunk: (chunk: any) => void
  ): Promise<void> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    // Attempt streaming with the selected model
    try {
      await this.executeRequest(messages, model, options, apiKey, onChunk);
    } catch (error: any) {
      console.warn(`Model ${model} failed, attempting fallback...`, error.message);
      
      // Fallback logic
      for (const fallbackModel of FALLBACK_ORDER) {
        if (fallbackModel === model) continue;
        
        try {
          console.log(`Trying fallback model: ${fallbackModel}`);
          await this.executeRequest(messages, fallbackModel, options, apiKey, onChunk);
          return; // Success!
        } catch (fallbackError: any) {
          console.warn(`Fallback model ${fallbackModel} also failed:`, fallbackError.message);
        }
      }
      
      throw new Error('All available AI models failed to respond. Please try again later.');
    }
  },

  async chat(
    messages: any[],
    model: string = 'openrouter/free',
    options: any = {}
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://bestlink-digital-ai.local',
        'X-Title': 'Bestlink Digital AI',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  },

  async *streamChatGenerator(
    messages: any[],
    model: string = 'openrouter/free',
    options: any = {}
  ): AsyncGenerator<any> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

    let currentModel = model;
    let fallbackIndex = 0;

    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s max timeout

      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://bestlink-digital-ai.local',
            'X-Title': 'Bestlink Digital AI',
          },
          body: JSON.stringify({
            model: currentModel,
            messages,
            stream: true,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 4000,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API Error ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is null');

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) return; // Exit generator when done successfully

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                yield parsed;
              } catch (e) {}
            }
          }
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.warn(`Model ${currentModel} failed:`, error.message);
        if (fallbackIndex < FALLBACK_ORDER.length) {
          currentModel = FALLBACK_ORDER[fallbackIndex];
          console.log(`Retrying with fallback model: ${currentModel}`);
          fallbackIndex++;
        } else {
          throw new Error('All available AI models failed to respond. Please try again later.');
        }
      }
    }

  },

  async executeRequest(
    messages: any[],
    model: string,
    options: any,
    apiKey: string,
    onChunk: (chunk: any) => void
  ) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://bestlink-digital-ai.local',
          'X-Title': 'Bestlink Digital AI',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 4000,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');


      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              onChunk(parsed);
            } catch (e) {
              // Ignore incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
};
