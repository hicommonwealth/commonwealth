/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import { Icon, Icons, Menu, MenuItem, Spinner } from 'construct-ui';
import {
  ProposalType,
  ChainBase,
  ChainNetwork,
  ChainType,
} from 'common-common/src/types';

import 'components/sidebar/index.scss';

import { navigateToSubpage } from 'app';
import app from 'state';
import { IChannel } from 'controllers/server/socket/chatNs';
import { WebsocketMessageNames } from 'types';
import { handleRedirectClicks } from 'helpers';
import { Contract } from 'models';
import { SidebarSectionGroup } from './sidebar_section';
import {
  ToggleTree,
  SubSectionAttrs,
  SectionGroupAttrs,
  SidebarSectionAttrs,
} from './types';
import { verifyCachedToggleTree } from './helpers';

enum Errors {
  None = '',
  NotEnabled = 'Chat is not enabled',
  NotLoggedIn = 'Must be logged in to read chat',
}
export class ContractSection
  implements m.ClassComponent<SidebarSectionAttrs>
{
  contracts: Contract[];
  channels: {
    [category: string]: IChannel[];
  };
  loaded: boolean;
  error: Errors;
  channelToToggleTree: any;
  categoryToToggleTree: any;
  menuToggleTree: ToggleTree;
  adminModals: { [modal: string]: boolean };
  adminCategory: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  adminChannel: IChannel | {};
  onIncomingMessage: (any: any) => void;
  chain: string;
  activeChannel: number;

  async oninit(vnode) {
    this.loaded = false;
    this.chain = app.activeChainId();

    this.onIncomingMessage = (msg) => {
      m.redraw.sync();
    };

    this.loaded = true;

  }

  view(vnode) {
    const showContractsOptions = app.chain?.base === ChainBase.Ethereum;

    if (!app.contracts) return;
    if (!this.loaded) return <Spinner />;

    const isAdmin = app.roles.isAdminOfEntity({ chain: app.activeChainId() });

    this.contracts = app.contracts.getByCommunity(app.activeChainId());

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

    [];


    const contractsGroupData: SectionGroupAttrs[] = this.contracts.map(
      (contract: Contract) => {
        return contractData(contract.address);
      }
    );

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'CONTRACTS',
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
