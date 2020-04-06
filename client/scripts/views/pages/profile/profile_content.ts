import m from 'mithril';
import _ from 'lodash';
import { OffchainThread, Account } from 'models';
import ProfileCommentGroup from './profile_comment_group';
import { UserContent } from '.';
import ProfileProposal from './profile_proposal';

const ProfileContent: m.Component<{ account: Account<any>, type: UserContent, content: any}, { count: number }> = {
  // TODO: Add typeguards to ProposalComments so we can avoid the dirty indexing here
  view: (vnode) => {
    if (!vnode.state.count) vnode.state.count = 10;
    const { account, type } = vnode.attrs;
    const {
      allContent,
      proposals,
      comments,
      proposalHashes
    } = vnode.attrs.content;
    return m('.ProfileContent', [
      (type === UserContent.All) && m('.all-content', [
        allContent.length === 0 && m('.no-items', [
          (account.profile && account.profile.name) ? account.profile.name : 'This account',
          ' hasn\'t posted any threads or comments'
        ]),
        allContent.slice(0, vnode.state.count).map((obj) => {
          if (obj instanceof OffchainThread) return m(ProfileProposal, { proposal: obj });
          else return m(ProfileCommentGroup, { proposal: obj.proposal, comments: [obj] });
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
          return m(ProfileCommentGroup, { proposal: comment.proposal, comments: [comment] });
        }),
      ]),
      ((type === UserContent.All && allContent.length > 10 && vnode.state.count < allContent.length) ||
       (type === UserContent.Threads && proposals.length > 10 && vnode.state.count < proposals.length) ||
       (type === UserContent.Comments && comments.length > 10 && vnode.state.count < comments.length)) &&
        m('.btn-wrap', [
          m('a.btn', {
            onclick: (e) => {
              e.preventDefault();
              vnode.state.count += 10;
            }
          }, 'Load more')
        ])
    ]);
  }
};

export default ProfileContent;
