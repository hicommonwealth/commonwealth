import m from 'mithril';
import _ from 'lodash';

import app from 'state';
import { link } from 'helpers';
import { OffchainThread, OffchainComment, AddressInfo, Account } from 'models';
import { getProposalUrlPath } from 'identifiers';

import User from 'views/components/widgets/user';
import QuillFormattedText from 'views/components/quill_formatted_text';
import { MarkdownFormattedText } from 'views/components/markdown_formatted_text';

interface IProfileCommentGroupAttrs {
  proposal: OffchainThread | any;
  comments: Array<OffchainComment<any>>;
  account: Account<any>;
}

const ProfileCommentGroup: m.Component<IProfileCommentGroupAttrs> = {
  view: (vnode) => {
    const { proposal, comments, account } = vnode.attrs;
    if (!proposal) return;

    const { slug, identifier } = proposal;

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
              proposal instanceof OffchainThread ? 'thread' : 'proposal',
              {},
              `profile-${account.address}-${account.chain}-${proposal.chain}-scrollY`
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
              (() => {
                try {
                  const doc = JSON.parse(comment.text);
                  if (!doc.ops) throw new Error();
                  return m(QuillFormattedText, { doc, collapse: true });
                } catch (e) {
                  return m(MarkdownFormattedText, {
                    doc: comment.text,
                    collapse: true,
                  });
                }
              })()
            ),
          ])
        ),
      ]),
    ]);
  },
};

export default ProfileCommentGroup;
