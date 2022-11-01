/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_components.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { threadStageToLabel } from 'helpers';
import { Account, Comment, Thread, ThreadStage, AnyProposal } from 'models';
import VersionHistoryModal from 'views/modals/version_history_modal';
import { notifyError } from 'controllers/app/notifications';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { MarkdownFormattedText } from '../../components/quill/markdown_formatted_text';
import { QuillFormattedText } from '../../components/quill/quill_formatted_text';
import {
  QUILL_PROPOSAL_LINES_CUTOFF_LENGTH,
  MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH,
} from './constants';
import { formatBody } from './helpers';
import {
  QueueButton,
  ExecuteButton,
  CancelButton,
} from '../../components/proposals/voting_actions_components';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';
import {
  ProposalHeaderThreadLink,
  ProposalHeaderBlockExplorerLink,
  ProposalHeaderVotingInterfaceLink,
} from './proposal_header_links';

export class ProposalHeaderStage
  implements m.ClassComponent<{ proposal: Thread }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <CWText
        type="caption"
        className={getClasses<{ stage: 'negative' | 'positive' }>(
          {
            stage:
              proposal.stage === ThreadStage.ProposalInReview
                ? 'positive'
                : proposal.stage === ThreadStage.Voting
                ? 'positive'
                : proposal.stage === ThreadStage.Passed
                ? 'positive'
                : proposal.stage === ThreadStage.Failed
                ? 'negative'
                : 'positive',
          },
          'proposal-stage-text'
        )}
        onclick={(e) => {
          e.preventDefault();
          navigateToSubpage(`?stage=${proposal.stage}`);
        }}
      >
        {threadStageToLabel(proposal.stage)}
      </CWText>
    );
  }
}

export class ProposalSubheader
  implements m.ClassComponent<{ proposal: AnyProposal }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <div class="ProposalSubheader">
        <CWText className={`onchain-status-text ${getStatusClass(proposal)}`}>
          {getStatusText(proposal)}
        </CWText>
        {(proposal['blockExplorerLink'] ||
          proposal['votingInterfaceLink'] ||
          proposal.threadId) && (
          <div class="proposal-links">
            {proposal.threadId && (
              <ProposalHeaderThreadLink proposal={proposal} />
            )}
            {proposal['blockExplorerLink'] && (
              <ProposalHeaderBlockExplorerLink proposal={proposal} />
            )}
            {proposal['votingInterfaceLink'] && (
              <ProposalHeaderVotingInterfaceLink proposal={proposal} />
            )}
          </div>
        )}
        <QueueButton proposal={proposal} />
        <ExecuteButton proposal={proposal} />
        <CancelButton proposal={proposal} />
      </div>
    );
  }
}

export class ProposalBodyText
  implements
    m.ClassComponent<{
      item: AnyProposal | Thread | Comment<any>;
    }>
{
  private body: any;
  private collapsed: boolean;

  oninit(vnode) {
    this.collapsed = false;
    formatBody(vnode, true);
  }

  onupdate(vnode) {
    formatBody(vnode, false);
  }

  view(vnode) {
    const { body } = this;

    const getPlaceholder = () => {
      if (!(vnode.attrs.item instanceof Thread)) return;

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

    return <>{text()}</>;
  }
}

// needs refactoring
export class ProposalBodyLastEdited
  implements
    m.ClassComponent<{
      item: Thread | Comment<any>;
    }>
{
  view(vnode) {
    const { item } = vnode.attrs;

    const isThread = item instanceof Thread;

    if (!item.lastEdited) {
      return;
    }

    return (
      <a
        href="#"
        onclick={async (e) => {
          e.preventDefault();

          let postWithHistory;

          const grabHistory = isThread && !item.versionHistory?.length;

          if (grabHistory) {
            try {
              postWithHistory = await app.threads.fetchThreadsFromId([item.id]);
            } catch (err) {
              notifyError('Version history not found.');
              return;
            }
          }

          app.modals.create({
            modal: VersionHistoryModal,
            data: {
              item: grabHistory && postWithHistory ? postWithHistory : item,
            },
          });
        }}
      >
        Edited {item.lastEdited.fromNow()}
      </a>
    );
  }
}
