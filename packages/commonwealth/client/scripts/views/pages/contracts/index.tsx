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
import { Modal } from '../../components/component_kit/cw_modal';
import ViewTemplateModal from '../../modals/view_template_modal';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { openConfirmation } from '../../modals/confirmation_modal';
import { notifyError } from 'controllers/app/notifications';

const ContractsPage = () => {
  const navigate = useCommonNavigate();

  const [contracts, setContracts] = useState<Contract[]>(
    app.contracts.store.getCommunityContracts()
  );

  const [templates, setTemplates] = useState<Template[]>([]);
  const [noContractsAlertDisplayed, setNoContractsAlertDisplayed] =
    useState(true);
  const [viewTemplateModalOpen, setViewTemplateModalOpen] = useState(false);
  const [mountedTemplate, setMountedTemplate] = useState<Template>(null);

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

  useEffect(() => {
    fetchTemplates();
  }, [contracts, setTemplates]);

  const [tabOn, setTabOn] = useState<'contracts' | 'templates'>('contracts');

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

  const handleDeleteTemplate = (template) => {
    if (template.inUse) {
      openConfirmation({
        title: 'Action template cannot be deleted',
        description: (
          <>
            Action template <b>{template.name}</b> cannot be deleted at this
            time because it is currently being used by a community.
          </>
        ),
        buttons: [
          {
            label: 'Close',
            buttonType: 'secondary-black',
          },
        ],
      });
    } else {
      openConfirmation({
        title: 'Delete Template',
        description: (
          <>
            Deleting this template <b>{template.name}</b> is permanent and
            deletes all associated data. Are you sure you want to proceed?
          </>
        ),
        buttons: [
          {
            label: 'Delete',
            buttonType: 'mini-red',
            onClick: async () => {
              try {
                await app.contracts.deleteTemplate({
                  templateId: template.id,
                });
                await fetchTemplates();
              } catch (e) {
                console.error(e);
                notifyError('Failed to delete template!');
              }
            },
          },
          {
            label: 'Cancel',
            buttonType: 'mini-black',
          },
        ],
      });
    }
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
            <Modal
              content={
                <ViewTemplateModal
                  template={mountedTemplate}
                  onClose={() => {
                    setViewTemplateModalOpen(false);
                    setMountedTemplate(null);
                  }}
                />
              }
              open={viewTemplateModalOpen}
              onClose={() => {
                setViewTemplateModalOpen(false);
                setMountedTemplate(null);
              }}
            />
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
                          <PopoverMenu
                            renderTrigger={(onclick) => (
                              <CWIconButton
                                iconName="dots"
                                iconSize="small"
                                onClick={onclick}
                              />
                            )}
                            menuItems={[
                              {
                                label: 'Delete',
                                iconLeft: 'trash',
                                onClick: () => {
                                  handleDeleteTemplate(template);
                                },
                              },
                            ]}
                          />
                          <CWIconButton
                            iconName="views"
                            iconSize="small"
                            className="ViewIcon"
                            onClick={() => {
                              setMountedTemplate(template);
                              setViewTemplateModalOpen(true);
                            }}
                          />
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
            <CWButton
              className="add-template-btn"
              buttonType="tertiary-black"
              label="Create Template"
              iconLeft="plus"
              onClick={() => navigate('/new/contract_template/blank')}
            />
          </div>
        )}
      </div>
    </Sublayout>
  );
};

export default ContractsPage;
