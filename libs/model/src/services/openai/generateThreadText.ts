import { OpenAI } from 'openai';
import { config } from '../../config';

const THREAD_AI_PROMPTS_CONFIG = {
  thread: (userText?: string) => `
      Please generate a thoughtful thread${userText ? ' based on the following context: ' + userText : ''}. 
      The thread should be insightful, well-structured, and engaging. It should present a clear topic and invite discussion.
      Please provide the thread text only. Do not summarize the context, rather use it as a starting point for the thread.
    `,
};

const ThreadErrors = {
  OpenAINotConfigured: 'OpenAI key not configured',
  OpenAIInitFailed: 'OpenAI initialization failed',
  RequestFailed: 'failed to generate thread',
};

const generateThreadText = async function* ({
  userText,
}: {
  userText?: string;
}): AsyncGenerator<
  string | { error: (typeof ThreadErrors)[keyof typeof ThreadErrors] },
  void,
  unknown
> {
  const useOpenRouter = config.OPENAI.USE_OPENROUTER === 'true';
  const apiKey = useOpenRouter
    ? config.OPENAI.OPENROUTER_API_KEY
    : config.OPENAI.API_KEY;

  if (!apiKey) {
    yield { error: ThreadErrors.OpenAINotConfigured };
    return;
  }

  let openai: OpenAI;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openAIConfig: any = {
      apiKey,
    };

    if (useOpenRouter) {
      openAIConfig.baseURL = 'https://openrouter.ai/api/v1';
    } else if (config.OPENAI.ORGANIZATION) {
      openAIConfig.organization = config.OPENAI.ORGANIZATION;
    }

    openai = new OpenAI(openAIConfig);
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    yield { error: ThreadErrors.OpenAIInitFailed };
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createCompletionConfig: any = {
      model: useOpenRouter ? 'anthropic/claude-3.5-sonnet' : 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: THREAD_AI_PROMPTS_CONFIG.thread(userText),
        },
      ],
      stream: true,
    };

    if (useOpenRouter) {
      createCompletionConfig.extra_headers = {
        'HTTP-Referer': 'https://common.xyz',
        'X-Title': 'Common',
      };
    }

    const stream = await openai.chat.completions.create(createCompletionConfig);

    if (stream.choices) {
      const content = stream.choices[0]?.message?.content || '';
      if (content) {
        yield content;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of stream as any) {
        try {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        } catch (chunkError) {
          console.error('Error processing chunk:', chunkError);
        }
      }
    }
  } catch (e) {
    console.error('Error in OpenAI stream:', e);
    yield { error: ThreadErrors.RequestFailed };
  }
};

export { generateThreadText };
