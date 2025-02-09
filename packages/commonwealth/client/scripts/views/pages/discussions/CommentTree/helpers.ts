import type { ContentType } from '@hicommonwealth/shared';
import app from 'state';

// highlight the header/body of a parent thread, or the body of a comment
export const jumpHighlightComment = (commentId: number) => {
  console.log(
    'jumpHighlightComment: Attempting to highlight comment with ID:',
    commentId,
  );
  const commentEle = document.getElementsByClassName(`comment-${commentId}`)[0];

  if (commentEle) {
    console.log(
      'jumpHighlightComment: Found element for comment ID:',
      commentId,
    );
    // clear any previous animation classes
    commentEle.classList.remove('highlighted');
    commentEle.classList.remove('highlightAnimationComplete');
    // scroll into view
    commentEle.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
    // add new highlight classes
    commentEle.classList.add('highlighted');
    setTimeout(() => {
      commentEle.classList.add('highlightAnimationComplete');
      console.log(
        'jumpHighlightComment: Animation complete for comment ID:',
        commentId,
      );
    }, 2500); // adjusted timeout for clarity
  } else {
    console.warn(
      'jumpHighlightComment: No element found for comment ID:',
      commentId,
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
