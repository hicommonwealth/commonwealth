type ThreadLike = {
  communityId?: string | null;
  readOnly?: boolean | null;
};

type FetchThreadErrorLike = {
  message?: string;
} | null;

export type ViewThreadRenderState =
  | 'fetch_error'
  | 'loading'
  | 'thread_not_found'
  | 'ready';

export const resolveViewThreadRenderState = ({
  activeChainId,
  contentUrlBodyToFetch,
  fetchThreadError,
  hasChainMeta,
  identifier,
  isLoading,
  isLoadingContentBody,
  thread,
}: {
  activeChainId: string | null | undefined;
  contentUrlBodyToFetch: string | null;
  fetchThreadError: FetchThreadErrorLike;
  hasChainMeta: boolean;
  identifier: unknown;
  isLoading: boolean;
  isLoadingContentBody: boolean;
  thread: ThreadLike | null | undefined;
}): ViewThreadRenderState => {
  if (typeof identifier !== 'string' || fetchThreadError) {
    return 'fetch_error';
  }

  if (
    !hasChainMeta ||
    isLoading ||
    (isLoadingContentBody && Boolean(contentUrlBodyToFetch))
  ) {
    return 'loading';
  }

  if (!thread || thread.communityId !== activeChainId) {
    return 'thread_not_found';
  }

  return 'ready';
};

export const shouldShowCreateCommentComposer = ({
  fromDiscordBot,
  isGloballyEditing,
  isUserLoggedIn,
  thread,
}: {
  fromDiscordBot: boolean;
  isGloballyEditing: boolean;
  isUserLoggedIn: boolean;
  thread: ThreadLike | null | undefined;
}) =>
  Boolean(
    thread &&
      !thread.readOnly &&
      !fromDiscordBot &&
      !isGloballyEditing &&
      isUserLoggedIn,
  );

export const shouldShowJoinCommunityBanner = ({
  hasActiveAccount,
  isBannerVisible,
}: {
  hasActiveAccount: boolean;
  isBannerVisible: boolean;
}) => !hasActiveAccount && isBannerVisible;

export const shouldShowViewThreadGatedTopicBanner = ({
  hideGatingBanner,
  isThreadAuthor,
  isTopicGated,
}: {
  hideGatingBanner: boolean;
  isThreadAuthor: boolean;
  isTopicGated: boolean;
}) => Boolean(isTopicGated && !hideGatingBanner && !isThreadAuthor);

export const shouldShowViewThreadSidebar = ({
  isWindowSmallInclusive,
}: {
  isWindowSmallInclusive: boolean;
}) => !isWindowSmallInclusive;
