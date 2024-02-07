import React, { useCallback, useMemo, useState } from 'react';

import 'components/ProposalSelector.scss';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';

import app, { ApiStatus } from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { CosmosProposalSelectorItem } from 'views/components/CosmosProposalSelector';
import { useGetAllCosmosProposals } from 'hooks/cosmos/useGetAllCosmosProposals';

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
  const { activeCosmosProposals = [], completedCosmosProposals = [] } =
    useGetAllCosmosProposals({
      app,
      setIsLoadingActiveProposals: setActiveLoading,
      setIsLoadingCompletedProposals: setCompletedProposalsLoading,
      needToInitAPI:
        !app.chain.apiInitialized &&
        app.chain.networkStatus !== ApiStatus.Connecting,
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
    <div className="ProposalSelector">
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
