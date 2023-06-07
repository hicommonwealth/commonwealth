import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Configuration, OpenAIApi } from 'openai';
import fetch from 'node-fetch';

import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import type { DB } from '../models';
import { AppError } from '../../../common-common/src/errors';

const configuration = new Configuration({
  organization: 'org-D0ty00TJDApqHYlrn1gge2Ql',
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

type generateTextReq = {
  parent_id: number;
  thread_id?: number;
  content: string;
  is_comment?: boolean;
};

const getCommentTree = async (models, parentId, threadId) => {
  // Check if parentId is the thread
  if (parseInt(parentId) === threadId) {
    const thread = await models.Thread.findOne({
      where: { id: threadId },
    });

    return thread
      ? [
          {
            role: 'user',
            content: thread.plaintext, // assuming you want to include the thread's title
          },
        ]
      : [];
  }

  const comment = await models.Comment.findOne({
    where: { id: parentId, thread_id: threadId },
  });

  if (!comment) return [];

  const parentComments = await getCommentTree(
    models,
    comment.parent_id,
    threadId
  );
  return [
    ...parentComments,
    {
      role: 'user',
      content: comment.plaintext,
    },
  ];
};

const generateText = async (
  models: DB,
  { parent_id, thread_id, content, is_comment }: generateTextReq
): Promise<string> => {
  if (!content) {
    throw new AppError('No content provided');
  }

  // Fetch the comment tree for the given parent_id
  let commentTree;
  if (is_comment) {
    commentTree = await getCommentTree(models, parent_id, thread_id);
    commentTree.push({ role: 'user', content: content });
  } else {
    commentTree = [{ role: 'user', content: content }];
  }

  let completion;
  const SYSTEM_PROMPT = `You are ChatGPT, a large language model trained by OpenAI. 
    Follow the user's instructions carefully. Respond using markdown.`;

  // Append the input content to the comment tree

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...commentTree],
      max_tokens: 2500,
      temperature: 0.7,
    });

    completion = response.data.choices[0].message.content;
    console.log(completion);
  } catch (e) {
    console.error('Error in generateText:', e.response?.data || e.message);
    throw new AppError('Problem generating text');
  }

  return completion;
};

export default generateText;
