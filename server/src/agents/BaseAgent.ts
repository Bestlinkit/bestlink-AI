import { openRouterService } from '../services/openrouter';

export abstract class BaseAgent {
  constructor(
    public name: string,
    public role: string,
    public systemPrompt: string
  ) {}

  protected async ask(prompt: string, model?: string) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ];
    
    return openRouterService.chat(messages, model);
  }

  protected async *streamAsk(prompt: string, model?: string) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ];

    yield* openRouterService.streamChatGenerator(messages, model);
  }
}
