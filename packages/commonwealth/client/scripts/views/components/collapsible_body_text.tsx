/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, redraw } from 'mithrilInterop';

import app from 'state';
import { AnyProposal, Thread } from 'models';
import { countLinesQuill, countLinesMarkdown } from './quill/helpers';
import { MarkdownFormattedText } from './quill/markdown_formatted_text';
import { QuillFormattedText } from './quill/quill_formatted_text';
import User from './widgets/user';

const QUILL_PROPOSAL_LINES_CUTOFF_LENGTH = 50;
const MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH = 70;

type CollapsibleThreadBodyAttrs = {
  thread: Thread;
};

export class CollapsibleThreadBody extends ClassComponent<CollapsibleThreadBodyAttrs> {
  private body: any;
  private collapsed: boolean;

  oninit(vnode: ResultNode<CollapsibleThreadBodyAttrs>) {
    const { thread } = vnode.attrs;

    this.collapsed = false;
    this.body = thread.body;

    try {
      const doc = JSON.parse(thread.body);
      if (countLinesQuill(doc.ops) > QUILL_PROPOSAL_LINES_CUTOFF_LENGTH) {
        this.collapsed = true;
      }
    } catch (e) {
      if (
        countLinesMarkdown(thread.body) > MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH
      ) {
        this.collapsed = true;
      }
    }
  }

  onupdate(vnode: ResultNode<CollapsibleThreadBodyAttrs>) {
    const { thread } = vnode.attrs;

    this.body = thread.body;
  }

  view(vnode: ResultNode<CollapsibleThreadBodyAttrs>) {
    const { body } = this;

    const getPlaceholder = () => {
      const author = app.chain
        ? app.chain.accounts.get(vnode.attrs.thread.author)
        : null;

      return author ? (
        <>
          {render(User, {
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

type CollapsibleProposalBodyAttrs = {
  proposal: AnyProposal;
};

export class CollapsibleProposalBody extends ClassComponent<CollapsibleProposalBodyAttrs> {
  private body: any;
  private collapsed: boolean;

  oninit(vnode: ResultNode<CollapsibleProposalBodyAttrs>) {
    const { proposal } = vnode.attrs;

    this.collapsed = false;
    this.body = proposal.description;

    try {
      const doc = JSON.parse(proposal.description);
      if (countLinesQuill(doc.ops) > QUILL_PROPOSAL_LINES_CUTOFF_LENGTH) {
        this.collapsed = true;
      }
    } catch (e) {
      if (
        countLinesMarkdown(proposal.description) >
        MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH
      ) {
        this.collapsed = true;
      }
    }
  }

  onupdate(vnode: ResultNode<CollapsibleProposalBodyAttrs>) {
    const { proposal } = vnode.attrs;

    this.body = proposal.description;
  }

  view() {
    const { body } = this;

    const text = () => {
      try {
        const doc = JSON.parse(body);

        if (!doc.ops) throw new Error();

        return (
          <QuillFormattedText
            doc={doc}
            cutoffLines={QUILL_PROPOSAL_LINES_CUTOFF_LENGTH}
            collapse={false}
            hideFormatting={false}
          />
        );
      } catch (e) {
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
