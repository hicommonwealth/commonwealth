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
import { ContractCard } from './contract_card';

const contracts = [
  {
    id: 1,
    address: 'QwRsdskjfkdsjfiaSOppPaspodjapsdaspodaspdoPlnH',
    templates: [
      {
        id: 1,
        title: 'Treasury Spend',
        displayName: 'New Treasury Proposal 1',
        nickname: 'Little Treasures',
        slug: '/whatever-was-here-for-add-template',
        display: 'In Create Dropdown and in Create Sidebar',
      },
      {
        id: 2,
        title: 'Parameter Change',
        displayName: 'New Treasury Proposal 2',
        nickname: 'Little Treasures 2',
        slug: '/whatever-was-here-for-add-template-2',
        display: 'In Create Dropdown',
      },
    ],
  },
  {
    id: 2,
    address: 'QwRsdskjfkdsjfiaS2222222',
    templates: [
      {
        id: 2,
        title: 'Parameter Change',
        displayName: 'New Treasury Proposal 1',
        nickname: 'Little Treasures',
        slug: '/whatever-was-here-for-add-template',
        display: 'In Create Dropdown and in Create Sidebar',
      },
    ],
  },
];

export type Contract = {
  id: string;
  address: string;
  templates: {
    title: string;
    displayName: string;
    nickname: string;
    slug: string;
    display: string;
  }[];
};

class ContractsPage extends ClassComponent {
  handleAddContract(scope: string) {
    m.route.set(`/${scope}/new/contract`);
  }

  view(vnode) {
    if (!app.contracts || !app.chain) {
      return <PageLoading title="Contracts Page" />;
    }

    const scope = vnode.attrs.scope;

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
              onclick={() => this.handleAddContract(scope)}
            />
          </div>

          <CWText className="subheader" type="b1">
            Add community contracts and associated templates
          </CWText>

          {contracts.length ? (
            <div class="contracts-container">
              {contracts.map((contract) => (
                <ContractCard
                  address={contract.address}
                  templates={contract.templates}
                  scope={scope}
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
