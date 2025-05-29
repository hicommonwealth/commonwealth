import { models } from '@hicommonwealth/model';
import { Request, Response } from 'express';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';

// Input schema for context aggregation request
const AggregateContextInput = z.object({
  mentions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['user', 'topic', 'thread', 'community', 'proposal']),
      name: z.string(),
    }),
  ),
  communityId: z.string().optional(),
  contextDataDays: z.number().optional().default(30),
});

// Configuration for context limits
const CONTEXT_CONFIG = {
  MAX_RECENT_COMMENTS: 3,
  MAX_RECENT_THREADS: 5,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CONTEXT_LENGTH: 2000,
};

interface ContextResult {
  entityType: string;
  entityId: string;
  entityName: string;
  contextData: string;
}

class ContextAggregator {
  private contextDataDays: number;

  constructor(contextDataDays: number = 30) {
    this.contextDataDays = contextDataDays;
  }

  private getDateFilter(): string {
    const cutoffDate = moment()
      .subtract(this.contextDataDays, 'days')
      .toISOString();
    return `AND created_at >= '${cutoffDate}'`;
  }

  async aggregateUserContext(
    userId: string,
    userName: string,
  ): Promise<ContextResult> {
    try {
      // Get user profile and bio
      const userQuery = `
        SELECT 
          profile->>'name' as name,
          profile->>'bio' as bio,
          created_at
        FROM "Users"
        WHERE id = $userId
      `;

      const [userResult] = await models.sequelize.query<{
        name: string;
        bio: string;
        created_at: Date;
      }>(userQuery, {
        bind: { userId },
        type: QueryTypes.SELECT,
      });

      // Get recent comments
      const commentsQuery = `
        SELECT 
          C.body,
          C.created_at,
          T.title as thread_title,
          COM.name as community_name
        FROM "Comments" C
        JOIN "Addresses" A ON C.address_id = A.id
        JOIN "Threads" T ON C.thread_id = T.id
        JOIN "Communities" COM ON T.community_id = COM.id
        WHERE A.user_id = $userId
          AND C.deleted_at IS NULL
          ${this.getDateFilter().replace('created_at', 'C.created_at')}
        ORDER BY C.created_at DESC
        LIMIT ${CONTEXT_CONFIG.MAX_RECENT_COMMENTS}
      `;

      const comments = await models.sequelize.query<{
        body: string;
        created_at: Date;
        thread_title: string;
        community_name: string;
      }>(commentsQuery, {
        bind: { userId },
        type: QueryTypes.SELECT,
      });

      // Format context
      let contextData = `User: ${userName}\n`;

      if (userResult?.bio) {
        contextData += `Bio: ${userResult.bio.slice(0, CONTEXT_CONFIG.MAX_DESCRIPTION_LENGTH)}\n`;
      }

      contextData += `Member since: ${moment(userResult?.created_at).format('YYYY-MM-DD')}\n`;

      if (comments.length > 0) {
        contextData += `\nRecent Comments:\n`;
        comments.forEach((comment, index) => {
          const commentPreview = comment.body.slice(0, 200).replace(/\n/g, ' ');
          contextData += `${index + 1}. In "${comment.thread_title}" (${comment.community_name}): ${commentPreview}...\n`;
        });
      }

      return {
        entityType: 'user',
        entityId: userId,
        entityName: userName,
        contextData: contextData.slice(0, CONTEXT_CONFIG.MAX_CONTEXT_LENGTH),
      };
    } catch (error) {
      console.error('Error aggregating user context:', error);
      return {
        entityType: 'user',
        entityId: userId,
        entityName: userName,
        contextData: `User: ${userName} (context unavailable)`,
      };
    }
  }

