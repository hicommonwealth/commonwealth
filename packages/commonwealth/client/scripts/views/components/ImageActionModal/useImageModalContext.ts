import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useGetThreadsByIdQuery } from 'state/api/threads';
import { getImageUrlsFromMarkdown } from '../react_quill_editor/utils';

interface ImageContextHookProps {
  isOpen: boolean;
  contextSource?: 'comment' | 'thread' | 'community';
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
  contextSource,
  initialReferenceText,
  initialReferenceImageUrls,
  onAddReferenceTexts,
  onAddReferenceImages,
}: ImageContextHookProps) => {
  const location = useLocation();
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [commentId, setCommentId] = useState<number | null>(null);

  // Data fetching for detected context
  const { data: communityData, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId || '',
      enabled: !!communityId,
    });

  const { data: threadsData, isLoading: isLoadingThread } =
    useGetThreadsByIdQuery({
      thread_ids: threadId ? [threadId] : [],
      community_id: communityId || '',
    });

  // Extract the single thread data if available
  const threadData = threadsData?.[0];

  // Parse the URL to extract context IDs
  const parseUrlForContext = useCallback((): ParsedUrlContext => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    let communityIdFromUrl: string | null = null;
    let threadIdFromUrl: number | null = null;
    let commentIdFromUrl: number | null = null;

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

  // Fetch thread/comment data if relevant IDs are present
  useEffect(() => {
    if (!isOpen) return; // Only run when modal opens

    // Context gathering logic was here, logs removed

    const fetchData = async () => {
      // ... existing code ...
    };
  }, [isOpen]);

  return {
    gatherContext,
    contextData: {
      communityId,
      threadId,
      commentId,
      communityData,
      threadData,
    },
    isLoading: isLoadingCommunity || isLoadingThread,
  };
};
