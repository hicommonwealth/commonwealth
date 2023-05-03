import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'components/chain_entities_selector.scss';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';

import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { useGetCompletedCosmosProposals } from 'hooks/cosmos/useGetCompletedCosmosProposals';
import { useGetActiveCosmosProposals } from 'hooks/cosmos/useGetActiveCosmosProposals';
import { ProposalSelectorItem } from 'views/components/cosmos_proposal_selector/cosmos_proposal_selector_item';

const filterProposals = (ce: CosmosProposal, searchTerm: string) => {
  return (
    ce.identifier.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    ce.title?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
};

type ProposalSelectorProps = {
  proposalsToSet: Array<Pick<CosmosProposal, 'identifier'>>;
  onSelect: ({ identifier }: { identifier: string }) => void;
};

export const ProposalSelector = ({
  onSelect,
  proposalsToSet,
}: ProposalSelectorProps) => {
  const [loadingCompleted, setCompletedLoading] = useState(false);
  const [loadingActive, setActiveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { activeCosmosProposals } = useGetActiveCosmosProposals({
    app,
    setIsLoading: setActiveLoading,
    isLoading: loadingActive,
  });
  const { completedCosmosProposals } = useGetCompletedCosmosProposals({
    app,
    setIsLoading: setCompletedLoading,
    isLoading: loadingCompleted,
  });

  const queryLength = searchTerm?.trim()?.length;
  const getEmptyContentMessage = () => {
    if (queryLength > 0 && queryLength < 5) {
      return 'Query too short';
    } else if (queryLength >= 5 && !searchTerm.length) {
      return 'No proposals found';
    } else if (!completedCosmosProposals?.length) {
      return 'No currently linked proposals';
    }
  };

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const entities = useMemo(() => {
    const allProposals = [
      ...activeCosmosProposals,
      ...completedCosmosProposals,
    ];
    return allProposals
      .sort((a, b) => parseInt(b.identifier) - parseInt(a.identifier))
      .filter((el) => filterProposals(el, searchTerm));
  }, [activeCosmosProposals, completedCosmosProposals, searchTerm]);

  const renderItem = useCallback(
    (i: number, proposal: CosmosProposal) => {
      const isSelected = !!proposalsToSet.find(
        (el) => String(el.identifier) === proposal.identifier
      );

      return (
        <ProposalSelectorItem
          proposal={proposal}
          isSelected={isSelected}
          onClick={(ce) => onSelect({ identifier: ce.identifier })}
        />
      );
    },
    [onSelect, proposalsToSet]
  );

  if (!app.chain || !app.activeChainId()) {
    return;
  }

  const EmptyComponent = () => (
    <div className="empty-component">{getEmptyContentMessage()}</div>
  );

  return (
    <div className="ChainEntitiesSelector">
      <CWTextInput
        placeholder="Search for an existing proposal..."
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight="close"
        onInput={handleInputChange}
      />

      <QueryList
        loading={loadingActive}
        options={entities}
        renderItem={renderItem}
      />
    </div>
  );
};
