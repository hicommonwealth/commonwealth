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
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';

const ContractsPage = () => {
  const navigate = useCommonNavigate();

  const [contracts, setContracts] = useState<Contract[]>(
    app.contracts.store.getCommunityContracts()
  );

  const [tabOn, setTabOn] = useState<'contracts' | 'templates'>('templates');

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

  console.log(app.contracts.store.getCommunityContracts());

  return (
    <Sublayout>
      <div className="ContractsPage">
        <CWBreadcrumbs breadcrumbs={[{ label: 'Contracts', path: '' }]} />
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

        <div className="Tabs">
          <CWTabBar>
            <CWTab
              label="Contracts and actions"
              onClick={() => {
                setTabOn('contracts');
              }}
              isSelected={tabOn === 'contracts'}
            />
            <CWTab
              label="Template library"
              onClick={() => {
                setTabOn('templates');
              }}
              isSelected={tabOn === 'templates'}
            />
          </CWTabBar>
        </div>
        {tabOn === 'contracts' ? (
          <>
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
          </>
        ) : (
          <div className="Table">
            <div className="table-row dark top">
              <CWText fontWeight="medium" type="caption" className="ColumnText">
                TEMPLATE NAME
              </CWText>
              <CWText fontWeight="medium" type="caption" className="ColumnText">
                CREATED BY
              </CWText>
              <CWText fontWeight="medium" type="caption" className="ColumnText">
                CREATED IN
              </CWText>
            </div>
          </div>
        )}
      </div>
    </Sublayout>
  );
};

export default ContractsPage;
