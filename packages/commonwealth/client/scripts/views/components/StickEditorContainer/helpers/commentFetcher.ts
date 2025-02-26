/**
 * Helper functions for fetching comments and building context for AI summaries
 */
import app from 'state';

/**
 * Fetches comments from the API with proper error handling
 */
export const fetchComments = async (
  params: Record<string, string | number | boolean>,
  communityId?: string,
): Promise<any[]> => {
  // Create a copy of params to avoid modifying the original
  const paramsWithDefaults = { ...params };

  // Add community_id parameter which is required by the API
  const activeCommunityId = communityId || app.activeChainId();
  if (activeCommunityId) {
    paramsWithDefaults.community_id = activeCommunityId;
  }

  // Remove search parameters if they exist
  if ('search' in paramsWithDefaults) delete paramsWithDefaults.search;
  if ('search_term' in paramsWithDefaults)
    delete paramsWithDefaults.search_term;

  // Ensure thread_id is a number if it exists
  if (
    'thread_id' in paramsWithDefaults &&
    typeof paramsWithDefaults.thread_id !== 'number'
  ) {
    paramsWithDefaults.thread_id = Number(paramsWithDefaults.thread_id);
  }

  // Ensure parent_id is a number if it exists
  if (
    'parent_id' in paramsWithDefaults &&
    typeof paramsWithDefaults.parent_id !== 'number'
  ) {
    paramsWithDefaults.parent_id = Number(paramsWithDefaults.parent_id);
  }

  // If fetching replies, ensure thread_id is also included (required by API)
  if (
    'parent_id' in paramsWithDefaults &&
    !('thread_id' in paramsWithDefaults) &&
    'thread_id' in params
  ) {
    paramsWithDefaults.thread_id = params.thread_id;
  }

  // Use the TRPC endpoint
  const url = `/api/internal/trpc/comment.getComments?batch=1&input=%7B%220%22%3A${encodeURIComponent(JSON.stringify(paramsWithDefaults))}%7D`;
  console.log(`Fetching comments with params:`, paramsWithDefaults);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch comments: ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Extract results using Path 1 which is known to work
    const results = data?.[0]?.result?.data?.results || [];

    console.log(`Received ${results.length} comments`);

    return results;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

/**
 * Builds a comprehensive context string including thread content and nested comments
 */
export const buildThreadContext = async (
  threadId: string | number | undefined,
  threadTitle: string | undefined,
  threadBody: string | undefined,
  nestingDepth: number = 2,
  communityId?: string,
): Promise<string> => {
  if (!threadId) {
    return '';
  }

  // Ensure threadId is a number
  const numericThreadId =
    typeof threadId === 'string' ? Number(threadId) : threadId;

  console.log(`Building thread context for thread ${numericThreadId}`);

  let contextInfo = '';

  // Store thread ID in the context for later use
  contextInfo += `Thread ID: ${numericThreadId}\n`;

  // Add thread title and body to context
  if (threadTitle) {
    contextInfo += `Thread title: "${threadTitle}"\n\n`;
  }
  if (threadBody) {
    contextInfo += `Thread content: "${threadBody}"\n\n`;
  }

  // Store community ID in the context for later use
  if (communityId) {
    contextInfo += `Community ID: ${communityId}\n`;
  }

  try {
    // Fetch all comments for the thread
    const allComments = await fetchComments(
      {
        thread_id: numericThreadId,
        include_reactions: true,
        include_spam_comments: false,
        order_by: 'newest',
        limit: 20,
        page: 1,
      },
      communityId,
    );

    if (allComments.length === 0) {
      console.log('No comments found for this thread');
      return contextInfo;
    }

    // Separate top-level comments from replies
    const topLevelComments = allComments.filter(
      (comment) => !comment.parent_id,
    );
    const replies = allComments.filter((comment) => comment.parent_id);

    console.log(
      `Found ${topLevelComments.length} top-level comments and ${replies.length} replies`,
    );

    // Process top-level comments (limit to 5)
    const topComments = topLevelComments.slice(0, 5);

    if (topComments.length > 0) {
      contextInfo += 'Top comments:\n';

      // Process each top comment
      for (let i = 0; i < topComments.length; i++) {
        const comment = topComments[i];
        contextInfo += `Comment ${i + 1} (ID: ${comment.id}): "${comment.body}"\n\n`;

        // Find direct replies to this comment
        const directReplies = replies.filter(
          (reply) => reply.parent_id === comment.id,
        );

        if (directReplies.length > 0 && nestingDepth >= 1) {
          contextInfo += `  Replies to comment ${i + 1}:\n`;

          // Process each first-level reply (limit to 2)
          const limitedReplies = directReplies.slice(0, 2);
          for (let j = 0; j < limitedReplies.length; j++) {
            const reply = limitedReplies[j];
            contextInfo += `    Reply ${j + 1} (ID: ${reply.id}): "${reply.body}"\n\n`;

            // Find nested replies to this reply
            if (nestingDepth >= 2) {
              const nestedReplies = replies.filter(
                (nestedReply) => nestedReply.parent_id === reply.id,
              );

              if (nestedReplies.length > 0) {
                contextInfo += `      Nested replies:\n`;
                // Limit to 1 nested reply
                const limitedNestedReplies = nestedReplies.slice(0, 1);
                limitedNestedReplies.forEach((nestedReply, k) => {
                  contextInfo += `        Nested reply ${k + 1} (ID: ${nestedReply.id}): "${nestedReply.body}"\n\n`;
                });
              }
            }
          }
        }
      }
    }

    // Add some recent comments if we have fewer than 3 top comments
    if (topComments.length < 3) {
      const topCommentIds = new Set(topComments.map((c) => c.id));
      const recentComments = topLevelComments
        .filter((c) => !topCommentIds.has(c.id))
        .slice(0, 3 - topComments.length);

      if (recentComments.length > 0) {
        contextInfo += 'Additional comments:\n';

        for (let i = 0; i < recentComments.length; i++) {
          const comment = recentComments[i];
          contextInfo += `Additional comment ${i + 1} (ID: ${comment.id}): "${comment.body}"\n\n`;

          // Find direct replies to this comment
          const directReplies = replies.filter(
            (reply) => reply.parent_id === comment.id,
          );

          if (directReplies.length > 0 && nestingDepth >= 1) {
            contextInfo += `  Replies to additional comment ${i + 1}:\n`;

            // Process each first-level reply (limit to 2)
            const limitedReplies = directReplies.slice(0, 2);
            for (let j = 0; j < limitedReplies.length; j++) {
              const reply = limitedReplies[j];
              contextInfo += `    Reply ${j + 1} (ID: ${reply.id}): "${reply.body}"\n\n`;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to build thread context:', error);
  }

  console.log(`Final context length: ${contextInfo.length} characters`);

  return contextInfo;
};

/**
 * Creates a summary prompt with the given context
 */
export const createSummaryPrompt = (contextInfo: string): string => {
  // Extract thread ID, community ID, and thread title from the context
  const threadIdMatch = contextInfo.match(/Thread ID: (\d+)/);
  const communityIdMatch = contextInfo.match(/Community ID: ([a-zA-Z0-9-_]+)/);
  const threadTitleMatch = contextInfo.match(/Thread title: "([^"]+)"/);

  const threadId = threadIdMatch ? threadIdMatch[1] : '';
  const communityId = communityIdMatch
    ? communityIdMatch[1]
    : app.activeChainId() || '';
  const threadTitle = threadTitleMatch
    ? threadTitleMatch[1].replace(/\s+/g, '-')
    : '';

  // Create the URL format with thread ID and title
  const threadPath = threadTitle ? `${threadId}-${threadTitle}` : threadId;

  return `${contextInfo}
Please provide a comprehensive summary of this discussion thread. 

Your response MUST start with "This thread is about" followed by a concise description of the main topic.

Then, include the main points from the thread content and the key insights from the comments. Pay special attention to the conversation flow in nested replies, as they often contain important back-and-forth discussions.

You can use markdown in your response, including links to specific comments. To link to a comment, use the format:
[Comment text or description](/${communityId}/discussion/${threadPath}?comment=COMMENT_ID)

Where COMMENT_ID is the ID number provided in the context (e.g., "Comment 1 (ID: 12345)").
Do not include any refcode parameters in the links.

IMPORTANT: You MUST include at least one link to a specific comment in your summary, preferably linking to the most insightful or important comment in the discussion.`;
};

/**
 * Creates a draft reply prompt with the given context
 */
export const createDraftPrompt = (
  contextInfo: string,
  isReplying: boolean,
  replyingToAuthor?: string,
): string => {
  if (isReplying && replyingToAuthor) {
    return `${contextInfo}Please draft a thoughtful reply to ${replyingToAuthor} based on the context provided.`;
  } else {
    return `${contextInfo}Please draft a thoughtful response based on the context provided.`;
  }
};
