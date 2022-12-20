/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';

import 'pages/snapshot/multiple_snapshots_page.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import {
  loadMultipleSpacesData,
  SnapshotProposal,
  SnapshotSpace,
} from 'helpers/snapshot_utils';
import { Thread } from 'models';
import { SnapshotSpaceCard } from './snapshot_space_card';
import { PageLoading } from '../loading';
import { CardsCollection } from '../../components/cards_collection';
import { CWText } from '../../components/component_kit/cw_text';

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
  proposal: null | Thread
): {
  headerMessage: string;
  redirectOption: string;
  proposal: null | Thread;
} {
  // Default to Enter Snapshot Space View
  let header = SPACES_HEADER_MESSAGES.ENTER_SPACES;
  let redirect = REDIRECT_ACTIONS.ENTER_SPACE;
  let fromProposal = null;

  if (action === 'create-proposal') {
    header = SPACES_HEADER_MESSAGES.NEW_PROPOSAL;
    redirect = REDIRECT_ACTIONS.NEW_PROPOSAL;
  } else if (action === 'create-from-thread') {
    header = SPACES_HEADER_MESSAGES.NEW_PROPOSAL;
    redirect = REDIRECT_ACTIONS.NEW_FROM_THREAD;
    fromProposal = proposal;
  }

  return {
    headerMessage: header,
    redirectOption: redirect,
    proposal: fromProposal,
  };
}

type MultipleSnapshotsPageAttrs = {
  action?: string;
  proposal?: Thread;
};

class MultipleSnapshotsPage extends ClassComponent<MultipleSnapshotsPageAttrs> {
  private snapshotSpaces: string[];
  private spacesMetadata: Array<{
    space: SnapshotSpace;
    proposals: SnapshotProposal[];
  }>;

  view(vnode: ResultNode<MultipleSnapshotsPageAttrs>) {
    const { action, proposal } = vnode.attrs;
    const redirectOptions = redirectHandler(action, proposal);

    if (app.chain && !this.snapshotSpaces) {
      this.snapshotSpaces =
        app.config.chains?.getById(app.activeChainId()).snapshot || [];
      m.redraw();
    }

    const { snapshotSpaces } = this;

    if (!this.spacesMetadata && snapshotSpaces) {
      loadMultipleSpacesData(snapshotSpaces).then((data) => {
        this.spacesMetadata = data;
        m.redraw();
      });

      return <PageLoading />;
    }

    return (
      <Sublayout
      // title="Proposals"
      >
        <div class="MultipleSnapshotsPage">
          <CWText type="h3">{redirectOptions.headerMessage}</CWText>
          {app.chain && this.spacesMetadata && (
            <CardsCollection
              content={
                <>
                  {this.spacesMetadata.map((data) => (
                    <SnapshotSpaceCard
                      space={data.space}
                      proposals={data.proposals}
                      redirectAction={redirectOptions.redirectOption}
                      proposal={redirectOptions.proposal}
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
