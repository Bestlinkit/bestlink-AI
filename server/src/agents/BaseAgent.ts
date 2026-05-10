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

  protected async *streamAsk(prompt: string, model?: string, attachments?: any[]) {
    const userContent: any[] = [{ type: 'text', text: prompt }];
    
    attachments?.forEach(file => {
      if (file.mimetype?.startsWith('image/')) {
        // OpenRouter expects image_url with either a public URL or a data URI
        userContent.push({
          type: 'image_url',
          image_url: { url: file.path }
        });
      } else if (file.mimetype?.startsWith('text/')) {
        // Append text file content to the prompt
        userContent[0].text += `\n\nReference File (${file.originalName}):\n${file.content || '[Text content not available]'}`;
      }
    });

    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userContent.length > 1 ? userContent : prompt }
    ];

    yield* openRouterService.streamChat(messages, model);
  }
}
