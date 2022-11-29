/* @jsx m */

import m from 'mithril';

import app from 'state';
import { Account, Thread } from 'models';
import { countLinesQuill, countLinesMarkdown } from './quill/helpers';
import { MarkdownFormattedText } from './quill/markdown_formatted_text';
import { QuillFormattedText } from './quill/quill_formatted_text';
import User from './widgets/user';

const QUILL_PROPOSAL_LINES_CUTOFF_LENGTH = 50;
const MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH = 70;

type CollapsibleBodyTextAttrs = {
  item: Thread;
};

export class CollapsibleBodyText
  implements m.ClassComponent<CollapsibleBodyTextAttrs>
{
  private body: any;
  private collapsed: boolean;

  oninit(vnode: m.Vnode<CollapsibleBodyTextAttrs>) {
    const { item } = vnode.attrs;

    this.collapsed = false;
    this.body = item.body;

    try {
      const doc = JSON.parse(item.body);
      if (countLinesQuill(doc.ops) > QUILL_PROPOSAL_LINES_CUTOFF_LENGTH) {
        this.collapsed = true;
      }
    } catch (e) {
      if (
        countLinesMarkdown(item.body) > MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH
      ) {
        this.collapsed = true;
      }
    }
  }

  onupdate(vnode: m.Vnode<CollapsibleBodyTextAttrs>) {
    const { item } = vnode.attrs;

    this.body = item.body;
  }

  view(vnode: m.Vnode<CollapsibleBodyTextAttrs>) {
    const { body } = this;

    const getPlaceholder = () => {
      const author: Account = app.chain
        ? app.chain.accounts.get(vnode.attrs.item.author)
        : null;

      return author ? (
        <>
          {m(User, {
            user: author,
            hideAvatar: true,
            hideIdentityIcon: true,
          })}{' '}
          created this thread
        </>
      ) : (
        'Created this thread'
      );
    };

    const text = () => {
      try {
        const doc = JSON.parse(body);

        if (!doc.ops) throw new Error();

        if (
          doc.ops.length === 1 &&
          doc.ops[0] &&
          typeof doc.ops[0].insert === 'string' &&
          doc.ops[0].insert.trim() === ''
        ) {
          return getPlaceholder();
        }

        return (
          <QuillFormattedText
            doc={doc}
            cutoffLines={QUILL_PROPOSAL_LINES_CUTOFF_LENGTH}
            collapse={false}
            hideFormatting={false}
          />
        );
      } catch (e) {
        if (body?.toString().trim() === '') {
          return getPlaceholder();
        }

        return (
          <MarkdownFormattedText
            doc={body}
            cutoffLines={MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH}
          />
        );
      }
    };

    return text();
  }
}
