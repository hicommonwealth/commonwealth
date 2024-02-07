import { notifyError } from 'controllers/app/notifications';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import Contract from 'models/Contract';
import Template from 'models/Template';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/contracts/contracts_page.scss';
import React, { useState } from 'react';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { openConfirmation } from '../../modals/confirmation_modal';
import { PageLoading } from '../loading';
import { ContractCard } from './contract_card';
import { TemplateDisplayTab } from './template_display_tab';

const ContractsPage = () => {
  const navigate = useCommonNavigate();

  const [contracts, setContracts] = useState<Contract[]>(
    app.contracts.store.getCommunityContracts(),
  );

  const [templates, setTemplates] = useState<Template[]>([]);
  const [noContractsAlertDisplayed, setNoContractsAlertDisplayed] =
    useState(true);

  const [tabOn, setTabOn] = useState<'contracts' | 'templates'>('contracts');

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
        }),
      );
    }
  };

  useNecessaryEffect(() => {
    fetchTemplates();
  }, [contracts, setTemplates]);

  const handleAddContract = () => {
    navigate(`/new/contract`);
  };

  if (!app.contracts || !app.chain) {
    return <PageLoading message="Contracts Page" />;
  }

  const onUpdateSuccess = () => {
    const updatedContracts = app.contracts.store.getCommunityContracts();
    setContracts([...updatedContracts]);
    fetchTemplates();
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
            buttonType: 'secondary',
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
            buttonType: 'destructive',
            buttonHeight: 'sm',
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
            buttonType: 'primary',
            buttonHeight: 'sm',
          },
        ],
      });
    }
  };

  return (
    <div className="ContractsPage">
      <div className="header-container">
        <CWText type="h3">Contract action templates</CWText>
        <CWButton
          buttonType="mini-white"
          label="Add contract"
          iconLeft="plus"
          onClick={handleAddContract}
        />
      </div>

      <CWText className="subheader" type="b1">
        Add community contracts and associated templates
      </CWText>

      <div className="Tabs">
        <CWTabsRow>
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
        </CWTabsRow>
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
        <TemplateDisplayTab
          templates={templates}
          handleDeleteTemplate={handleDeleteTemplate}
          contracts={contracts}
          setNoContractsAlertDisplayed={setNoContractsAlertDisplayed}
          noContractsAlertDisplayed={noContractsAlertDisplayed}
        />
      )}
    </div>
  );
};

export default ContractsPage;
