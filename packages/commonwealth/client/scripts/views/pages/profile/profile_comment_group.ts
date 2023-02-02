import { link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import m from 'mithril';
import type { Account, Comment } from 'models';
import type { Thread } from 'models';

import app from 'state';
import { renderQuillTextBody } from '../../components/quill/helpers';

interface IProfileCommentGroupAttrs {
  proposal: Thread | any;
  comments: Array<Comment<any>>;
  account: Account;
}

const ProfileCommentGroup: m.Component<IProfileCommentGroupAttrs> = {
  view: (vnode) => {
    const { proposal, comments, account } = vnode.attrs;
    if (!proposal) return;

    const { slug, identifier, title } = proposal.proposal;

    // hide rows from communities that don't match
    if (app.isCustomDomain() && proposal.chain !== app.customDomainId()) return;

    return m('.ProfileCommentGroup', [
      m('.summary', [
        m('.summary-group', [
          'Commented',
          proposal.chain && [
            ' on a ',
            link(
              'a.link-bold',
              `/${proposal.chain}${getProposalUrlPath(slug, identifier, true)}`,
              `${title}`,
              {},
              `profile-${account.address}-${account.chain.id}-${proposal.chain}-scrollY`
            ),
            ' in ',
            link('a.link-bold', `/${proposal.chain}`, ` ${proposal.chain}`),
          ],
        ]),
        comments[0] &&
          comments[0].createdAt &&
          m('span', comments[0].createdAt.fromNow()),
      ]),
      m('.activity', [
        comments.map((comment) =>
          m('.proposal-comment', [
            m(
              '.comment-text',
              renderQuillTextBody(comment.text, {
                collapse: true,
              })
            ),
          ])
        ),
      ]),
    ]);
  },
};

export default ProfileCommentGroup;
