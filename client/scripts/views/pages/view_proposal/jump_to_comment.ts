import $ from 'jquery';

// highlight the header/body of a parent thread, or the body of a comment
const jumpHighlightComment = (commentId, shouldScroll = true, animationDelayTime = 2000) => {
  const $div = (commentId === 'parent' || commentId === 'body')
    ? $('html, body').find('.ProposalHeader')
    : $('html, body').find(`.comment-${commentId}`);
  if ($div.length === 0) return; // if the passed comment was invalid, abort
  const divTop = $div.position().top;
  const scrollTime = 500; // time to scroll
  const minimumVisibleHeight = 250; // minimum amount of the comment that must appear in the current viewport

  // clear any previous animation
  $div.removeClass('highlighted highlightAnimationComplete');

  // scroll to comment if necessary, set highlight, wait, then fade out the highlight
  if (shouldScroll) {
    $('.mithril-app').animate({ scrollTop: divTop }, scrollTime);
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

export default jumpHighlightComment;