  async aggregateTopicContext(
    topicId: string,
    topicName: string,
  ): Promise<ContextResult> {
    try {
      // Get topic details
      const topicQuery = `
        SELECT 
          T.name,
          T.description,
          T.created_at,
          C.name as community_name
        FROM "Topics" T
        JOIN "Communities" C ON T.community_id = C.id
        WHERE T.id = $topicId
      `;

      const [topicResult] = await models.sequelize.query<{
        name: string;
        description: string;
        created_at: Date;
        community_name: string;
      }>(topicQuery, {
        bind: { topicId },
        type: QueryTypes.SELECT,
      });

      // Get recent threads in this topic
      const threadsQuery = `
        SELECT 
          title,
          created_at,
          LEFT(body, 200) as body_preview
        FROM "Threads"
        WHERE topic_id = $topicId
          AND deleted_at IS NULL
          ${this.getDateFilter()}
        ORDER BY created_at DESC
        LIMIT ${CONTEXT_CONFIG.MAX_RECENT_THREADS}
      `;

      const threads = await models.sequelize.query<{
        title: string;
        created_at: Date;
        body_preview: string;
      }>(threadsQuery, {
        bind: { topicId },
        type: QueryTypes.SELECT,
      });

      // Format context
      let contextData = `Topic: ${topicName}\n`;

      if (topicResult?.community_name) {
        contextData += `Community: ${topicResult.community_name}\n`;
      }

      if (topicResult?.description) {
        contextData += `Description: ${topicResult.description.slice(0, CONTEXT_CONFIG.MAX_DESCRIPTION_LENGTH)}\n`;
      }

      if (threads.length > 0) {
        contextData += `\nRecent Discussions:\n`;
        threads.forEach((thread, index) => {
          contextData += `${index + 1}. "${thread.title}" - ${thread.body_preview.replace(/\n/g, ' ')}...\n`;
        });
      } else {
        contextData += `\nNo recent discussions in this topic.\n`;
      }

      return {
        entityType: 'topic',
        entityId: topicId,
        entityName: topicName,
        contextData: contextData.slice(0, CONTEXT_CONFIG.MAX_CONTEXT_LENGTH),
      };
    } catch (error) {
      console.error('Error aggregating topic context:', error);
      return {
        entityType: 'topic',
        entityId: topicId,
        entityName: topicName,
        contextData: `Topic: ${topicName} (context unavailable)`,
      };
    }
  }

  async aggregateThreadContext(
    threadId: string,
    threadTitle: string,
  ): Promise<ContextResult> {
    try {
      // Get thread details
      const threadQuery = `
        SELECT 
          T.title,
          T.body,
          T.created_at,
          U.profile->>'name' as author_name,
          TOP.name as topic_name,
          C.name as community_name
        FROM "Threads" T
        JOIN "Addresses" A ON T.address_id = A.id
        JOIN "Users" U ON A.user_id = U.id
        JOIN "Topics" TOP ON T.topic_id = TOP.id
        JOIN "Communities" C ON T.community_id = C.id
        WHERE T.id = $threadId
      `;

      const [threadResult] = await models.sequelize.query<{
        title: string;
        body: string;
        created_at: Date;
        author_name: string;
        topic_name: string;
        community_name: string;
      }>(threadQuery, {
        bind: { threadId },
        type: QueryTypes.SELECT,
      });

      // Get recent comments
      const commentsQuery = `
        SELECT 
          C.body,
          C.created_at,
          U.profile->>'name' as commenter_name
        FROM "Comments" C
        JOIN "Addresses" A ON C.address_id = A.id
        JOIN "Users" U ON A.user_id = U.id
        WHERE C.thread_id = $threadId
          AND C.deleted_at IS NULL
          ${this.getDateFilter().replace('created_at', 'C.created_at')}
        ORDER BY C.created_at DESC
        LIMIT ${CONTEXT_CONFIG.MAX_RECENT_COMMENTS}
      `;

      const comments = await models.sequelize.query<{
        body: string;
        created_at: Date;
        commenter_name: string;
      }>(commentsQuery, {
        bind: { threadId },
        type: QueryTypes.SELECT,
      });

      // Format context
      let contextData = `Thread: ${threadTitle}\n`;

      if (threadResult) {
        contextData += `Author: ${threadResult.author_name}\n`;
        contextData += `Community: ${threadResult.community_name}\n`;
        contextData += `Topic: ${threadResult.topic_name}\n`;
        contextData += `Created: ${moment(threadResult.created_at).format('YYYY-MM-DD')}\n`;

        if (threadResult.body) {
          const bodyPreview = threadResult.body
            .slice(0, CONTEXT_CONFIG.MAX_DESCRIPTION_LENGTH)
            .replace(/\n/g, ' ');
          contextData += `Content: ${bodyPreview}...\n`;
        }
      }

      if (comments.length > 0) {
        contextData += `\nRecent Comments:\n`;
        comments.forEach((comment, index) => {
          const commentPreview = comment.body.slice(0, 150).replace(/\n/g, ' ');
          contextData += `${index + 1}. ${comment.commenter_name}: ${commentPreview}...\n`;
        });
      }

      return {
        entityType: 'thread',
        entityId: threadId,
        entityName: threadTitle,
        contextData: contextData.slice(0, CONTEXT_CONFIG.MAX_CONTEXT_LENGTH),
      };
    } catch (error) {
      console.error('Error aggregating thread context:', error);
      return {
        entityType: 'thread',
        entityId: threadId,
        entityName: threadTitle,
        contextData: `Thread: ${threadTitle} (context unavailable)`,
      };
    }
  }

