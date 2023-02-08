/* @jsx jsx */
import React from 'react';

import type { ResultNode} from 'mithrilInterop';
import { ClassComponent, jsx } from 'mithrilInterop';
import { formatCoin } from 'adapters/currency';
import { ChainBase } from 'common-common/src/types';
import type Substrate from 'controllers/chain/substrate/adapter';
import type { SubstrateBounty } from 'controllers/chain/substrate/bounty';

import 'pages/bounties.scss';

import app from 'state';
import { CountdownUntilBlock } from 'views/components/countdown';
import { ProposalCard } from 'views/components/proposal_card';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import { CardsCollection } from '../../components/cards_collection';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { GovExplainer } from '../../components/gov_explainer';
import { loadSubstrateModules } from '../../components/load_substrate_modules';
import ErrorPage from '../error';
import { getActionSection, getModules } from './helpers';

type BountyDetailAttrs = {
  bounty: SubstrateBounty;
};

class BountyDetail extends ClassComponent<BountyDetailAttrs> {
  view(vnode: ResultNode<BountyDetailAttrs>) {
    const { bounty } = vnode.attrs;

    const isCouncillor =
      app.chain &&
      ((app.chain as Substrate).phragmenElections.members || [])
        .map((a) => app.chain.accounts.get(a))
        .find(
          (a) =>
            a.chain === app.user.activeAccount?.chain &&
            a.address === app.user.activeAccount?.address
        );

    const isCurator = app.user.activeAccount?.address === bounty.curator;

    const isRecipient = app.user.activeAccount?.address === bounty.beneficiary;

    return (
      <div
        className="BountyDetail"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="bounty-info-container">
          <div className="bounty-info-row">
            <CWText>Proposed</CWText>
            {bounty.isProposed && <CWIcon iconName="check" iconSize="small" />}
          </div>
          <div className="bounty-info-row">
            <CWText>Approved by council</CWText>
            {bounty.isApproved && <CWIcon iconName="check" iconSize="small" />}
          </div>
          <div className="bounty-info-row">
            <CWText>Funded by treasury</CWText>
            {bounty.isFunded && <CWIcon iconName="check" iconSize="small" />}
          </div>
          <div className="bounty-info-row">
            <CWText>Curator proposed</CWText>
            {bounty.isCuratorProposed && (
              <CWIcon iconName="check" iconSize="small" />
            )}
          </div>
          <div className="bounty-info-row">
            <CWText>Curator selected</CWText>
            {bounty.isActive && <CWIcon iconName="check" iconSize="small" />}
          </div>
          <div className="bounty-info-row">
            <CWText>Payout pending</CWText>
            {bounty.isPendingPayout && (
              <CWIcon iconName="check" iconSize="small" />
            )}
          </div>
        </div>
        <div className="action">
          {getActionSection(bounty, isCouncillor, isCurator, isRecipient)}
        </div>
      </div>
    );
  }
}

class BountiesPage extends ClassComponent {
  view() {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage
            message="Could not connect to chain"
            title={<BreadcrumbsTitleTag title="Bounties" />}
          />
        );
      }

      return (
        <PageLoading
          message="Connecting to chain"
          // title={<BreadcrumbsTitleTag title="Council" />}
        />
      );
    }

    const modLoading = loadSubstrateModules('Bounties', getModules);

    if (modLoading) return modLoading;

    const activeBounties = (app.chain as Substrate).bounties.store
      .getAll()
      .filter((p) => !p.completed && !p.isPendingPayout)
      .sort((a, b) => +a.identifier - +b.identifier);

    const pendingBounties = (app.chain as Substrate).bounties.store
      .getAll()
      .filter((p) => !p.completed && p.isPendingPayout)
      .sort((a, b) => +a.identifier - +b.identifier);

    const inactiveBounties = (app.chain as Substrate).bounties.store
      .getAll()
      .filter((p) => p.completed)
      .sort((a, b) => +a.identifier - +b.identifier);

    const activeBountyContent = activeBounties.length ? (
      activeBounties.map((bounty) => (
        <ProposalCard
          proposal={bounty}
          injectedContent={<BountyDetail bounty={bounty} />}
        />
      ))
    ) : (
      <div className="no-proposals">None</div>
    );

    const pendingBountyContent = pendingBounties.length ? (
      pendingBounties.map((bounty) => (
        <ProposalCard
          proposal={bounty}
          injectedContent={<BountyDetail bounty={bounty} />}
        />
      ))
    ) : (
      <div className="no-proposals">None</div>
    );

    const inactiveBountyContent = inactiveBounties.length ? (
      inactiveBounties.map((bounty) => (
        <ProposalCard
          proposal={bounty}
          injectedContent={<BountyDetail bounty={bounty} />}
        />
      ))
    ) : (
      <div className="no-proposals">None</div>
    );

    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Council" />}
      >
        <div className="BountiesPage">
          <GovExplainer
            statHeaders={[
              {
                statName: 'Bounties',
                statDescription: `are requests for treasury funding that \
                  are assigned by the council to be managed by a curator.`,
              },
            ]}
            stats={[
              {
                statHeading: 'Treasury:',
                stat:
                  app.chain &&
                  formatCoin((app.chain as Substrate).treasury.pot),
              },
              {
                statHeading: 'Next spend period:',
                stat: (app.chain as Substrate).treasury.nextSpendBlock ? (
                  <CountdownUntilBlock
                    block={(app.chain as Substrate).treasury.nextSpendBlock}
                    includeSeconds={false}
                  />
                ) : (
                  '--'
                ),
              },
            ]}
          />
          <CardsCollection
            content={activeBountyContent}
            header="Active Bounties"
          />
          <CardsCollection
            content={pendingBountyContent}
            header="Payout Pending Review"
          />
          <CardsCollection
            content={inactiveBountyContent}
            header="Inactive Bounties"
          />
        </div>
      </Sublayout>
    );
  }
}

export default BountiesPage;
