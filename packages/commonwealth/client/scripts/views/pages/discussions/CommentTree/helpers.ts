import type { ContentType } from '@hicommonwealth/core';
import app from 'state';

// highlight the header/body of a parent thread, or the body of a comment
export const jumpHighlightComment = (commentId: number) => {
  const commentEle = document.getElementsByClassName(`comment-${commentId}`)[0];

  if (commentEle) {
    // clear any previous animation
    commentEle.classList.remove('highlighted');
    commentEle.classList.remove('highlightAnimationComplete');
    // scroll to comment
    commentEle.scrollIntoView();
    // add new highlight classes
    commentEle.classList.add('highlighted');
    setTimeout(() => {
      commentEle.classList.add('highlightAnimationComplete');
    }, 2000 + 500);
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
