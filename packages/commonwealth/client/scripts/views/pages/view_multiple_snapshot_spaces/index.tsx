import React from 'react';

import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import type Thread from '../../../models/Thread';

import 'pages/snapshot/multiple_snapshots_page.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { CardsCollection } from '../../components/cards_collection';
import { CWText } from '../../components/component_kit/cw_text';
import { PageLoading } from '../loading';
import { SnapshotSpaceCard } from './snapshot_space_card';

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

type MultipleSnapshotsPageProps = {
  action?: string;
  proposal?: Thread;
};

const MultipleSnapshotsPage = (props: MultipleSnapshotsPageProps) => {
  const { action, proposal } = props;

  const [snapshotSpaces, setSnapshotSpaces] = React.useState<Array<string>>();
  const [spacesMetadata, setSpacesMetadata] = React.useState<
    Array<{
      space: SnapshotSpace;
      proposals: SnapshotProposal[];
    }>
  >();

  const redirectOptions = redirectHandler(action, proposal);

  if (app.chain && !snapshotSpaces) {
    setSnapshotSpaces(
      app.config.chains?.getById(app.activeChainId()).snapshot || []
    );
  }

  if (!spacesMetadata && snapshotSpaces) {
    loadMultipleSpacesData(snapshotSpaces).then((data) => {
      setSpacesMetadata(data);
    });

    return <PageLoading />;
  }

  return (
    <Sublayout>
      <div className="MultipleSnapshotsPage">
        <CWText type="h3">{redirectOptions.headerMessage}</CWText>
        {app.chain && spacesMetadata && (
          <CardsCollection
            content={spacesMetadata.map((data) => (
              <SnapshotSpaceCard
                space={data.space}
                proposals={data.proposals}
                redirectAction={redirectOptions.redirectOption}
                proposal={redirectOptions.proposal}
              />
            ))}
          />
        )}
      </div>
    </Sublayout>
  );
};

export default MultipleSnapshotsPage;
