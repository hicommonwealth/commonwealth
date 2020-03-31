import m from 'mithril';
import _ from 'lodash';

import app from 'state';
import { OffchainThread, OffchainComment } from '../../../models/models';
import User from '../../components/widgets/user';
import { link, slugify } from '../../../helpers';
import QuillFormattedText from '../../components/quill_formatted_text';
import MarkdownFormattedText from '../../components/markdown_formatted_text';

const ProfileCommentGroup : m.Component< { proposal: OffchainThread, comments: Array<OffchainComment<any>> } > = {
  view: (vnode) => {
    const { proposal, comments } = vnode.attrs;
    const { author, createdAt, body, slug, identifier, title } = proposal;

    return m('.ProfileCommentGroup', [
      m('.summary', [
        m(User, { user: [comments[0].author, comments[0].chain], linkify: true, hideAvatar: true, tooltip: true }),
        ' commented on ',
        link('a', `/${app.activeChainId()}/proposal/${slug}/${identifier}-${slugify(title)}`, title),
        ` ${createdAt.fromNow()}`
      ]),
      m('.activity', [
        comments.map((comment) => m('.proposal-comment', [
          m('.comment-text', (() => {
            try {
              const doc = JSON.parse(comment.text);
              return m(QuillFormattedText, { doc, collapsed: true });
            } catch (e) {
              return m(MarkdownFormattedText, { doc: comment.text, collapsed: true });
            }
          })()),
        ])),
      ])
    ]);
  }
};

export default ProfileCommentGroup;
