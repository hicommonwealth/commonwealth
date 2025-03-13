import { OpenAI } from 'openai';
import { config } from '../../config';

const COMMENT_AI_PROMPTS_CONFIG = {
  comment: (userText?: string) => `
      Please generate a thoughtful comment to add to the thread${userText ? ': ' + userText : ''}. 
      The comment should be insightful, friendly, and a bit humorous. Please provide the comment text only.
    `,
};

const CommentErrors = {
  OpenAINotConfigured: 'OpenAI key not configured',
  OpenAIInitFailed: 'OpenAI initialization failed',
  RequestFailed: 'failed to generate comment',
};

const generateCommentText = async function* ({
  userText,
}: {
  userText?: string;
}): AsyncGenerator<
  string | { error: (typeof CommentErrors)[keyof typeof CommentErrors] },
  void,
  unknown
> {
  const useOpenRouter = config.OPENAI.USE_OPENROUTER === 'true';
  const apiKey = useOpenRouter
    ? config.OPENAI.OPENROUTER_API_KEY
    : config.OPENAI.API_KEY;

  if (!apiKey) {
    yield { error: CommentErrors.OpenAINotConfigured };
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
    yield { error: CommentErrors.OpenAIInitFailed };
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createCompletionConfig: any = {
      model: useOpenRouter ? 'anthropic/claude-3.5-sonnet' : 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: COMMENT_AI_PROMPTS_CONFIG.comment(userText),
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
    yield { error: CommentErrors.RequestFailed };
  }
};

export { generateCommentText };
