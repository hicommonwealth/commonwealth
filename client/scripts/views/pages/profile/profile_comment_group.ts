import m from 'mithril';
import _ from 'lodash';

import app from 'state';
import { link, slugify } from 'helpers';
import { OffchainThread, OffchainComment, AddressInfo, Account } from 'models';

import User from 'views/components/widgets/user';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';

interface IProfileCommentGroupAttrs {
  proposal: OffchainThread | any;
  comments: Array<OffchainComment<any>>;
  account: Account<any>;
}

const ProfileCommentGroup : m.Component<IProfileCommentGroupAttrs> = {
  view: (vnode) => {
    const { proposal, comments, account } = vnode.attrs;
    if (!proposal) return;

    const { slug, identifier } = proposal;

    return m('.ProfileCommentGroup', [
      m('.summary', [
        m(User, {
          user: new AddressInfo(null, account.address, account.chain, null),
          linkify: true,
          hideAvatar: true,
          popover: true
        }),
        ' commented',
        (proposal.chain || proposal.community) && [
          ' on a ',
          link('a', `/${proposal.chain || proposal.community}/proposal/${slug}/${identifier}`,
            (proposal instanceof OffchainThread) ? 'thread' : 'proposal')
        ],
        comments[0] && comments[0].createdAt && [
          m.trust(' &middot; '),
          m('span', comments[0].createdAt.fromNow()),
        ]
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
