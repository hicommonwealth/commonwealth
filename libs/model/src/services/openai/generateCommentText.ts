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

const chatWithOpenAI = async (prompt = '', openai: OpenAI) => {
  convoHistory.push({ role: 'user', content: prompt });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: convoHistory,
  });
  convoHistory.push(response.choices[0].message);
  return (response.choices[0].message.content || 'NO_RESPONSE').replace(
    /^"|"$/g,
    '',
  );
};

const generateCommentText = async function* ({
  userText,
}: {
  userText?: string;
}): AsyncGenerator<any, void, unknown> {
  if (!config.OPENAI.API_KEY) {
    yield { error: CommentErrors.OpenAINotConfigured };
    return;
  }

  const openai = new OpenAI({
    organization: config.OPENAI.ORGANIZATION,
    apiKey: config.OPENAI.API_KEY,
  });

  if (!openai) {
    yield { error: CommentErrors.OpenAIInitFailed };
    return;
  }

  try {
    const commentText = await chatWithOpenAI(
      COMMENT_AI_PROMPTS_CONFIG.comment(userText),
      openai,
    );
    yield 'event: comment\n';
    yield `data: ${commentText}\n\n`;
  } catch (e) {
    yield { error: CommentErrors.RequestFailed };
  }
};

export { generateCommentText };
