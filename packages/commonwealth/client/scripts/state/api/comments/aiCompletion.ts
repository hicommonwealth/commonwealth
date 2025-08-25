import { trpc } from 'utils/trpcClient';

// Types for AI completion token creation
export interface CreateAICompletionTokenInput {
  user_id: number;
  community_id: string;
  thread_id: number;
  parent_comment_id?: number;
  content: string;
  expires_in_minutes?: number;
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
  return trpc.comment.createAICompletionToken.useMutation({});
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
      // Update caches similar to regular comment creation
      utils.comment.getComments.invalidate().catch(console.error);

      // Update thread cache to reflect new comment count
      // Use TRPC's invalidation method instead of direct cache manipulation
      utils.thread.getThreads.invalidate().catch(console.error);
      utils.thread.getThreadById.invalidate().catch(console.error);
    },
    onError: (error) => {
      console.error('Failed to create AI completion comment:', error);
    },
  });
};
