/* @jsx m */

import m from 'mithril';
import 'components/new_proposal_button.scss';
import app from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import * as Icons from './component_kit/cw_icons/cw_icons';
import {
  CWPopoverMenu,
  CWPopoverMenuItem,
} from './component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from './component_kit/cw_icon_button';

type NewProposalMenuAttrs = {
  mobile?: boolean;
};

export class NewProposalMenu implements m.ClassComponent<NewProposalMenuAttrs> {
  view(vnode) {
    console.log('npm');

    const { mobile } = vnode.attrs;

    const activeAccount = app.user.activeAccount;

    const showSnapshotOptions =
      app.user.activeAccount && app.chain?.meta.snapshot.length > 0;

    const topics = app.topics
      .getByCommunity(app.activeChainId())
      .reduce(
        (acc, current) => (current.featuredInNewPost ? [...acc, current] : acc),
        []
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    return (
      <>
        <CWPopoverMenuItem
          onclick={() => {
            navigateToSubpage('/new/discussion');
          }}
          label="New thread"
          iconName={mobile ? Icons.CWPlus : undefined}
        />
        {topics.map((t) => (
          <CWPopoverMenuItem
            onclick={() => {
              // TODO Graham 7-19-22: Let's find a non-localStorage solution
              localStorage.setItem(
                `${app.activeChainId()}-active-topic`,
                t.name
              );
              if (t.defaultOffchainTemplate) {
                localStorage.setItem(
                  `${app.activeChainId()}-active-topic-default-template`,
                  t.defaultOffchainTemplate
                );
              } else {
                localStorage.removeItem(
                  `${app.activeChainId()}-active-topic-default-template`
                );
              }
              navigateToSubpage('/new/discussion');
            }}
            label={`New ${t.name} Thread`}
            iconName={mobile ? Icons.CWPlus : undefined}
          />
        ))}
        {(app.chain?.network === ChainNetwork.Aave ||
          app.chain?.network === ChainNetwork.dYdX ||
          app.chain?.network === ChainNetwork.Compound ||
          app.chain?.base === ChainBase.CosmosSDK ||
          app.chain?.base === ChainBase.Substrate) &&
          !mobile && <CWPopoverMenuItem type="divider" />}
        {app.chain?.base === ChainBase.CosmosSDK &&
          app.chain?.network !== ChainNetwork.Terra && (
            <CWPopoverMenuItem
              onclick={() => navigateToSubpage('/new/proposal')}
              label="New On-Chain Proposal"
              iconName={mobile ? Icons.CWPlus : undefined}
            />
          )}
        {app.chain?.base === ChainBase.Ethereum &&
          app.chain?.network === ChainNetwork.Aave && (
            <CWPopoverMenuItem
              onclick={() => navigateToSubpage('/new/proposal')}
              label="New On-Chain Proposal"
              iconName={mobile ? Icons.CWPlus : undefined}
            />
          )}
        {app.chain?.network === ChainNetwork.Compound && (
          <CWPopoverMenuItem
            onclick={() => navigateToSubpage('/new/proposal')}
            label="New On-Chain Proposal"
            iconName={mobile ? Icons.CWPlus : undefined}
          />
        )}
        {app.chain?.base === ChainBase.Substrate &&
          app.chain?.network !== ChainNetwork.Plasm && (
            <>
              <CWPopoverMenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateTreasuryProposal,
                  })
                }
                label="New treasury proposal"
                iconName={mobile ? Icons.CWPlus : undefined}
              />
              <CWPopoverMenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateDemocracyProposal,
                  })
                }
                label="New democracy proposal"
                iconName={mobile ? Icons.CWPlus : undefined}
              />
              <CWPopoverMenuItem
                class={
                  activeAccount && (activeAccount as any).isCouncillor
                    ? ''
                    : 'disabled'
                }
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateCollectiveProposal,
                  })
                }
                label="New council motion"
                iconName={mobile ? Icons.CWPlus : undefined}
              />
              <CWPopoverMenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateBountyProposal,
                  })
                }
                label="New bounty proposal"
                iconName={mobile ? Icons.CWPlus : undefined}
              />
              <CWPopoverMenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateTreasuryTip,
                  })
                }
                label="New tip"
                iconName={mobile ? Icons.CWPlus : undefined}
              />
            </>
          )}
        {app.chain.network === ChainNetwork.Sputnik && (
          <CWPopoverMenuItem
            onclick={() => navigateToSubpage('/new/proposal')}
            label="New Sputnik proposal"
            iconName={mobile ? Icons.CWPlus : undefined}
          />
        )}
        {showSnapshotOptions && (
          <CWPopoverMenuItem
            onclick={() => {
              const snapshotSpaces = app.chain.meta.snapshot;
              if (snapshotSpaces.length > 1) {
                navigateToSubpage('/multiple-snapshots', {
                  action: 'create-proposal',
                });
              } else {
                navigateToSubpage(`/new/snapshot/${snapshotSpaces}`);
              }
            }}
            label="New Snapshot Proposal"
            iconName={mobile ? Icons.CWPlus : undefined}
          />
        )}
      </>
    );
  }
}

type NewProposalButtonAttrs = {
  fluid: boolean;
};

export class NewProposalButton implements m.Component<NewProposalButtonAttrs> {
  view() {
    if (!app.isLoggedIn() || !app.chain || !app.activeChainId()) return;

    return (
      <CWPopoverMenu
        transitionDuration={0}
        hoverCloseDelay={0}
        hasArrow={false}
        trigger={
          <CWIconButton
            disabled={!app.user.activeAccount}
            iconButtonTheme="black"
            iconName="plusCircle"
            iconSize="medium"
            inline={true}
          />
        }
        position="bottom-start"
        closeOnContentClick={true}
        menuAttrs={{
          align: 'left',
        }}
        popoverMenuItems={<NewProposalMenu />}
      />
    );
  }
}
