import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import Infinite from 'mithril-infinite';
import { OffchainThread, Account } from 'models';
import { UserContent } from './index';
import ProfileCommentGroup from './profile_comment_group';
import ProfileProposal from './profile_proposal';
import NotificationRow from '../../components/notification_row';

// const postsRemaining = (content, state) => {
//   console.log({ postsRemaining: content.length > 10 && state.count < content.length })
//   return (content.length > 10 && state.count < content.length);
// };

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

    return m('.ProfileContent', [
      // (type === UserContent.All) && m('.all-content', [
      //   allContent.length === 0 && m('.no-items', [
      //     (account.profile && account.profile.name) ? account.profile.name : 'This account',
      //     ' hasn\'t posted any threads or comments'
      //   ]),
      //   allContent.slice(0, vnode.state.count).map((obj) => {
      //     if (obj instanceof OffchainThread) return m(ProfileProposal, { proposal: obj });
      //     else return m(ProfileCommentGroup, { proposal: obj.proposal, comments: [obj], account, });
      //   })
      // ]),
      // (type === UserContent.Threads) && m('.user-threads', [
      //   proposals.length === 0 && m('.no-items', [
      //     (account.profile && account.profile.name) ? account.profile.name : 'This account',
      //     ' hasn\'t posted any threads'
      //   ]),
      //   proposals.slice(0, vnode.state.count).map((proposal) => m(ProfileProposal, { proposal }))
      // ]),
      // (type === UserContent.Comments) && m('.user-comments', [
      //   comments.length === 0 && m('.no-items', [
      //     (account.profile && account.profile.name) ? account.profile.name : 'This account',
      //     ' hasn\'t posted any comments'
      //   ]),
      //   comments.slice(0, vnode.state.count).map((comment) => {
      //     return m(ProfileCommentGroup, { proposal: comment.proposal, comments: [comment], account, });
      //   }),
      // ]),
      m(Infinite, {
        class: 'infinite-scroll',
        pageData: () => content,
        pageChange: () => { console.log('changing'); },
        item: (data, opts, index) => {
          if (data instanceof OffchainThread) {
            return m(ProfileProposal, { proposal: data });
          } else {
            console.log(data);
            return m(ProfileCommentGroup, {
              proposal: data.proposal,
              comments: [data],
              account
            });
          }
        },
      })
    ]);
  }
};

export default ProfileContent;
