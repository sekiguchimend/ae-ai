/**
 * Streaming Response Handler for LLM APIs
 * Handles streaming responses from OpenAI and Claude APIs
 */

export interface StreamChunk {
  type: 'text' | 'code' | 'error' | 'done';
  content: string;
  codeLanguage?: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: StreamChunk) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

/**
 * Parse OpenAI streaming response
 */
export async function parseOpenAIStream(
  response: Response,
  callbacks: StreamCallbacks
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullResponse = '';
  let buffer = '';
  let inCodeBlock = false;
  let codeLanguage = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        callbacks.onChunk({ type: 'done', content: '' });
        callbacks.onComplete(fullResponse);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';

            if (content) {
              fullResponse += content;

              // Detect code blocks
              if (content.includes('```')) {
                const matches = content.match(/```(\w*)/);
                if (matches && !inCodeBlock) {
                  inCodeBlock = true;
                  codeLanguage = matches[1] || 'javascript';
                } else if (inCodeBlock) {
                  inCodeBlock = false;
                  codeLanguage = '';
                }
              }

              callbacks.onChunk({
                type: inCodeBlock ? 'code' : 'text',
                content,
                codeLanguage: inCodeBlock ? codeLanguage : undefined,
              });
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

/**
 * Parse Claude streaming response
 */
export async function parseClaudeStream(
  response: Response,
  callbacks: StreamCallbacks
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullResponse = '';
  let buffer = '';
  let inCodeBlock = false;
  let codeLanguage = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        callbacks.onChunk({ type: 'done', content: '' });
        callbacks.onComplete(fullResponse);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);

            // Handle different Claude event types
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text || '';

              if (content) {
                fullResponse += content;

                // Detect code blocks
                if (content.includes('```')) {
                  const matches = content.match(/```(\w*)/);
                  if (matches && !inCodeBlock) {
                    inCodeBlock = true;
                    codeLanguage = matches[1] || 'javascript';
                  } else if (inCodeBlock) {
                    inCodeBlock = false;
                    codeLanguage = '';
                  }
                }

                callbacks.onChunk({
                  type: inCodeBlock ? 'code' : 'text',
                  content,
                  codeLanguage: inCodeBlock ? codeLanguage : undefined,
                });
              }
            } else if (parsed.type === 'message_stop') {
              // Message complete
            } else if (parsed.type === 'error') {
              callbacks.onError(new Error(parsed.error?.message || 'Unknown error'));
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

/**
 * Create a streaming request to the AI endpoint
 */
export async function streamAIResponse(
  endpoint: string,
  payload: Record<string, unknown>,
  callbacks: StreamCallbacks,
  provider: 'openai' | 'claude' = 'openai'
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = new Error(`API error: ${response.status}`);
    callbacks.onError(error);
    throw error;
  }

  if (provider === 'claude') {
    return parseClaudeStream(response, callbacks);
  }

  return parseOpenAIStream(response, callbacks);
}
