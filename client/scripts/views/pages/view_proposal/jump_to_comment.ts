import $ from 'jquery';

// highlight the header/body of a parent thread, or the body of a comment
export const jumpHighlightComment = (commentId, shouldScroll = true, animationDelayTime = 2000) => {
  const $div = commentId === 'parent'
    ? $('html, body').find('.ProposalHeader')
    : commentId === 'body'
    ? $('html, body').find('.ProposalBody')
    : $('html, body').find(`.comment-${commentId}`);
  if ($div.length === 0) return; // if the passed comment was invalid, abort
  const divTop = $div.position().top;
  const scrollTime = 500; // time to scroll
  const minimumVisibleHeight = 250; // minimum amount of the comment that must appear in the current viewport

  // clear any previous animation
  $div.removeClass('highlighted highlightAnimationComplete');

  // scroll to comment if necessary, set highlight, wait, then fade out the highlight
  if (shouldScroll) {
    $('html, body').animate({ scrollTop: divTop }, scrollTime);
    $div.addClass('highlighted');
    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, animationDelayTime + scrollTime);
  } else {
    $div.addClass('highlighted');
    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, animationDelayTime);
  }
};
