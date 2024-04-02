import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import 'pages/snapshot/multiple_snapshots_page.scss';
import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import type Thread from '../../../models/Thread';
import { Skeleton } from '../../components/Skeleton';
import { CardsCollection } from '../../components/cards_collection';
import { CWText } from '../../components/component_kit/cw_text';
import { SnapshotSpaceCard } from './SnapshotSpaceCard';

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
  proposal: null | Thread,
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
      app.config.chains?.getById(app.activeChainId()).snapshot || [],
    );
  }

  if (!spacesMetadata && snapshotSpaces) {
    loadMultipleSpacesData(snapshotSpaces).then((data) => {
      setSpacesMetadata(data);
    });

    return (
      <CWPageLayout>
        <div className="MultipleSnapshotsPage">
          <Skeleton count={1} width="40%" />
          <br />
          <CardsCollection
            content={Array.from({ length: 2 }).map((_, index) => (
              <SnapshotSpaceCard
                key={index}
                showSkeleton={true}
                proposal={null}
                proposals={[]}
                redirectAction=""
                space={{} as SnapshotSpace}
              />
            ))}
          />
        </div>
      </CWPageLayout>
    );
  }

  return (
    <CWPageLayout>
      <div className="MultipleSnapshotsPage">
        <CWText type="h3">{redirectOptions.headerMessage}</CWText>
        {app.chain && spacesMetadata && (
          <CardsCollection
            content={spacesMetadata.map((data, index) => (
              <SnapshotSpaceCard
                key={index}
                space={data.space}
                proposals={data.proposals}
                redirectAction={redirectOptions.redirectOption}
                proposal={redirectOptions.proposal}
              />
            ))}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default MultipleSnapshotsPage;
