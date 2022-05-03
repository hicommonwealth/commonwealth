/* @jsx m */

import m from 'mithril';

import 'pages/snapshot/multiple_snapshots_page.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import {
  loadMultipleSpacesData,
  SnapshotProposal,
  SnapshotSpace,
} from 'helpers/snapshot_utils';
import { OffchainThread } from 'client/scripts/models';
import { SnapshotSpaceCard } from './snapshot_space_card';
import { PageLoading } from '../loading';
import { CardsCollection } from '../../components/cards_collection';

enum SPACES_HEADER_MESSAGES {
  NEW_PROPOSAL = 'Select a Snapshot Space to Create a Proposal:',
  ENTER_SPACES = 'Community Snapshot Spaces',
}

export enum REDIRECT_ACTIONS {
  NEW_PROPOSAL = 'NEW_PROPOSAL',
  NEW_FROM_THREAD = 'NEW_FROM_THREAD',
  ENTER_SPACE = 'ENTER_SPACE',
}

function redirectHandler(
  action: string,
  proposal: null | OffchainThread
): {
  header_message: string;
  redirect_option: string;
  proposal: null | OffchainThread;
} {
  // Default to Enter Snapshot Space View
  let header = SPACES_HEADER_MESSAGES.ENTER_SPACES;
  let redirect = REDIRECT_ACTIONS.ENTER_SPACE;
  let from_proposal = null;

  if (action === 'create-proposal') {
    header = SPACES_HEADER_MESSAGES.NEW_PROPOSAL;
    redirect = REDIRECT_ACTIONS.NEW_PROPOSAL;
  } else if (action === 'create-from-thread') {
    header = SPACES_HEADER_MESSAGES.NEW_PROPOSAL;
    redirect = REDIRECT_ACTIONS.NEW_FROM_THREAD;
    from_proposal = proposal;
  }

  return {
    header_message: header,
    redirect_option: redirect,
    proposal: from_proposal,
  };
}

class MultipleSnapshotsPage
  implements
    m.ClassComponent<{
      action?: string;
      proposal?: OffchainThread;
    }>
{
  private snapshot_spaces: string[];
  private spaces_metadata: Array<{
    space: SnapshotSpace;
    proposals: SnapshotProposal[];
  }>;

  view(vnode) {
    const { action, proposal } = vnode.attrs;
    const redirect_options = redirectHandler(action, proposal);

    if (app.chain && !this.snapshot_spaces) {
      this.snapshot_spaces =
        app.config.chains?.getById(app.activeChainId()).snapshot || [];
      m.redraw();
    }

    const { snapshot_spaces } = this;

    if (!this.spaces_metadata && snapshot_spaces) {
      loadMultipleSpacesData(snapshot_spaces).then((data) => {
        this.spaces_metadata = data;
        m.redraw();
      });

      return <PageLoading />;
    }

    return (
      <Sublayout title="Proposals" showNewProposalButton={true}>
        <div class="MultipleSnapshotsPage">
          <h3>{redirect_options.header_message}</h3>
          {app.chain && this.spaces_metadata && (
            <CardsCollection
              content={
                <>
                  {this.spaces_metadata.map((data) => (
                    <SnapshotSpaceCard
                      space={data.space}
                      proposals={data.proposals}
                      redirect_action={redirect_options.redirect_option}
                      proposal={redirect_options.proposal}
                    />
                  ))}
                </>
              }
            />
          )}
        </div>
      </Sublayout>
    );
  }
}

export default MultipleSnapshotsPage;
