/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import { Icon, Icons, Menu, MenuItem, Spinner } from 'construct-ui';
import { ChainBase } from 'common-common/src/types';

import 'components/sidebar/index.scss';

import app from 'state';
import { handleRedirectClicks } from 'helpers';
import { Contract } from 'models';
import { SidebarSectionGroup } from './sidebar_section';
import { ToggleTree, SectionGroupAttrs, SidebarSectionAttrs } from './types';
export class ContractSection implements m.ClassComponent<SidebarSectionAttrs> {
  contracts: Contract[];
  loaded: boolean;
  chain: string;

  view(vnode) {
    const showContractsOptions = app.chain?.base === ChainBase.Ethereum;

    this.contracts = app.contracts.getCommunityContracts();
    if (this.contracts.length > 0) {
      this.loaded = true;
    } else {
      this.loaded = false;
    }

    if (!app.contracts) return;
    if (!this.loaded) return <Spinner />;

    const isAdmin = app.roles.isAdminOfEntity({ chain: app.activeChainId() });

    // ---------- Build Section Props ---------- //

    const sectionAdminButton: m.Vnode = (
      <Icon
        name={Icons.PLUS_CIRCLE}
        onclick={(e) => {
          e.stopPropagation();
          handleRedirectClicks(e, `/new/contract`, app.activeChainId(), null);
        }}
      />
    );

    const contractData = (contractAddress: string): SectionGroupAttrs => {
      return {
        title: contractAddress,
        containsChildren: false,
        hasDefaultToggle: false,
        isVisible: showContractsOptions,
        isUpdated: true,
        isActive: false,
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          handleRedirectClicks(
            e,
            `/contract/${contractAddress}`,
            app.activeChainId(),
            null
          );
        },
        displayData: null,
      };
    };

    const contractsGroupData: SectionGroupAttrs[] = this.contracts.map(
      (contract: Contract) => {
        return contractData(contract.address);
      }
    );

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'Contracts',
      hasDefaultToggle: true,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
      },
      displayData: contractsGroupData,
      isActive: false,
      rightIcon: isAdmin && sectionAdminButton,
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
