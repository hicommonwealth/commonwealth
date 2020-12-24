import m from 'mithril';
import _ from 'lodash';
import { Button, Spinner } from 'construct-ui';

import { OffchainThread, Account } from 'models';
import { UserContent } from './index';
import ProfileCommentGroup from './profile_comment_group';
import ProfileProposal from './profile_proposal';

const postsRemaining = (content, state) => {
  return (content.length > 10 && state.count < content.length);
};

const ProfileContent: m.Component<{
  account: Account<any>,
  type: UserContent,
  content: any
}, {
  onscroll: any;
  count: number
  previousContent: any;
}> = {
  // TODO: Add typeguards to ProposalComments so we can avoid the dirty indexing here
  view: (vnode) => {
    if (!vnode.state.count) vnode.state.count = 10;
    const { account, type } = vnode.attrs;
    const {
      allContent,
      proposals,
      comments,
    } = vnode.attrs.content;
    const content = (type === UserContent.All)
      ? allContent
      : (type === UserContent.Threads)
        ? proposals
        : comments;

    const newContent = content !== vnode.state.previousContent;

    if (newContent) {
      $(window).off('scroll');

      vnode.state.onscroll = _.debounce(async () => {
        if (!postsRemaining(content, vnode.state)) return;
        console.log('posts remain');
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > (scrollHeight - 400)) {
          vnode.state.count += 10;
          console.log(vnode.state.count);
        }
      }, 400);

      vnode.state.previousContent = content;
    }

    return m('.ProfileContent', [
      (type === UserContent.All) && m('.all-content', [
        allContent.length === 0 && m('.no-items', [
          (account.profile && account.profile.name) ? account.profile.name : 'This account',
          ' hasn\'t posted any threads or comments'
        ]),
        allContent.slice(0, vnode.state.count).map((obj) => {
          if (obj instanceof OffchainThread) return m(ProfileProposal, { proposal: obj });
          else return m(ProfileCommentGroup, { proposal: obj.proposal, comments: [obj], account, });
        })
      ]),
      (type === UserContent.Threads) && m('.user-threads', [
        proposals.length === 0 && m('.no-items', [
          (account.profile && account.profile.name) ? account.profile.name : 'This account',
          ' hasn\'t posted any threads'
        ]),
        proposals.slice(0, vnode.state.count).map((proposal) => m(ProfileProposal, { proposal }))
      ]),
      (type === UserContent.Comments) && m('.user-comments', [
        comments.length === 0 && m('.no-items', [
          (account.profile && account.profile.name) ? account.profile.name : 'This account',
          ' hasn\'t posted any comments'
        ]),
        comments.slice(0, vnode.state.count).map((comment) => {
          return m(ProfileCommentGroup, { proposal: comment.proposal, comments: [comment], account, });
        }),
      ]),
      postsRemaining(content, vnode.state)
      && m('.infinite-scroll-spinner-wrap', [
        m(Spinner, { active: postsRemaining(content, vnode.state) })
      ])
    ]);
  }
};

export default ProfileContent;
