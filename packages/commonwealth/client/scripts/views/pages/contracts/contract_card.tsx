import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { ContractTemplateCard } from './contract_template_card';
import type { Contract } from '../../../models';

import app from 'state';

import 'pages/contracts/contract_card.scss';
import { useCommonNavigate } from 'navigation/helpers';

type ContractCardProps = {
  id: number;
  address: string;
  templates: Contract['ccts'];
};

export const ContractCard = ({ address, templates, id }: ContractCardProps) => {
  const navigate = useCommonNavigate();

  const globalTemplatesExist = app.contracts.store.getContractByAddress(address)
    ?.hasGlobalTemplate;

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
          type: 'mini-red',
          onClick: async () => {
            await app.contracts.deleteCommunityContract({
              contract_id: id,
            });
            // TODO rerender
          },
        },
        {
          label: 'Cancel',
          type: 'mini-black',
        },
      ],
    });
  };

  const handleCreateNewTemplate = () => {
    navigate(`/new/contract_template/${id}`);
  };

  const handleAddTemplate = async () => {
    const templates = await app.contracts.getTemplatesForContract(id);

    // TODO display show-manage-contract-template-modal
    // showManageContractTemplateModal({
    //   contractId,
    //   templateId: null,
    //   template: null,
    //   templates,
    // });
  };

  return (
    <CWCard fullWidth className="ContractCard">
      <div className="header">
        <div>
          <CWText type="caption" className="label">
            Contract
          </CWText>
          <CWText className="address">{address}</CWText>
        </div>
        <CWIconButton
          className="delete-icon"
          iconName="trash"
          onClick={handleDeleteContract}
        />
      </div>
      <div className="templates">
        {templates?.length ? (
          <>
            <CWText type="caption" className="label">
              Templates
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
                  cctmd_id={template.cctmd.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="no-templates-container">
            <CWText className="no-templates-info" type="b1">
              You currently have no templates for this contract
            </CWText>
          </div>
        )}
        {globalTemplatesExist ? (
          <CWButton
            className="add-template-btn"
            buttonType="tertiary-black"
            label="Connect Template"
            iconLeft="plus"
            onClick={handleAddTemplate}
          />
        ) : (
          <CWText className="create-template-info" type="caption">
            <CWText
              type="caption"
              fontWeight="medium"
              className="cta"
              onClick={handleCreateNewTemplate}
            >
              Create a New Template
            </CWText>
          </CWText>
        )}
      </div>
    </CWCard>
  );
};
