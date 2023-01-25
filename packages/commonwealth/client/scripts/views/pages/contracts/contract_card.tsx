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

type ContractCardAttrs = {
  address: string;
  templates: Contract['templates'];
  scope: string;
};

export class ContractCard extends ClassComponent<ContractCardAttrs> {
  async handleDeleteContract(address: string) {
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

  handleCreateNewTemplate(scope: string) {
    // TODO add some contract ID to know where should template be created
    m.route.set(`/${scope}/new/contract_template`);
  }

  handleAddTemplate() {
    // TODO open modal
    console.log('click add new template!');
  }

  view(vnode: m.Vnode<ContractCardAttrs>) {
    const { address, templates, scope } = vnode.attrs;

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
            onclick={this.handleAddTemplate}
          />
          <CWText className="create-template-info" type="caption">
            Don’t see a template that fits your needs?
            <CWText
              type="caption"
              fontWeight="medium"
              className="cta"
              onclick={() => this.handleCreateNewTemplate(scope)}
            >
              Create a New Template
            </CWText>
          </CWText>
        </div>
      </CWCard>
    );
  }
}
