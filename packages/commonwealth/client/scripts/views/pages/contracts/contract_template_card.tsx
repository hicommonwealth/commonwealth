/* @jsx m */

import 'pages/contracts/contract_template_card.scss';
import m from 'mithril';
import ClassComponent from 'class_component';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import type { Contract } from 'views/pages/contracts/index';
import { CWPopoverMenu } from 'views/components/component_kit/cw_popover/cw_popover_menu';

type ContractTemplateCardAttrs = Contract['templates'][0];

interface InfoOrder {
  key: keyof ContractTemplateCardAttrs;
  label: string;
}

export class ContractTemplateCard extends ClassComponent<ContractTemplateCardAttrs> {
  handleEditTemplate() {
    console.log('click edit template');
    // TODO open edit modal
  }

  handleDeleteTemplate() {
    // TODO open confirmation popup
    console.log('click delete template');
  }

  view(vnode: m.Vnode<ContractTemplateCardAttrs>) {
    const { title, ...templateInfo } = vnode.attrs;

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
                onclick: this.handleEditTemplate,
              },
              {
                label: 'Delete',
                iconLeft: 'trash',
                onclick: this.handleDeleteTemplate,
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
