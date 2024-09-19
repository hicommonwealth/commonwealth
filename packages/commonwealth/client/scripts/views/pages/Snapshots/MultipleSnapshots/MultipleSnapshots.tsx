import React from 'react';

import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { Skeleton } from 'views/components/Skeleton';
import { CardsCollection } from 'views/components/cards_collection';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

import { SnapshotSpaceCard } from './SnapshotSpaceCard';

import './MultipleSnapshots.scss';

const MultipleSnapshots = () => {
  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });
  const snapshotSpaces: string[] = community?.snapshot_spaces || [];

  const [spacesMetadata, setSpacesMetadata] = React.useState<
    Array<{
      space: SnapshotSpace;
      proposals: SnapshotProposal[];
    }>
  >();

  if (!spacesMetadata && snapshotSpaces.length > 0) {
    void loadMultipleSpacesData(snapshotSpaces).then((data) => {
      setSpacesMetadata(data);
    });

    return (
      <CWPageLayout>
        <div className="MultipleSnapshots">
          <Skeleton count={1} width="40%" />
          <br />
          <CardsCollection
            content={Array.from({ length: 2 }).map((_, index) => (
              <SnapshotSpaceCard
                key={index}
                showSkeleton={true}
                proposals={[]}
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
      <div className="MultipleSnapshots">
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

export default MultipleSnapshots;
