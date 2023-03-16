import _ from 'lodash';

import { render, ClassComponent } from 'mithrilInterop';
import { link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import type { Account, Comment } from 'models';
import type { Thread } from 'models';

import app from 'state';
import { renderQuillTextBody } from '../../components/quill/helpers';
import withRouter from 'navigation/helpers';

interface IProfileCommentGroupAttrs {
  proposal: Thread | any;
  comments: Array<Comment<any>>;
  account: Account;
}

class ProfileCommentGroupComponent extends ClassComponent<IProfileCommentGroupAttrs> {
  // const ProfileCommentGroup: Component<IProfileCommentGroupAttrs> = {
  view(vnode) {
    const { proposal, comments, account } = vnode.attrs;
    if (!proposal) return;

    const { slug, identifier, title } = proposal.proposal;

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
              `${title}`,
              this.setRoute.bind(this),
              {},
              `profile-${account.address}-${account.chain.id}-${proposal.chain}-scrollY`
            ),
            ' in ',
            link(
              'a.link-bold',
              `/${proposal.chain}`,
              ` ${proposal.chain}`,
              this.setRoute.bind(this)
            ),
          ],
        ]),
        comments[0] &&
          comments[0].createdAt &&
          render('span', comments[0].createdAt.fromNow()),
      ]),
      render('.activity', [
        comments.map((comment) =>
          render('.proposal-comment', [
            render('.comment-text', renderQuillTextBody(comment.text)),
          ])
        ),
      ]),
    ]);
  }
}

const ProfileCommentGroup = withRouter(ProfileCommentGroupComponent);

export default ProfileCommentGroup;
