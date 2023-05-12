import React, { useCallback, useMemo, useState } from 'react';

import 'components/ChainEntitiesSelector.scss';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';

import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { useGetCompletedCosmosProposals } from 'hooks/cosmos/useGetCompletedCosmosProposals';
import { useGetActiveCosmosProposals } from 'hooks/cosmos/useGetActiveCosmosProposals';
import { CosmosProposalSelectorItem } from 'views/components/CosmosProposalSelector';

const filterProposals = (ce: CosmosProposal, searchTerm: string) => {
  return (
    ce.identifier.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    ce.title?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
};

type ProposalSelectorProps = {
  proposalsToSet: Array<Pick<CosmosProposal, 'identifier' | 'title'>>;
  onSelect: ({ identifier }: { identifier: string; title: string }) => void;
};

export const CosmosProposalSelector = ({
  onSelect,
  proposalsToSet,
}: ProposalSelectorProps) => {
  const [loadingCompletedProposals, setCompletedProposalsLoading] =
    useState(false);
  const [loadingActive, setActiveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { activeCosmosProposals } = useGetActiveCosmosProposals({
    app,
    setIsLoading: setActiveLoading,
    isLoading: loadingActive,
  });
  const { completedCosmosProposals } = useGetCompletedCosmosProposals({
    app,
    setIsLoading: setCompletedProposalsLoading,
    isLoading: loadingCompletedProposals,
  });

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
        <CosmosProposalSelectorItem
          proposal={proposal}
          isSelected={isSelected}
          onClick={(ce) =>
            onSelect({ identifier: ce.identifier, title: ce.title })
          }
        />
      );
    },
    [onSelect, proposalsToSet]
  );

  if (!app.chain || !app.activeChainId()) {
    return;
  }

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
      {loadingCompletedProposals && (
        <p style={{ color: 'grey' }}>Loading completed proposals...</p>
      )}
    </div>
  );
};
