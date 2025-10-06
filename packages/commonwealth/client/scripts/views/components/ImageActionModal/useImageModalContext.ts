import useGetThreadByIdQuery from 'client/scripts/state/api/threads/getThreadById';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { getImageUrlsFromMarkdown } from '../react_quill_editor/utils';

interface ImageContextHookProps {
  isOpen: boolean;
  initialReferenceText?: string;
  initialReferenceImageUrls?: string[];
  onAddReferenceTexts: (texts: string[]) => void;
  onAddReferenceImages: (urls: string[]) => void;
}

interface ParsedUrlContext {
  communityId: string | null;
  threadId: number | null;
  commentId: number | null;
}

export const useImageModalContext = ({
  isOpen,
  onAddReferenceTexts,
  onAddReferenceImages,
}: ImageContextHookProps) => {
  const location = useLocation();
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<number | null>(null);

  // Data fetching for detected context
  const { data: communityData, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId || '',
      enabled: !!communityId,
    });

  const { data: threadData, isLoading: isLoadingThread } =
    useGetThreadByIdQuery(threadId!, !!threadId);

  // Parse the URL to extract context IDs
  const parseUrlForContext = useCallback((): ParsedUrlContext => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    let communityIdFromUrl: string | null = null;
    let threadIdFromUrl: number | null = null;
    const commentIdFromUrl: number | null = null;

    // Basic URL parsing, adjust based on actual route structure
    if (
      pathParts[0] &&
      pathParts[0] !== 'discussion' &&
      pathParts[0] !== 'comment'
    ) {
      // Likely /communityId/...
      communityIdFromUrl = pathParts[0];

      if (pathParts[1] === 'discussion' && pathParts[2]) {
        const threadIdMatch = pathParts[2].match(/^(\d+)/);
        if (threadIdMatch) {
          threadIdFromUrl = parseInt(threadIdMatch[1], 10);
        }
      }
    } else if (pathParts[0] === 'discussion' && pathParts[1]) {
      // Likely /discussion/threadId-...
      const threadIdMatch = pathParts[1].match(/^(\d+)/);
      if (threadIdMatch) {
        threadIdFromUrl = parseInt(threadIdMatch[1], 10);
      }
    }

    return {
      communityId: communityIdFromUrl,
      threadId: threadIdFromUrl,
      commentId: commentIdFromUrl,
    };
  }, [location.pathname]);

  // Main function to gather context from URL and props
  const gatherContext = useCallback(() => {
    const { communityId: urlCommunityId, threadId: urlThreadId } =
      parseUrlForContext();

    // Set state based on URL or contextSource prop
    if (urlCommunityId) {
      setCommunityId(urlCommunityId);
    }

    if (urlThreadId) {
      setThreadId(urlThreadId);
    }
  }, [parseUrlForContext]);

  // Gather context when modal opens
  useEffect(() => {
    if (isOpen) {
      gatherContext();
    }
  }, [isOpen, gatherContext]);

  // Process community data when it loads
  useEffect(() => {
    if (communityId && communityData && !isLoadingCommunity) {
      const communityContextText = `Community: ${communityData.name}`;
      const descriptionContextText = communityData.description
        ? `Description: ${communityData.description}`
        : null;

      const newTexts: string[] = [communityContextText];
      if (descriptionContextText) {
        newTexts.push(descriptionContextText);
      }

      onAddReferenceTexts(newTexts);
    }
  }, [communityId, communityData, isLoadingCommunity, onAddReferenceTexts]);

  // Process thread data when it loads
  useEffect(() => {
    if (threadId && threadData && !isLoadingThread) {
      // Add thread content to context
      const threadContextText = `Title: ${threadData.title}\nBody: ${threadData.body}`;
      onAddReferenceTexts([threadContextText]);

      // Extract and add images from thread
      const threadImageUrls = getImageUrlsFromMarkdown(threadData.body);
      if (threadImageUrls.length > 0) {
        onAddReferenceImages(threadImageUrls);
      }
    }
  }, [
    threadId,
    threadData,
    isLoadingThread,
    onAddReferenceTexts,
    onAddReferenceImages,
  ]);

  return {
    gatherContext,
    contextData: {
      communityId,
      threadId,
      communityData,
      threadData,
    },
    isLoading: isLoadingCommunity || isLoadingThread,
  };
};
