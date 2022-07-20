/* @jsx m */

import m from 'mithril';
import {
  Button,
  ButtonGroup,
  Icon,
  Icons,
  PopoverMenu,
  MenuItem,
  MenuDivider,
} from 'construct-ui';

import 'components/new_proposal_button.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType, ChainBase, ChainNetwork } from 'types';
import NewThreadModal from 'views/modals/new_thread_modal';

type NewProposalMenuAttrs = {
  mobile?: boolean;
};

export class NewProposalMenu implements m.ClassComponent<NewProposalMenuAttrs> {
  view(vnode) {
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
        <MenuItem
          onclick={() => {
            navigateToSubpage('/new/discussion');
          }}
          label="New thread"
          iconLeft={mobile ? Icons.PLUS : undefined}
        />
        {topics.map((t) => (
          <MenuItem
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
            iconLeft={mobile ? Icons.PLUS : undefined}
          />
        ))}
        {(app.chain?.network === ChainNetwork.Aave ||
          app.chain?.network === ChainNetwork.dYdX ||
          app.chain?.network === ChainNetwork.Compound ||
          app.chain?.base === ChainBase.CosmosSDK ||
          app.chain?.base === ChainBase.Substrate) &&
          !mobile && <MenuDivider />}
        {app.chain?.base === ChainBase.CosmosSDK &&
          app.chain?.network !== ChainNetwork.Terra && (
            <MenuItem
              onclick={() => navigateToSubpage('/new/proposal')}
              label="New On-Chain Proposal"
              iconLeft={mobile ? Icons.PLUS : undefined}
            />
          )}
        {app.chain?.base === ChainBase.Ethereum &&
          app.chain?.network === ChainNetwork.Aave && (
            <MenuItem
              onclick={() => navigateToSubpage('/new/proposal')}
              label="New On-Chain Proposal"
              iconLeft={mobile ? Icons.PLUS : undefined}
            />
          )}
        {app.chain?.network === ChainNetwork.Compound && (
          <MenuItem
            onclick={() => navigateToSubpage('/new/proposal')}
            label="New On-Chain Proposal"
            iconLeft={mobile ? Icons.PLUS : undefined}
          />
        )}
        {app.chain?.base === ChainBase.Substrate &&
          app.chain?.network !== ChainNetwork.Plasm && (
            <>
              <MenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateTreasuryProposal,
                  })
                }
                label="New treasury proposal"
                iconLeft={mobile ? Icons.PLUS : undefined}
              />
              <MenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateDemocracyProposal,
                  })
                }
                label="New democracy proposal"
                iconLeft={mobile ? Icons.PLUS : undefined}
              />
              <MenuItem
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
                iconLeft={mobile ? Icons.PLUS : undefined}
              />
              <MenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateBountyProposal,
                  })
                }
                label="New bounty proposal"
                iconLeft={mobile ? Icons.PLUS : undefined}
              />
              <MenuItem
                onclick={() =>
                  navigateToSubpage('/new/proposal/:type', {
                    type: ProposalType.SubstrateTreasuryTip,
                  })
                }
                label="New tip"
                iconLeft={mobile ? Icons.PLUS : undefined}
              />
            </>
          )}
        {app.chain.network === ChainNetwork.Sputnik && (
          <MenuItem
            onclick={() => navigateToSubpage('/new/proposal')}
            label="New Sputnik proposal"
            iconLeft={mobile ? Icons.PLUS : undefined}
          />
        )}
        {showSnapshotOptions && (
          <MenuItem
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
            iconLeft={mobile ? Icons.PLUS : undefined}
          />
        )}
      </>
    );
  }
}

export class MobileNewProposalButton implements m.ClassComponent {
  view() {
    if (!app.isLoggedIn() || !app.chain || !app.activeChainId()) return;

    return (
      <PopoverMenu
        transitionDuration={0}
        hoverCloseDelay={0}
        hasArrow={false}
        trigger={
          <Button
            disabled={!app.user.activeAccount}
            label={<Icon name={Icons.PLUS} />}
            inline={true}
            position="bottom-start"
            closeOnContentClick={true}
            menuAttrs={{
              align: 'left',
            }}
            content={<NewProposalMenu />}
          />
        }
      />
    );
  }
}

type NewProposalButtonAttrs = {
  fluid: boolean;
  threadOnly?: boolean;
};

export class NewProposalButton implements m.Component<NewProposalButtonAttrs> {
  view(vnode) {
    const { fluid, threadOnly } = vnode.attrs;

    if (!app.isLoggedIn() || !app.chain || !app.activeChainId()) return;

    // just a button for communities, or chains without governance
    if (threadOnly) {
      return (
        <Button
          class="NewProposalButton"
          label="New thread"
          fluid={fluid}
          disabled={!app.user.activeAccount}
          onclick={() => app.modals.create({ modal: NewThreadModal })}
        />
      );
    }

    return (
      <ButtonGroup class="NewProposalButton">
        <PopoverMenu
          transitionDuration={0}
          hoverCloseDelay={0}
          hasArrow={false}
          trigger={
            <Button disabled={!app.user.activeAccount} label="New thread" />
          }
          position="bottom-end"
          closeOnContentClick={true}
          menuAttrs={{
            align: 'left',
          }}
          content={<NewProposalMenu />}
        />
        <Button
          disabled={!app.user.activeAccount}
          iconLeft={Icons.EDIT}
          fluid={fluid}
          onclick={() => app.modals.create({ modal: NewThreadModal })}
        />
      </ButtonGroup>
    );
  }
}
