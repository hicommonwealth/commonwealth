/* @jsx m */

import m from 'mithril';

import 'pages/proposals.scss';

import app from 'state';
import { ChainBase, ChainNetwork } from 'types';
import { ProposalModule } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalCard } from 'views/components/proposal_card/proposal_card';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import { PageNotFound } from 'views/pages/404';
import ErrorPage from 'views/pages/error';
import NearSputnik from 'controllers/chain/near/sputnik/adapter';
import { AaveProposalCardDetail } from '../components/proposals/aave_proposal_card_detail';
import { CardsCollection } from '../components/cards_collection';
import {
  CompoundProposalStats,
  SubstrateProposalStats,
} from '../components/proposals/proposals_explainers';
import { getStatusText } from '../components/proposal_card/helpers';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModules(): ProposalModule<any, any, any>[] {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [
      chain.council,
      chain.technicalCommittee,
      chain.treasury,
      chain.democracyProposals,
      chain.democracy,
    ];
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    const chain = app.chain as Cosmos;
    return [chain.governance];
  } else {
    throw new Error('invalid chain');
  }
}

const ProposalsPage: m.Component<{}> = {
  oncreate: () => {
    const returningFromThread =
      app.lastNavigatedBack() && app.lastNavigatedFrom().includes('/proposal/');
    if (
      returningFromThread &&
      localStorage[`${app.activeChainId()}-proposals-scrollY`]
    ) {
      setTimeout(() => {
        window.scrollTo(
          0,
          Number(localStorage[`${app.activeChainId()}-proposals-scrollY`])
        );
      }, 100);
    }
  },

  view() {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage
            message="Could not connect to chain"
            title={<BreadcrumbsTitleTag title="Proposals" />}
          />
        );
      }
      if (app.chain?.failed)
        return (
          <PageNotFound
            title="Wrong Ethereum Provider Network!"
            message="Change Metamask to point to Ethereum Mainnet"
          />
        );
      return (
        <PageLoading
          message="Connecting to chain"
          title={<BreadcrumbsTitleTag title="Proposals" />}
          showNewProposalButton
        />
      );
    }

    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
    const onMoloch = app.chain && app.chain.network === ChainNetwork.Moloch;
    const onCompound = app.chain && app.chain.network === ChainNetwork.Compound;
    const onAave = app.chain && app.chain.network === ChainNetwork.Aave;
    const onSputnik = app.chain && app.chain.network === ChainNetwork.Sputnik;

    const modLoading = loadSubstrateModules('Proposals', getModules);

    if (modLoading) return modLoading;

    // active proposals
    const activeDemocracyProposals =
      onSubstrate &&
      (app.chain as Substrate).democracyProposals.store
        .getAll()
        .filter((p) => !p.completed);

    const activeCouncilProposals =
      onSubstrate &&
      (app.chain as Substrate).council.store
        .getAll()
        .filter((p) => !p.completed);

    const activeCosmosProposals =
      app.chain &&
      app.chain.base === ChainBase.CosmosSDK &&
      (app.chain as Cosmos).governance.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((a, b) => +b.identifier - +a.identifier);

    const activeMolochProposals =
      onMoloch &&
      (app.chain as Moloch).governance.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);

    const activeCompoundProposals =
      onCompound &&
      (app.chain as Compound).governance.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);

    const activeAaveProposals =
      onAave &&
      (app.chain as Aave).governance.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((p1, p2) => +p2.startBlock - +p1.startBlock);

    const activeSputnikProposals =
      onSputnik &&
      (app.chain as NearSputnik).dao.store
        .getAll()
        .filter((p) => !p.completed)
        .sort((p1, p2) => p2.data.id - p1.data.id);

    const activeProposalContent =
      !activeDemocracyProposals?.length &&
      !activeCouncilProposals?.length &&
      !activeCosmosProposals?.length &&
      !activeMolochProposals?.length &&
      !activeCompoundProposals?.length &&
      !activeAaveProposals?.length &&
      !activeSputnikProposals?.length
        ? [<div class="no-proposals">No active proposals</div>]
        : [
            (activeDemocracyProposals || [])
              .map((proposal) => <ProposalCard proposal={proposal} />)
              .concat(
                (activeCouncilProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              )
              .concat(
                (activeCosmosProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              )
              .concat(
                (activeMolochProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              )
              .concat(
                (activeCompoundProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              )
              .concat(
                (activeAaveProposals || []).map((proposal) => (
                  <ProposalCard
                    proposal={proposal}
                    injectedContent={
                      <AaveProposalCardDetail
                        proposal={proposal}
                        statusText={getStatusText(proposal)}
                      />
                    }
                  />
                ))
              )
              .concat(
                (activeSputnikProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              ),
          ];

    // inactive proposals
    const inactiveDemocracyProposals =
      onSubstrate &&
      (app.chain as Substrate).democracyProposals.store
        .getAll()
        .filter((p) => p.completed);

    const inactiveCouncilProposals =
      onSubstrate &&
      (app.chain as Substrate).council.store
        .getAll()
        .filter((p) => p.completed);

    const inactiveCosmosProposals =
      app.chain &&
      app.chain.base === ChainBase.CosmosSDK &&
      (app.chain as Cosmos).governance.store
        .getAll()
        .filter((p) => p.completed)
        .sort((a, b) => +b.identifier - +a.identifier);

    const inactiveMolochProposals =
      onMoloch &&
      (app.chain as Moloch).governance.store
        .getAll()
        .filter((p) => p.completed)
        .sort((p1, p2) => +p2.data.timestamp - +p1.data.timestamp);

    const inactiveCompoundProposals =
      onCompound &&
      (app.chain as Compound).governance.store
        .getAll()
        .filter((p) => p.completed)
        .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);

    const inactiveAaveProposals =
      onAave &&
      (app.chain as Aave).governance.store
        .getAll()
        .filter((p) => p.completed)
        .sort((p1, p2) => +p2.startBlock - +p1.startBlock);

    const inactiveSputnikProposals =
      onSputnik &&
      (app.chain as NearSputnik).dao.store
        .getAll()
        .filter((p) => p.completed)
        .sort((p1, p2) => p2.data.id - p1.data.id);

    const inactiveProposalContent =
      !inactiveDemocracyProposals?.length &&
      !inactiveCouncilProposals?.length &&
      !inactiveCosmosProposals?.length &&
      !inactiveMolochProposals?.length &&
      !inactiveCompoundProposals?.length &&
      !inactiveAaveProposals?.length &&
      !inactiveSputnikProposals?.length
        ? [<div class="no-proposals">No past proposals</div>]
        : [
            (inactiveDemocracyProposals || [])
              .map((proposal) => <ProposalCard proposal={proposal} />)
              .concat(
                (inactiveCouncilProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              )
              .concat(
                (inactiveCosmosProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              )
              .concat(
                (inactiveMolochProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              )
              .concat(
                (inactiveCompoundProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              )
              .concat(
                (inactiveAaveProposals || []).map((proposal) => (
                  <ProposalCard
                    proposal={proposal}
                    injectedContent={
                      <AaveProposalCardDetail
                        proposal={proposal}
                        statusText={getStatusText(proposal)}
                      />
                    }
                  />
                ))
              )
              .concat(
                (inactiveSputnikProposals || []).map((proposal) => (
                  <ProposalCard proposal={proposal} />
                ))
              ),
          ];

    return (
      <Sublayout
        title={<BreadcrumbsTitleTag title="Proposals" />}
        showNewProposalButton
      >
        <div class="ProposalsPage">
          {onSubstrate && (
            <SubstrateProposalStats
              nextLaunchBlock={
                (app.chain as Substrate).democracyProposals.nextLaunchBlock
              }
            />
          )}
          {onCompound && <CompoundProposalStats chain={app.chain} />}
          <CardsCollection content={activeProposalContent} header="Active" />
          <CardsCollection
            content={inactiveProposalContent}
            header="Inactive"
          />
        </div>
      </Sublayout>
    );
  },
};

export default ProposalsPage;
