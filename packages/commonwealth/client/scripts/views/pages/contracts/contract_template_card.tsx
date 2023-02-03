/* @jsx m */

import 'pages/contracts/contract_template_card.scss';
import m from 'mithril';
import app from 'state';
import ClassComponent from 'class_component';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWPopoverMenu } from 'views/components/component_kit/cw_popover/cw_popover_menu';
import { showConfirmationModal } from 'views/modals/confirmation_modal';
import { showManageContractTemplateModal } from 'views/modals/manage_contract_template_modal';

type ContractTemplateCardAttrs = {
  contractId: number;
  id: number;
  title: string;
  displayName: string;
  nickname: string;
  slug: string;
  display: string;
};

interface InfoOrder {
  key: keyof ContractTemplateCardAttrs;
  label: string;
}

export class ContractTemplateCard extends ClassComponent<ContractTemplateCardAttrs> {
  async handleEditTemplate(contractId, templateId, template) {
    try {
      const templates = await app.contracts.getTemplatesForContract(contractId);
      console.log({ templates });
      showManageContractTemplateModal({
        contractId,
        templateId,
        template,
        templates,
      });
    } catch (e) {
      console.error(e);
    }
  }

  handleDeleteTemplate(name: string) {
    showConfirmationModal({
      title: 'Delete Template',
      description: (
        <>
          Deleting this template <b>{name}</b> is permanent and deletes all
          associated data. Are you sure you want to proceed?
        </>
      ),
      confirmButton: {
        label: 'Delete',
        type: 'mini-red',
        onConfirm: () => {
          console.log('delete template');
        },
      },
    });
  }

  view(vnode: m.Vnode<ContractTemplateCardAttrs>) {
    const { title, contractId, id: templateId, ...templateInfo } = vnode.attrs;

    const infosOrder: InfoOrder[] = [
      { key: 'displayName', label: 'Display Name' },
      { key: 'nickname', label: 'Nickname' },
      { key: 'slug', label: 'Slug' },
      { key: 'display', label: 'Display' },
    ];

    return (
      <CWCard fullWidth className="ContractTemplateCard">
        <div className="header">
          <CWText type="h5" className="title">
            {title}
          </CWText>
          <CWPopoverMenu
            trigger={<CWIconButton iconName="dotsVertical" />}
            menuItems={[
              {
                label: 'Edit Template',
                iconLeft: 'write',
                onclick: () =>
                  this.handleEditTemplate(contractId, templateId, templateInfo),
              },
              {
                label: 'Delete',
                iconLeft: 'trash',
                onclick: () =>
                  this.handleDeleteTemplate(templateInfo.displayName),
              },
            ]}
          />
        </div>
        <div className="contract-info-container">
          {infosOrder.map((info) => {
            if (!templateInfo[info.key]) {
              return null;
            }

            return (
              <div className="info-row">
                <CWText type="b2" className="row-label">
                  {info.label}
                </CWText>
                <CWText type="b2" className="row-value">
                  {templateInfo[info.key]}
                </CWText>
              </div>
            );
          })}
        </div>
      </CWCard>
    );
  }
}
