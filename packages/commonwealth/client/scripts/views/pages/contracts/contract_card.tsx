import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { ContractTemplateCard } from './contract_template_card';
import type Contract from '../../../models/Contract';

import app from 'state';

import 'pages/contracts/contract_card.scss';
import { useCommonNavigate } from 'navigation/helpers';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import React, { useState } from 'react';
import ManageContractTemplateModal, {
  ManageContractTemplateModalProps,
} from 'views/modals/manage_contract_template_modal';

type ContractCardProps = {
  id: number;
  address: string;
  templates: Contract['ccts'];
  onUpdateSuccess: () => void;
};

type ManageContractTemplateModalData = Omit<
  ManageContractTemplateModalProps,
  'onModalClose'
>;

export const ContractCard = ({
  address,
  templates,
  id,
  onUpdateSuccess,
}: ContractCardProps) => {
  const navigate = useCommonNavigate();

  const [manageContractTemplateModalData, setManageContractTemplateModalData] =
    useState<ManageContractTemplateModalData>(null);

  const globalTemplatesExist =
    app.contracts.store.getContractByAddress(address)?.hasGlobalTemplate;

  const handleDeleteContract = () => {
    openConfirmation({
      title: 'Delete Contract',
      description: (
        <>
          Deleting contract <b>{address}</b> is permanent and deletes all
          associated data. Are you sure you want to proceed?
        </>
      ),
      buttons: [
        {
          label: 'Delete',
          buttonType: 'destructive',
          onClick: async () => {
            try {
              await app.contracts.deleteCommunityContract({
                contract_id: id,
              });
              onUpdateSuccess();
            } catch (err) {
              console.log(err);
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'primary',
        },
      ],
    });
  };

  const handleCreateNewTemplate = () => {
    navigate(`/new/contract_template/${id}`);
  };

  const handleOpenManageContractTemplateModal = async (
    templateId?: number,
    cctId?: number,
    template?: any
  ) => {
    const contractTemplates = await app.contracts.getTemplatesForContract(id);

    setManageContractTemplateModalData({
      contractId: id,
      templateId: templateId,
      template: { ...template, id: cctId },
      contractTemplates,
    });
  };

  return (
    <>
      <CWCard fullWidth className="ContractCard">
        <div className="header">
          <CWText type="caption" className="label" fontStyle="uppercase">
            CONTRACT
          </CWText>

          <CWIconButton iconName="trash" onClick={handleDeleteContract} />
        </div>
        <div className="label-group">
          <CWText className="group-title" type="b2">
            Address
          </CWText>
          <CWText className="address" type="b2">
            {address}
          </CWText>
        </div>
        <div className="templates">
          {templates?.length ? (
            <>
              <CWText type="caption" className="label" fontStyle="uppercase">
                ACTIONS
              </CWText>
              <div className="templates-container">
                {templates.map((template) => (
                  <ContractTemplateCard
                    contractId={id}
                    id={template.templateId}
                    title={template.cctmd.display_name}
                    displayName={template.cctmd.display_name}
                    nickname={template.cctmd.nickname}
                    slug={template.cctmd.slug}
                    display={template.cctmd.display_options}
                    enabledBy={template.cctmd.enabled_by}
                    enabledAt={template.cctmd.created_at}
                    cctmd_id={template.cctmd.id}
                    cct_id={template.id}
                    handleShowModal={handleOpenManageContractTemplateModal}
                    onUpdateSuccess={onUpdateSuccess}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="no-templates-container">
              <CWText className="no-templates-info" type="b1">
                You currently have no actions for this contract
              </CWText>
            </div>
          )}
          {globalTemplatesExist ? (
            <CWButton
              className="add-template-btn"
              buttonType="tertiary-black"
              label="Enable action"
              iconLeft="plus"
              onClick={() => handleOpenManageContractTemplateModal()}
            />
          ) : (
            <CWText className="create-template-info" type="caption">
              <CWText
                type="caption"
                fontWeight="medium"
                className="cta"
                onClick={handleCreateNewTemplate}
              >
                Create a new template
              </CWText>
            </CWText>
          )}
        </div>
        <CWModal
          size="medium"
          content={
            <ManageContractTemplateModal
              contractId={manageContractTemplateModalData?.contractId}
              templateId={manageContractTemplateModalData?.templateId}
              template={manageContractTemplateModalData?.template}
              contractTemplates={
                manageContractTemplateModalData?.contractTemplates
              }
              onModalClose={() => {
                setManageContractTemplateModalData(null);
                onUpdateSuccess();
              }}
            />
          }
          onClose={() => setManageContractTemplateModalData(null)}
          open={!!manageContractTemplateModalData}
        />
      </CWCard>
    </>
  );
};
