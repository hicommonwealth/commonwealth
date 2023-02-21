/* @jsx m */

import 'pages/contracts/contract_card.scss';
import m from 'mithril';
import ClassComponent from 'class_component';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { ContractTemplateCard } from './contract_template_card';
import type { Contract } from '../../../models';
import { showConfirmationModal } from 'views/modals/confirmation_modal';
import { showManageContractTemplateModal } from 'views/modals/manage_contract_template_modal';
import app from 'state';

type ContractCardAttrs = {
  id: number;
  address: string;
  templates: Contract['ccts'];
};

export class ContractCard extends ClassComponent<ContractCardAttrs> {
  handleDeleteContract(address: string, id: number) {
    showConfirmationModal({
      title: 'Delete Contract',
      description: (
        <>
          Deleting contract <b>{address}</b> is permanent and deletes all
          associated data. Are you sure you want to proceed?
        </>
      ),
      confirmButton: {
        label: 'Delete',
        type: 'mini-red',
        onConfirm: async () => {
          await app.contracts.deleteCommunityContract({
            contract_id: id,
          });
          m.redraw();
        },
      },
    });
  }

  handleCreateNewTemplate(e, contractId) {
    const scope = app.customDomainId() || m.route.param('scope');
    m.route.set(`/${scope}/new/contract_template/${contractId}`);
  }

  async handleAddTemplate(contractId) {
    const templates = await app.contracts.getTemplatesForContract(contractId);

    showManageContractTemplateModal({
      contractId,
      templateId: null,
      template: null,
      templates,
    });
  }

  view(vnode: m.Vnode<ContractCardAttrs>) {
    const { address, templates, id } = vnode.attrs;

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
            onclick={() => this.handleDeleteContract(address, id)}
          />
        </div>
        <div className="templates">
          <CWText type="caption" className="label">
            Templates
          </CWText>
          {templates?.length ? (
            <div className="templates-container">
              {templates.map((template) => (
                <ContractTemplateCard
                  contractId={id}
                  id={template.id}
                  title={template.cctmd.display_name}
                  displayName={template.cctmd.display_name}
                  nickname={template.cctmd.nickname}
                  slug={template.cctmd.slug}
                  display={template.cctmd.display_options}
                  cctmd_id={template.cctmd.id}
                />
              ))}
            </div>
          ) : (
            <div className="no-templates-container">
              <CWText className="no-templates-info" type="b1">
                You currently have no templates for this contract
              </CWText>
            </div>
          )}
          <CWButton
            className="add-template-btn"
            buttonType="tertiary-black"
            label="Add Template"
            iconLeft="plus"
            onclick={() => this.handleAddTemplate(id)}
          />
          <CWText className="create-template-info" type="caption">
            Don’t see a template that fits your needs?
            <CWText
              type="caption"
              fontWeight="medium"
              className="cta"
              onclick={(e) => this.handleCreateNewTemplate(e, id)}
            >
              Create a New Template
            </CWText>
          </CWText>
        </div>
      </CWCard>
    );
  }
}
