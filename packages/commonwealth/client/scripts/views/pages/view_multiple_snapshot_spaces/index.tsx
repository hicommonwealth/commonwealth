import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import 'pages/snapshot/multiple_snapshots_page.scss';
import React from 'react';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { Skeleton } from '../../components/Skeleton';
import { CardsCollection } from '../../components/cards_collection';
import { SnapshotSpaceCard } from './SnapshotSpaceCard';

const MultipleSnapshotsPage = () => {
  const { data: community } = useGetCommunityByIdQuery({
    id: app.activeChainId(),
  });
  const snapshotSpaces: string[] = community?.snapshot_spaces || [];

  const [spacesMetadata, setSpacesMetadata] = React.useState<
    Array<{
      space: SnapshotSpace;
      proposals: SnapshotProposal[];
    }>
  >();

  if (!spacesMetadata && snapshotSpaces.length > 0) {
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
                proposals={[]}
                space={{} as any}
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
        {app.chain && spacesMetadata && (
          <CardsCollection
            content={spacesMetadata.map((data, index) => (
              <SnapshotSpaceCard
                key={index}
                space={data.space}
                proposals={data.proposals}
              />
            ))}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default MultipleSnapshotsPage;
