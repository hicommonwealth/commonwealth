import React, { useEffect, useState } from 'react';
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
import Template from 'models/Template';
import { User } from '../../components/user/user';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

const ContractsPage = () => {
  const navigate = useCommonNavigate();

  const [contracts, setContracts] = useState<Contract[]>(
    app.contracts.store.getCommunityContracts()
  );

  const [templates, setTemplates] = useState<Template[]>([]);
  const [noContractsAlertDisplayed, setNoContractsAlertDisplayed] =
    useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (contracts.length > 0) {
        const fetchedTemplates = [];
        for (const contract of contracts) {
          const templatesForContract =
            await app.contracts.getTemplatesForContract(contract.id);

          fetchedTemplates.push(...templatesForContract);
        }

        setTemplates(
          fetchedTemplates.map((template) => {
            return Template.fromJSON(template);
          })
        );
      }
    };

    fetchTemplates();
  }, [contracts, setTemplates]);

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
                  You currently have no contracts or actions. Add a contract to
                  enable on-chain actions for your community.
                </CWText>
              </div>
            )}
          </>
        ) : (
          <div className="template-display-section">
            {contracts.length === 0 && noContractsAlertDisplayed && (
              <div className="no-contract-alert">
                <div className="information">
                  <CWIcon iconName="infoEmpty" />
                  <CWText className="info-text">
                    Make sure you have connected a contract in order to see
                    compatible action templates and to create your own action
                    templates.
                  </CWText>
                </div>
                <CWIcon
                  iconName="close"
                  iconSize="small"
                  className="closeIcon"
                  onClick={() => {
                    setNoContractsAlertDisplayed(false);
                  }}
                />
              </div>
            )}
            <div className="Table">
              <div className="table-row dark top">
                <div className="table-column">
                  <CWText
                    fontWeight="medium"
                    type="caption"
                    className="ColumnText"
                  >
                    TEMPLATE NAME
                  </CWText>
                </div>
                <div className="table-column">
                  <CWText
                    fontWeight="medium"
                    type="caption"
                    className="ColumnText"
                  >
                    CREATED BY
                  </CWText>
                </div>
                <div className="table-column">
                  <CWText
                    fontWeight="medium"
                    type="caption"
                    className="ColumnText"
                  >
                    CREATED IN
                  </CWText>
                </div>
              </div>
              {templates.length > 0 ? (
                templates.map((template) => {
                  const creator = app.chain.accounts.get(template.createdBy);
                  return (
                    <div className="table-row">
                      <div className="table-column">
                        <CWText>{template.name}</CWText>
                      </div>
                      <div className="table-column">
                        <User user={creator} showAddressWithDisplayName />
                      </div>
                      <div className="table-column">
                        <div className="IconGroup">
                          <CWCommunityAvatar
                            community={app.config.chains.getById(
                              template.createdForCommunity
                            )}
                            size="small"
                          />
                          <CWText type="caption" fontWeight="bold">
                            {
                              app.config.chains.getById(
                                template.createdForCommunity
                              ).name
                            }
                          </CWText>
                        </div>
                      </div>
                      <div className="table-column">
                        <div className="IconGroup">
                          <CWIcon iconName="dots" iconSize="small" />
                          <CWIcon iconName="views" iconSize="small" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <CWText type="b1">
                    You currently have no action templates in your library.
                  </CWText>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Sublayout>
  );
};

export default ContractsPage;
