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
  const utils = trpc.useUtils();

  return trpc.comment.createAICompletionToken.useMutation({
    onSuccess: () => {
      // Invalidate any relevant caches if needed
      // Note: we don't invalidate comments cache here since the comment isn't created yet
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
      // Update caches similar to regular comment creation
      utils.comment.getComments.invalidate().catch(console.error);

      // Update thread cache to reflect new comment count
      // Find and update the thread in all relevant caches
      const queryClient = utils.getQueryCache();

      queryClient.findAll(['trpc', 'thread']).forEach((cache) => {
        if (cache.state.data?.pages) {
          // Handle paginated results
          cache.setData({
            ...cache.state.data,
            pages: cache.state.data.pages.map((page: any) => ({
              ...page,
              results: page.results?.map((thread: any) =>
                thread.id === threadId
                  ? {
                      ...thread,
                      numberOfComments: existingNumberOfComments + 1,
                    }
                  : thread,
              ),
            })),
          });
        } else if (cache.state.data?.id === threadId) {
          // Handle single thread results
          cache.setData({
            ...cache.state.data,
            numberOfComments: existingNumberOfComments + 1,
          });
        }
      });
    },
    onError: (error) => {
      console.error('Failed to create AI completion comment:', error);
    },
  });
};
