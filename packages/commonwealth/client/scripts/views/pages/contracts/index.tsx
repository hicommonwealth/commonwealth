/* @jsx m */

import 'pages/contracts/contracts_page.scss';
import app from 'state';
import m from 'mithril';
import ClassComponent from 'class_component';

import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

class ContractTemplateCard extends ClassComponent {
  view(vnode) {
    return (
      <CWCard fullWidth className="ContractTemplateCard">
        <div className="header">
          <CWText type="h5" className="title">
            Treasury Spend
          </CWText>
          <CWIconButton
            iconName="dotsVertical"
            onclick={() => console.log('click open contract template menu')}
          />
        </div>
        <div className="contract-info-container">
          <div className="info-row">
            <CWText type="b2" className="row-label">
              Display Name
            </CWText>
            <CWText type="b2" className="row-value">
              New Treasury Proposal 1
            </CWText>
          </div>
          <div className="info-row">
            <CWText type="b2" className="row-label">
              Nickname
            </CWText>
            <CWText type="b2" className="row-value">
              Little Treasures
            </CWText>
          </div>
          <div className="info-row">
            <CWText type="b2" className="row-label">
              Slug
            </CWText>
            <CWText type="b2" className="row-value">
              /whatever-was-here-for-add-template
            </CWText>
          </div>
          <div className="info-row">
            <CWText type="b2" className="row-label">
              Display
            </CWText>
            <CWText type="b2" className="row-value">
              In Create Dropdown and in Create Sidebar
            </CWText>
          </div>
        </div>
      </CWCard>
    );
  }
}

class ContractCard extends ClassComponent {
  view(vnode) {
    const templates = true;

    return (
      <CWCard fullWidth className="ContractCard">
        <div className="header">
          <div>
            <CWText type="caption" className="label">
              Contract
            </CWText>
            <CWText className="address">
              QwRsdskjfkdsjfiaSOppPaspodjapsdaspodaspdoPlnH
            </CWText>
          </div>
          <CWIconButton
            className="delete-icon"
            iconName="trash"
            onclick={() => console.log('click delete')}
          />
        </div>
        <div className="templates">
          <CWText type="caption" className="label">
            Templates
          </CWText>
          {templates ? (
            <div className="templates-container">
              <ContractTemplateCard />
              <ContractTemplateCard />
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
          />
          <CWText className="create-template-info" type="caption">
            Don’t see a template that fits your needs?
            <CWText
              type="caption"
              fontWeight="medium"
              className="cta"
              onclick={() => console.log('open add template modal')}
            >
              Create a New Template
            </CWText>
          </CWText>
        </div>
      </CWCard>
    );
  }
}

class ContractsPage extends ClassComponent {
  view(vnode) {
    if (!app.contracts || !app.chain) {
      return <PageLoading title="Contracts Page" />;
    }

    const contracts = true;

    return (
      <Sublayout>
        <div class="ContractsPage">
          <CWBreadcrumbs breadcrumbs={[{ label: 'Contracts', path: '' }]} />
          <div className="header-container">
            <CWText type="h3">Contracts</CWText>
            <CWButton
              buttonType="mini-white"
              label="Add Contract"
              iconLeft="plus"
            />
          </div>

          <CWText className="subheader" type="b1">
            Add community contracts and associated templates
          </CWText>

          {contracts ? (
            <div class="contracts-container">
              <ContractCard />
              <ContractCard />
              <ContractCard />
              <ContractCard />
            </div>
          ) : (
            <div class="no-contracts-container">
              <CWText className="no-contracts-info" type="b1">
                You currently have no linked contracts.
              </CWText>
            </div>
          )}
        </div>
      </Sublayout>
    );
  }
}

export default ContractsPage;
