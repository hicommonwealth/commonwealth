import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'components/snapshot_proposal_selector.scss';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import type { Thread } from 'models';

import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { SnapshotProposalSelectorItem } from 'views/components/snapshot_proposal_selector';

type SnapshotProposalSelectorProps = {
  onSelect: (sn: SnapshotProposal) => void;
  snapshotProposalsToSet: SnapshotProposal[];
  thread: Thread;
};

export const SnapshotProposalSelector = ({
  onSelect,
  thread,
}: SnapshotProposalSelectorProps) => {
  const [allProposals, setAllProposals] = useState<Array<SnapshotProposal>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (allProposals.length === 0) {
      setLoading(true);
      loadMultipleSpacesData(app.chain.meta.snapshot).then((data = []) => {
        const loadedProposals = data.reduce(
          (acc, curr) => [...acc, ...curr.proposals],
          []
        );

        setAllProposals(loadedProposals);
        setLoading(false);
      });
    }
  }, [allProposals]);

  const proposals = useMemo(
    () =>
      allProposals
        .sort((a, b) => b.created - a.created)
        .filter(({ title }) =>
          title.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [allProposals, searchTerm]
  );

  const renderItem = useCallback(
    (i: number, snapshot: SnapshotProposal) => {
      const isSelected = thread.snapshotProposal === snapshot.id;

      return (
        <SnapshotProposalSelectorItem
          snapshot={snapshot}
          onClick={() => onSelect(snapshot)}
          isSelected={isSelected}
        />
      );
    },
    [onSelect, thread.snapshotProposal]
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

  return (
    <div className="SnapshotProposalSelector">
      <CWTextInput
        placeholder="Search for an existing snapshot proposal..."
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight="close"
        onInput={handleInputChange}
      />

      <QueryList
        loading={loading}
        options={proposals}
        renderItem={renderItem}
      />
    </div>
  );
};
