import type { ContentType } from '@hicommonwealth/shared';
import app from 'state';

// Add callback registry for AI streaming
type AIStreamingCallback = (commentId: number) => void;
let aiStreamingCallbacks: AIStreamingCallback[] = [];

export const registerAIStreamingCallback = (callback: AIStreamingCallback) => {
  console.log('helpers - Registering AI streaming callback');
  // Remove any existing instances of this callback
  aiStreamingCallbacks = aiStreamingCallbacks.filter((cb) => cb !== callback);
  // Add the new callback
  aiStreamingCallbacks.push(callback);
  return () => {
    console.log('helpers - Unregistering AI streaming callback');
    aiStreamingCallbacks = aiStreamingCallbacks.filter((cb) => cb !== callback);
  };
};

// highlight the header/body of a parent thread, or the body of a comment
export const jumpHighlightComment = (
  commentId: number,
  shouldTriggerAI: boolean = false,
) => {
  console.log(
    'helpers - jumpHighlightComment called for:',
    commentId,
    'AI enabled:',
    shouldTriggerAI,
  );
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

  // Only notify callbacks if AI is enabled and callbacks exist
  if (shouldTriggerAI && aiStreamingCallbacks.length > 0) {
    console.log(
      'helpers - AI is enabled, notifying callbacks for comment:',
      commentId,
      'Number of callbacks:',
      aiStreamingCallbacks.length,
    );
    aiStreamingCallbacks.forEach((callback) => {
      try {
        callback(commentId);
      } catch (error) {
        console.error('Error in AI streaming callback:', error);
      }
    });
  } else {
    console.log(
      'helpers - Skipping AI callbacks:',
      shouldTriggerAI ? 'no callbacks registered' : 'AI is disabled',
    );
  }
};

export const clearEditingLocalStorage = (
  id: number | string,
  contentType: ContentType,
) => {
  localStorage.removeItem(
    `${app.activeChainId()}-edit-${contentType}-${id}-storedText`,
  );
};

export const listenForComment = (
  commentId: number,
  shouldTriggerAI: boolean = false,
  maxAttempts = 10,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkElement = () => {
      attempts++;
      const element = document.querySelector(`.comment-${commentId}`);
      if (element) {
        jumpHighlightComment(commentId, shouldTriggerAI);
        resolve();
      } else if (attempts < maxAttempts) {
        setTimeout(checkElement, 100); // Try again after 100ms
      } else {
        console.warn(
          `Failed to find comment element after ${maxAttempts} attempts`,
        );
        reject(new Error('Comment element not found'));
      }
    };

    // Start checking
    checkElement();

    // Also set up a mutation observer as backup
    const container = document.querySelector('.CommentsTree');
    if (container) {
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(`.comment-${commentId}`);
        if (element) {
          jumpHighlightComment(commentId, shouldTriggerAI);
          obs.disconnect();
          resolve();
        }
      });
      observer.observe(container, { childList: true, subtree: true });
      // Disconnect after 5 seconds to prevent memory leaks
      setTimeout(() => observer.disconnect(), 5000);
    }
  });
};
