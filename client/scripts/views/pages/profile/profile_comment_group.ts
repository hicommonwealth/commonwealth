import m from 'mithril';
import _ from 'lodash';

import app from 'state';
import { OffchainThread, OffchainComment, AddressInfo, Account } from 'models';
import User from '../../components/widgets/user';
import { link, slugify } from '../../../helpers';
import QuillFormattedText from '../../components/quill_formatted_text';
import MarkdownFormattedText from '../../components/markdown_formatted_text';

const ProfileCommentGroup : m.Component< { proposal: OffchainThread, comments: Array<OffchainComment<any>>, account: Account<any> } > = {
  view: (vnode) => {
    const { proposal, comments, account } = vnode.attrs;
    if (!proposal) return;
    const { author, createdAt, body, slug, identifier, title, } = proposal;

    return m('.ProfileCommentGroup', [
      m('.summary', [
        m(User, {
          user: new AddressInfo(null, account.address, account.chain, null),
          linkify: true,
          hideAvatar: true,
          tooltip: true
        }),
        ' commented on ',
        link('a', `/${(proposal.chain || proposal.community)}/proposal/${slug}/${identifier}-${slugify(title)}`, 'Loading...'),
        // createdAt ? ` ${createdAt}` : '',
      ]),
      m('.activity', [
        comments.map((comment) => m('.proposal-comment', [
          m('.comment-text', (() => {
            try {
              const doc = JSON.parse(comment.text);
              return m(QuillFormattedText, { doc, collapse: true });
            } catch (e) {
              return m(MarkdownFormattedText, { doc: comment.text, collapse: true });
            }
          })()),
        ])),
      ])
    ]);
  }
};

export default ProfileCommentGroup;
