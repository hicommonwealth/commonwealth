import React, { useState } from 'react';
import 'pages/contracts/contracts_page.scss';
import app from 'state';

import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';
import { CWButton } from 'views/components/component_kit/cw_button';
import { ContractCard } from './contract_card';
import { useCommonNavigate } from 'navigation/helpers';
import Contract from 'models/Contract';

const ContractsPage = () => {
  const navigate = useCommonNavigate();

  const [contracts, setContracts] = useState<Contract[]>(
    app.contracts.store.getCommunityContracts()
  );

  const handleAddContract = () => {
    navigate(`/new/contract`);
  };

  if (!app.contracts || !app.chain) {
    return <PageLoading message="Contracts Page" />;
  }

  const onUpdateSuccess = () => {
    const updatedContracts = app.contracts.store.getCommunityContracts();
    setContracts([...updatedContracts]);
  };

  return (
    <Sublayout>
      <div className="ContractsPage">
        <CWBreadcrumbs breadcrumbs={[{ label: 'Contracts' }]} />
        <div className="header-container">
          <CWText type="h3">Contract Action Templates</CWText>
          <CWButton
            buttonType="mini-white"
            label="Add Contract"
            iconLeft="plus"
            onClick={handleAddContract}
          />
        </div>

        <CWText className="subheader" type="b1">
          Add community contracts and associated templates
        </CWText>

        {contracts.length ? (
          <div className="contracts-container">
            {contracts.map((contract) => (
              <ContractCard
                key={contract.id}
                id={contract.id}
                address={contract.address}
                templates={contract.ccts}
                onUpdateSuccess={onUpdateSuccess}
              />
            ))}
          </div>
        ) : (
          <div className="no-contracts-container">
            <CWText className="no-contracts-info" type="b1">
              You currently have no linked contracts.
            </CWText>
          </div>
        )}
      </div>
    </Sublayout>
  );
};

export default ContractsPage;
