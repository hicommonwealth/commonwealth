import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'components/chain_entities_selector.scss';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';

import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { useGetCompletedCosmosProposals } from 'hooks/cosmos/useGetCompletedCosmosProposals';
import {ProposalSelectorItem} from 'views/components/cosmos_proposal_selector/cosmos_proposal_selector_item'
import { CWText } from '../component_kit/cw_text';

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
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { completedCosmosProposals } = useGetCompletedCosmosProposals({
        app,
        setIsLoading: setLoading,
        isLoading: loading,
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

    const entities = useMemo(
    () =>
        completedCosmosProposals
        .filter((el) => filterProposals(el, searchTerm)),
    [completedCosmosProposals, searchTerm]
    );
    
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
      console.log(entities)
      console.log(renderItem)

      const EmptyComponent = () => (
        <div className="empty-component">{getEmptyContentMessage()}</div>
      );

      return (
        <div className="ProposalSelector">
          <CWTextInput
            placeholder="Search for an existing proposal..."
            iconRightonClick={handleClearButtonClick}
            value={searchTerm}
            iconRight="close"
            onInput={handleInputChange}
          />

          <QueryList loading={loading} options={entities} components={{ EmptyPlaceholder: EmptyComponent }} renderItem={renderItem} />
        </div>
    );
  }
