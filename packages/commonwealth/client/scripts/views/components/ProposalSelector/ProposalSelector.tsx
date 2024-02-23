import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import 'components/ProposalSelector.scss';
import React, { useCallback, useMemo, useState } from 'react';
import app from 'state';
import { useRawEvmProposalsQuery } from 'state/api/proposals';
import { ProposalSelectorItem } from 'views/components/ProposalSelector';
import { parseProposals } from 'views/components/ProposalSelector/utils';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';

type ProposalSelectorProps = {
  proposalsToSet: Array<
    Pick<IAaveProposalResponse | ICompoundProposalResponse, 'identifier'>
  >;
  onSelect: ({ identifier }: { identifier: string }) => void;
};

export const ProposalSelector = ({
  onSelect,
  proposalsToSet,
}: ProposalSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [proposals, setProposals] = useState<
    IAaveProposalResponse[] | ICompoundProposalResponse[]
  >([]);

  const { data, isLoading } = useRawEvmProposalsQuery({
    communityId: app.chain.id,
    chainNetwork: app.chain.network,
  });

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useMemo(() => {
    if (data) {
      const parsedProposals = parseProposals(data, searchTerm);
      setProposals(parsedProposals);
    }
  }, [data, searchTerm]);

  const renderItem = useCallback(
    (
      i: number,
      proposal: IAaveProposalResponse | ICompoundProposalResponse,
    ) => {
      const isSelected = !!proposalsToSet.find(
        (el) => String(el.identifier) === proposal.identifier,
      );

      return (
        <ProposalSelectorItem
          proposal={proposal}
          isSelected={isSelected}
          onClick={(ce) => onSelect({ identifier: ce.identifier })}
        />
      );
    },
    [onSelect, proposalsToSet],
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

      <QueryList<IAaveProposalResponse | ICompoundProposalResponse>
        loading={isLoading}
        options={proposals}
        renderItem={renderItem}
      />
    </div>
  );
};
