/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_components.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { threadStageToLabel } from 'helpers';
import { Comment, Thread, ThreadStage, AnyProposal } from 'models';
import VersionHistoryModal from 'views/modals/version_history_modal';
import { notifyError } from 'controllers/app/notifications';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
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
