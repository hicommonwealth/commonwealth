import { trpc } from 'utils/trpcClient';

// Types for AI completion token creation
// Thread ID is inferred from the parent comment's thread on the server
export interface CreateAICompletionTokenInput {
  comment_id: number; // The parent comment we're replying to
  content: string;
}

export interface CreateAICompletionTokenResponse {
  token: string;
  expires_at: Date;
  id: number;
}

// Types for AI completion comment creation
export interface CreateAICompletionCommentInput {
  token: string;
}

// Hook for creating AI completion tokens
export const useCreateAICompletionTokenMutation = () => {
  return trpc.comment.createAICompletionToken.useMutation({
    onSuccess: (data) => {
      console.log('[AI Token Mutation] Token created successfully:', {
        tokenId: data.id,
        expiresAt: data.expires_at,
      });
    },
    onError: (error) => {
      console.error('[AI Token Mutation] Failed to create token:', {
        error: error.message,
        data: error.data,
        shape: error.shape,
      });
    },
  });
};

// Hook for creating comments from AI completion tokens
export const useCreateAICompletionCommentMutation = ({
  communityId,
  threadId,
  existingNumberOfComments = 0,
}: {
  communityId: string;
  threadId: number;
  existingNumberOfComments?: number;
}) => {
  const utils = trpc.useUtils();

  return trpc.comment.createAICompletionComment.useMutation({
    onSuccess: (newComment) => {
      console.log('[AI Comment Mutation] Comment created successfully:', {
        commentId: newComment.id,
        threadId: newComment.thread_id,
        communityId: newComment.community_id,
      });

      // Update caches similar to regular comment creation
      utils.comment.getComments.invalidate().catch((err) => {
        console.error(
          '[AI Comment Mutation] Failed to invalidate comments cache:',
          err,
        );
      });

      // Update thread cache to reflect new comment count
      // Use TRPC's invalidation method instead of direct cache manipulation
      utils.thread.getThreads.invalidate().catch((err) => {
        console.error(
          '[AI Comment Mutation] Failed to invalidate threads cache:',
          err,
        );
      });
      utils.thread.getThreadById.invalidate().catch((err) => {
        console.error(
          '[AI Comment Mutation] Failed to invalidate thread by id cache:',
          err,
        );
      });
    },
    onError: (error) => {
      console.error(
        '[AI Comment Mutation] Failed to create AI completion comment:',
        {
          error: error.message,
          data: error.data,
          shape: error.shape,
        },
      );
    },
  });
};
