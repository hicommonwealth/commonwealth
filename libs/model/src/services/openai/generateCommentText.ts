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
}): AsyncGenerator<string | { error: CommentErrors }, void, unknown> {
  if (!config.OPENAI.API_KEY) {
    yield { error: CommentErrors.OpenAINotConfigured };
    return;
  }

  let openai: OpenAI;
  try {
    openai = new OpenAI({
      organization: config.OPENAI.ORGANIZATION,
      apiKey: config.OPENAI.API_KEY,
    });
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    yield { error: CommentErrors.OpenAIInitFailed };
    return;
  }

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: COMMENT_AI_PROMPTS_CONFIG.comment(userText),
        },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      try {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      } catch (chunkError) {
        console.error('Error processing chunk:', chunkError);
      }
    }
  } catch (e) {
    console.error('Error in OpenAI stream:', e);
    yield { error: CommentErrors.RequestFailed };
  }
};

export { generateCommentText };
