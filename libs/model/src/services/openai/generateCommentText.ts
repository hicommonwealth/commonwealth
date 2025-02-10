import { OpenAI } from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs';
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

const convoHistory: (ChatCompletionMessage | ChatCompletionUserMessageParam)[] =
  [];

const generateCommentText = async function* ({
  userText,
}: {
  userText?: string;
}): AsyncGenerator<any, void, unknown> {
  console.log('generateCommentText - Starting with text:', userText);

  if (!config.OPENAI.API_KEY) {
    console.error('generateCommentText - No OpenAI API key configured');
    yield { error: CommentErrors.OpenAINotConfigured };
    return;
  }

  let openai: OpenAI;
  try {
    console.log('generateCommentText - Initializing OpenAI client');
    openai = new OpenAI({
      organization: config.OPENAI.ORGANIZATION,
      apiKey: config.OPENAI.API_KEY,
    });
  } catch (error) {
    console.error('generateCommentText - Failed to initialize OpenAI:', error);
    yield { error: CommentErrors.OpenAIInitFailed };
    return;
  }

  try {
    console.log('generateCommentText - Creating completion stream');
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

    console.log('generateCommentText - Stream created, processing chunks');
    let previousText = '';
    for await (const chunk of stream) {
      try {
        console.log('generateCommentText - Received chunk:', chunk);
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          // Only yield the new content, not the accumulated text
          console.log('generateCommentText - New content:', {
            content,
            length: content.length,
          });
          yield content;
        }
      } catch (chunkError) {
        console.error(
          'generateCommentText - Error processing chunk:',
          chunkError,
        );
        // Continue processing other chunks even if one fails
      }
    }
    console.log('generateCommentText - Stream complete');
  } catch (e) {
    console.error('generateCommentText - Error in OpenAI stream:', e);
    yield { error: CommentErrors.RequestFailed };
  }
};

export { generateCommentText };
