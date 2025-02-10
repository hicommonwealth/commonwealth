import type { ContentType } from '@hicommonwealth/shared';
import app from 'state';

// Add callback registry for AI streaming
type AIStreamingCallback = (commentId: number) => void;
let aiStreamingCallbacks: AIStreamingCallback[] = [];

export const registerAIStreamingCallback = (callback: AIStreamingCallback) => {
  console.log('helpers - Registering AI streaming callback');
  aiStreamingCallbacks.push(callback);
  return () => {
    aiStreamingCallbacks = aiStreamingCallbacks.filter((cb) => cb !== callback);
  };
};

// highlight the header/body of a parent thread, or the body of a comment
export const jumpHighlightComment = (commentId: number) => {
  console.log('helpers - jumpHighlightComment called for:', commentId);
  const element = document.querySelector(`.comment-${commentId}`);
  if (!element) {
    console.warn(`No element found for comment ID: ${commentId}`);
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add('highlighted');
  setTimeout(() => {
    element.classList.remove('highlighted');
  }, 2000);

  // Notify any registered callbacks about the new comment
  console.log(
    'helpers - Notifying AI streaming callbacks for comment:',
    commentId,
  );
  aiStreamingCallbacks.forEach((callback) => {
    try {
      callback(commentId);
    } catch (error) {
      console.error('Error in AI streaming callback:', error);
    }
  });
};

export const clearEditingLocalStorage = (
  id: number | string,
  contentType: ContentType,
) => {
  localStorage.removeItem(
    `${app.activeChainId()}-edit-${contentType}-${id}-storedText`,
  );
};
