/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_components.scss';

import app from 'state';
import { Comment, Thread, AnyProposal } from 'models';
import VersionHistoryModal from 'views/modals/version_history_modal';
import { notifyError } from 'controllers/app/notifications';
import { CWText } from '../../components/component_kit/cw_text';
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
  ThreadLink,
  BlockExplorerLink,
  VotingInterfaceLink,
} from './proposal_header_links';

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
            {proposal.threadId && <ThreadLink proposal={proposal} />}
            {proposal['blockExplorerLink'] && (
              <BlockExplorerLink proposal={proposal} />
            )}
            {proposal['votingInterfaceLink'] && (
              <VotingInterfaceLink proposal={proposal} />
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
