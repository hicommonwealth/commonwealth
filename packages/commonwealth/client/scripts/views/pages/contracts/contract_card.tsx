/* @jsx m */

import 'pages/contracts/contract_card.scss';
import m from 'mithril';
import ClassComponent from 'class_component';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { ContractTemplateCard } from './contract_template_card';
import type { Contract } from 'views/pages/contracts';
import { showConfirmationModal } from 'views/modals/confirmation_modal';
import { showManageContractTemplateModal } from 'views/modals/manage_contract_template_modal';
import app from 'state';

type ContractCardAttrs = {
  id: number;
  address: string;
  templates: Contract['templates'];
};

export class ContractCard extends ClassComponent<ContractCardAttrs> {
  handleDeleteContract(address: string) {
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
        onConfirm: () => {
          console.log('delete contract');
        },
      },
    });
  }

  handleCreateNewTemplate(e, contractId) {
    // TODO add some contract ID to know where should template be created
    const scope = app.customDomainId() || m.route.param('scope');
    m.route.set(`/${scope}/new/contract_template/${contractId}`);
  }

  async handleAddTemplate(contractId) {
    try {
      const templates = await app.contracts.getTemplatesForContract(contractId);
      showManageContractTemplateModal({
        contractId,
        templateId: null,
        template: null,
        templates,
      });
    } catch (e) {
      console.log(e);
    }
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
            onclick={() => this.handleDeleteContract(address)}
          />
        </div>
        <div className="templates">
          <CWText type="caption" className="label">
            Templates
          </CWText>
          {templates ? (
            <div className="templates-container">
              {templates.map((template) => (
                <ContractTemplateCard
                  contractId={id}
                  id={template.id}
                  title={template.title}
                  displayName={template.displayName}
                  nickname={template.nickname}
                  slug={template.slug}
                  display={template.display}
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
