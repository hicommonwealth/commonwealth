import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'components/snapshot_proposal_selector.scss';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';

import app from 'state';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { SnapshotProposalSelectorItem } from 'views/components/snapshot_proposal_selector';

type SnapshotProposalSelectorProps = {
  onSelect: (sn: SnapshotProposal) => void;
  snapshotProposalsToSet: Pick<SnapshotProposal, 'id'>[];
};

export const SnapshotProposalSelector = ({
  onSelect,
  snapshotProposalsToSet,
}: SnapshotProposalSelectorProps) => {
  const [allProposals, setAllProposals] = useState<Array<SnapshotProposal>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const queryLength = searchTerm?.trim()?.length;

  const getEmptyContentMessage = () => {
    if (queryLength > 0 && queryLength < 5) {
      return 'Query too short';
    } else if (queryLength >= 5 && !searchTerm.length) {
      return 'No snapshots found';
    } else if (!snapshotProposalsToSet?.length) {
      return 'No currently linked snapshots';
    }
  };

  useEffect(() => {
    if (allProposals.length === 0) {
      setLoading(true);
      loadMultipleSpacesData(app.chain.meta?.snapshot_spaces)
        .then((data = []) => {
          const loadedProposals = data.reduce(
            (acc, curr) => [...acc, ...curr.proposals],
            [],
          );

          setAllProposals(loadedProposals);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, [allProposals]);

  const proposals = useMemo(
    () =>
      allProposals
        .sort((a, b) => b.created - a.created)
        .filter(({ title }) =>
          title.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    [allProposals, searchTerm],
  );

  const renderItem = useCallback(
    (i: number, snapshot: SnapshotProposal) => {
      const isSelected = !!snapshotProposalsToSet.find(
        ({ id }) => id === snapshot.id,
      );

      return (
        <SnapshotProposalSelectorItem
          snapshot={snapshot}
          onClick={() => onSelect(snapshot)}
          isSelected={isSelected}
        />
      );
    },
    [onSelect, snapshotProposalsToSet],
  );

  if (!app.chain || !app.activeChainId()) {
    return;
  }

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // eslint-disable-next-line react/no-multi-comp
  const EmptyComponent = () => (
    <div className="empty-component">{getEmptyContentMessage()}</div>
  );

  return (
    <div className="SnapshotProposalSelector">
      <CWTextInput
        placeholder="Search for snapshot proposals"
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight={searchTerm ? 'close' : 'magnifyingGlass'}
        onInput={handleInputChange}
      />

      <QueryList
        loading={loading}
        options={proposals}
        components={{ EmptyPlaceholder: EmptyComponent }}
        renderItem={renderItem}
      />
    </div>
  );
};
