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
  modelId,
}: {
  userText?: string;
  modelId?: string;
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
    // Use provided modelId or fallback to default models
    const model =
      modelId ||
      (useOpenRouter ? 'anthropic/claude-3.5-sonnet' : 'openai/o3-mini');

    const createCompletionConfig: any = {
      model,
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

    try {
      const response = await openai.chat.completions.create(
        createCompletionConfig,
      );

      // @ts-ignore - OpenAI SDK types might not properly reflect the stream capability
      for await (const chunk of response) {
        try {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        } catch (chunkError) {
          console.error('Error processing chunk:', chunkError);
        }
      }
    } catch (streamError) {
      console.error('Error in streaming response:', streamError);
      yield { error: CommentErrors.RequestFailed };
    }
  } catch (e) {
    console.error('Error in OpenAI stream:', e);
    yield { error: CommentErrors.RequestFailed };
  }
};

export { generateCommentText };
