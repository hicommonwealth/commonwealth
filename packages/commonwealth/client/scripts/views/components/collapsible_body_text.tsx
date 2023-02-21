import React, { useEffect, useState } from 'react';

import { ClassComponent } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import type { AnyProposal, Thread } from 'models';

import app from 'state';
import { countLinesMarkdown, countLinesQuill } from './quill/helpers';
import { MarkdownFormattedText } from './quill/markdown_formatted_text';
import { QuillFormattedText } from './quill/quill_formatted_text';
import { User } from './user/user';
import { CWText } from './component_kit/cw_text';

const QUILL_PROPOSAL_LINES_CUTOFF_LENGTH = 50;
const MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH = 70;

type CollapsibleThreadBodyProps = {
  thread: Thread;
};

// 1) TODO: Port CollapsibleProposalBody to React.FC.
// 2) This component is not actually used to dynamically collapse threads.
// That happens entirely in QuillFormattedText.

export const CollapsibleThreadBody = (props: CollapsibleThreadBodyProps) => {
  const { thread } = props;

  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const doc = JSON.parse(thread.body);
      if (countLinesQuill(doc.ops) > QUILL_PROPOSAL_LINES_CUTOFF_LENGTH) {
        setCollapsed(true);
      }
    } catch (e) {
      if (
        countLinesMarkdown(thread.body) > MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH
      ) {
        setCollapsed(true);
      }
    }
  }, [thread.body]);

  const getPlaceholder = () => {
    const author = app.chain ? app.chain.accounts.get(thread.author) : null;

    return author ? (
      <>
        <User user={author} hideAvatar /> created this thread
      </>
    ) : (
      <CWText>Created this thread</CWText>
    );
  };

  try {
    const doc = JSON.parse(thread.body);

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
        hideFormatting={false}
      />
    );
  } catch (e) {
    if (thread.body?.toString().trim() === '') {
      return getPlaceholder();
    }

    return (
      thread.body && (
        <MarkdownFormattedText
          doc={thread.body}
          cutoffLines={MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH}
        />
      )
    );
  }
};

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
            hideFormatting={false}
          />
        );
      } catch (e) {
        return (
          body && (
            <MarkdownFormattedText
              doc={body}
              cutoffLines={MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH}
            />
          )
        );
      }
    };

    return text();
  }
}
