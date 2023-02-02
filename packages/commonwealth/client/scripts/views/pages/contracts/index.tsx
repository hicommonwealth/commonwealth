/* @jsx m */

import 'pages/contracts/contracts_page.scss';
import app from 'state';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import m from 'mithril';
import ClassComponent from 'class_component';

import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';
import { CWButton } from 'views/components/component_kit/cw_button';
import { ContractCard } from './contract_card';
import { displayOptions } from '../../modals/manage_contract_template_modal';

export type Contract = {
  id: number;
  address: string;
  templates: {
    id: number;
    title: string;
    displayName: string;
    nickname: string;
    slug: string;
    display: string;
  }[];
};

class ContractsPage extends ClassComponent {
  handleAddContract() {
    const scope = app.customDomainId() || m.route.param('scope');
    m.route.set(`/${scope}/new/contract`);
  }

  view(vnode) {
    if (!app.contracts || !app.chain) {
      return <PageLoading title="Contracts Page" />;
    }

    const contracts = app.contracts.store
      .getCommunityContracts()
      .map((contract) => {
        return {
          id: contract.id,
          address: contract.address,
          templates: contract.ccts.map((cct) => {
            return {
              id: cct.templateId,
              title: cct.cctmd.display_name,
              displayName: cct.cctmd.display_name,
              nickname: cct.cctmd.nickname,
              slug: cct.cctmd.slug,
              display: displayOptions.find(
                (option) => cct.cctmd.display_options === option.value
              )?.label,
            };
          }),
        };
      });

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
              onclick={this.handleAddContract}
            />
          </div>

          <CWText className="subheader" type="b1">
            Add community contracts and associated templates
          </CWText>

          {contracts.length ? (
            <div class="contracts-container">
              {contracts.map((contract) => (
                <ContractCard
                  id={contract.id}
                  address={contract.address}
                  templates={contract.templates}
                />
              ))}
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