  async aggregateCommunityContext(
    communityId: string,
    communityName: string,
  ): Promise<ContextResult> {
    try {
      // Get community details
      const communityQuery = `
        SELECT 
          name,
          description,
          created_at,
          (SELECT COUNT(*) FROM "Addresses" WHERE community_id = C.id) as member_count,
          (SELECT COUNT(*) FROM "Threads" WHERE community_id = C.id AND deleted_at IS NULL) as thread_count
        FROM "Communities" C
        WHERE C.id = $communityId
      `;

      const [communityResult] = await models.sequelize.query<{
        name: string;
        description: string;
        created_at: Date;
        member_count: number;
        thread_count: number;
      }>(communityQuery, {
        bind: { communityId },
        type: QueryTypes.SELECT,
      });

      // Get recent activity (threads)
      const recentThreadsQuery = `
        SELECT 
          title,
          created_at,
          TOP.name as topic_name
        FROM "Threads" T
        JOIN "Topics" TOP ON T.topic_id = TOP.id
        WHERE T.community_id = $communityId
          AND T.deleted_at IS NULL
          ${this.getDateFilter().replace('created_at', 'T.created_at')}
        ORDER BY T.created_at DESC
        LIMIT ${CONTEXT_CONFIG.MAX_RECENT_THREADS}
      `;

      const recentThreads = await models.sequelize.query<{
        title: string;
        created_at: Date;
        topic_name: string;
      }>(recentThreadsQuery, {
        bind: { communityId },
        type: QueryTypes.SELECT,
      });

      // Format context
      let contextData = `Community: ${communityName}\n`;

      if (communityResult) {
        if (communityResult.description) {
          contextData += `Description: ${communityResult.description.slice(0, CONTEXT_CONFIG.MAX_DESCRIPTION_LENGTH)}\n`;
        }
        contextData += `Members: ${communityResult.member_count}\n`;
        contextData += `Total Threads: ${communityResult.thread_count}\n`;
        contextData += `Founded: ${moment(communityResult.created_at).format('YYYY-MM-DD')}\n`;
      }

      if (recentThreads.length > 0) {
        contextData += `\nRecent Activity:\n`;
        recentThreads.forEach((thread, index) => {
          contextData += `${index + 1}. "${thread.title}" in ${thread.topic_name}\n`;
        });
      } else {
        contextData += `\nNo recent activity in this community.\n`;
      }

      return {
        entityType: 'community',
        entityId: communityId,
        entityName: communityName,
        contextData: contextData.slice(0, CONTEXT_CONFIG.MAX_CONTEXT_LENGTH),
      };
    } catch (error) {
      console.error('Error aggregating community context:', error);
      return {
        entityType: 'community',
        entityId: communityId,
        entityName: communityName,
        contextData: `Community: ${communityName} (context unavailable)`,
      };
    }
  }

  async aggregateProposalContext(
    proposalId: string,
    proposalTitle: string,
  ): Promise<ContextResult> {
    // Note: This is a placeholder implementation since proposal structure may vary
    // You'll need to adapt this based on your actual proposal/governance system
    try {
      let contextData = `Proposal: ${proposalTitle}\n`;
      contextData += `Status: Under Review\n`;
      contextData += `Context: Detailed proposal information not yet available through this system.\n`;

      return {
        entityType: 'proposal',
        entityId: proposalId,
        entityName: proposalTitle,
        contextData,
      };
    } catch (error) {
      console.error('Error aggregating proposal context:', error);
      return {
        entityType: 'proposal',
        entityId: proposalId,
        entityName: proposalTitle,
        contextData: `Proposal: ${proposalTitle} (context unavailable)`,
      };
    }
  }
}

export const aggregateContextHandler = async (req: Request, res: Response) => {
  try {
    const input = AggregateContextInput.parse(req.body);
    const { mentions, contextDataDays = 30 } = input;

    if (!mentions || mentions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No mentions provided',
      });
    }

    const aggregator = new ContextAggregator(contextDataDays);
    const contextResults: ContextResult[] = [];

    // Process each mention
    for (const mention of mentions) {
      let result: ContextResult;

      switch (mention.type) {
        case 'user':
          result = await aggregator.aggregateUserContext(
            mention.id,
            mention.name,
          );
          break;
        case 'topic':
          result = await aggregator.aggregateTopicContext(
            mention.id,
            mention.name,
          );
          break;
        case 'thread':
          result = await aggregator.aggregateThreadContext(
            mention.id,
            mention.name,
          );
          break;
        case 'community':
          result = await aggregator.aggregateCommunityContext(
            mention.id,
            mention.name,
          );
          break;
        case 'proposal':
          result = await aggregator.aggregateProposalContext(
            mention.id,
            mention.name,
          );
          break;
        default:
          result = {
            entityType: mention.type,
            entityId: mention.id,
            entityName: mention.name,
            contextData: `${mention.name} (unsupported entity type)`,
          };
      }

      contextResults.push(result);
    }

    // Format final context string
    const formattedContext = contextResults
      .map((result) => result.contextData)
      .join('\n---\n');

    return res.json({
      success: true,
      data: {
        contextResults,
        formattedContext,
        totalMentions: mentions.length,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in aggregateContextHandler:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input format',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
