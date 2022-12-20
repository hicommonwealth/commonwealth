
import _ from 'lodash';

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';
import app from 'state';
import { link } from 'helpers';
import { Thread, Comment, Account } from 'models';
import { getProposalUrlPath } from 'identifiers';
import { renderQuillTextBody } from '../../components/quill/helpers';

interface IProfileCommentGroupAttrs {
  proposal: Thread | any;
  comments: Array<Comment<any>>;
  account: Account;
}

const ProfileCommentGroup: Component<IProfileCommentGroupAttrs> = {
  view: (vnode) => {
    const { proposal, comments, account } = vnode.attrs;
    if (!proposal) return;

    const { slug, identifier } = proposal;

    // hide rows from communities that don't match
    if (app.isCustomDomain() && proposal.chain !== app.customDomainId()) return;

    return render('.ProfileCommentGroup', [
      render('.summary', [
        render('.summary-group', [
          'Commented',
          proposal.chain && [
            ' on a ',
            link(
              'a.link-bold',
              `/${proposal.chain}${getProposalUrlPath(slug, identifier, true)}`,
              proposal instanceof Thread ? 'thread' : 'proposal',
              {},
              `profile-${account.address}-${account.chain.id}-${proposal.chain}-scrollY`
            ),
            ' in ',
            link('a.link-bold', `/${proposal.chain}`, ` ${proposal.chain}`),
          ],
        ]),
        comments[0] &&
          comments[0].createdAt &&
          render('span', comments[0].createdAt.fromNow()),
      ]),
      render('.activity', [
        comments.map((comment) =>
          render('.proposal-comment', [
            render(
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
