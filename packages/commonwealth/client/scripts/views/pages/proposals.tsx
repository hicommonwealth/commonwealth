import React, { useEffect, useRef, useState } from 'react';

import { ChainBase, ChainNetwork } from 'common-common/src/types';
import type Cosmos from 'controllers/chain/cosmos/adapter';
import type Aave from 'controllers/chain/ethereum/aave/adapter';
import type Compound from 'controllers/chain/ethereum/compound/adapter';
import type NearSputnik from 'controllers/chain/near/sputnik/adapter';
import type Substrate from 'controllers/chain/substrate/adapter';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import type ProposalModule from '../../models/ProposalModule';
import { initChain } from 'helpers/chain';
import 'pages/proposals.scss';

import app from 'state';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import { ProposalCard } from 'views/components/proposal_card';
import { PageNotFound } from 'views/pages/404';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CardsCollection } from '../components/cards_collection';
import { getStatusText } from '../components/proposal_card/helpers';
import { AaveProposalCardDetail } from '../components/proposals/aave_proposal_card_detail';
import {
  CompoundProposalStats,
  SubstrateProposalStats,
} from '../components/proposals/proposals_explainers';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { useGetCompletedCosmosProposals } from 'hooks/cosmos/useGetCompletedCosmosProposals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModules(): ProposalModule<any, any, any>[] {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [chain.treasury, chain.democracyProposals, chain.democracy];
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    const chain = app.chain as Cosmos;
    return [chain.governance];
  } else {
    throw new Error('invalid chain');
  }
}

const ProposalsPage = () => {
  const [isLoading, setLoading] = useState(
    !app.chain || !app.chain.loaded || !app.chain.apiInitialized
  );
  const [isSubstrateLoading, setSubstrateLoading] = useState(false);
  const [
    isCosmosCompletedProposalsLoading,
    setIsCosmosCompletedProposalsLoading,
  ] = useState(false);
  const [
    isCosmosCompletedProposalsLoadingMore,
    setIsCosmosCompletedProposalsLoadingMore,
  ] = useState(false);
  const hasFetchedApiRef = useRef(false);

  useEffect(() => {
    const chainInit = async () => {
      if (!hasFetchedApiRef.current) {
        hasFetchedApiRef.current = true;
        await initChain();
      }
    };

    if (!app.chain?.apiInitialized || !app.chain?.loaded) chainInit();
  }, [app.chain, initChain]);

  useEffect(() => {
    app.chainAdapterReady.on('ready', () => setLoading(false));
    app.chainModuleReady.on('ready', () => setSubstrateLoading(false));

    return () => {
      app.chainAdapterReady.off('ready', () => {
        setLoading(false);
        app.chainAdapterReady.removeAllListeners();
      });
      app.chainModuleReady.off('ready', () => {
        setSubstrateLoading(false);
        app.chainModuleReady.removeAllListeners();
      });
    };
  }, [setLoading, setSubstrateLoading]);

  const { completedCosmosProposals } = useGetCompletedCosmosProposals({
    app,
    setIsLoading: setIsCosmosCompletedProposalsLoading,
    isLoading: isCosmosCompletedProposalsLoading,
    setIsLoadingMore: setIsCosmosCompletedProposalsLoadingMore,
  });

  if (isLoading) {
    if (
      app.chain?.base === ChainBase.Substrate &&
      (app.chain as Substrate).chain?.timedOut
    ) {
      return <ErrorPage message="Could not connect to chain" />;
    }

    if (app.chain?.failed) {
      return (
        <PageNotFound
          title="Wrong Ethereum Provider Network!"
          message="Change Metamask to point to Ethereum Mainnet"
        />
      );
    }

    return <PageLoading message="Connecting to chain" />;
  }

  const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;
  const onCompound = app.chain && app.chain.network === ChainNetwork.Compound;
  const onAave = app.chain && app.chain.network === ChainNetwork.Aave;
  const onSputnik = app.chain && app.chain.network === ChainNetwork.Sputnik;
  const onCosmos = app.chain && app.chain.base === ChainBase.CosmosSDK;

  const modLoading = loadSubstrateModules('Proposals', getModules);

  if (isSubstrateLoading) return modLoading;

  // active proposals
  const activeDemocracyProposals =
    onSubstrate &&
    (app.chain as Substrate).democracyProposals.store
      .getAll()
      .filter((p) => !p.completed);

  const activeCosmosProposals =
    onCosmos &&
    (app.chain as Cosmos).governance.store
      .getAll()
      .map((p) => p as CosmosProposal | CosmosProposalV1)
      .filter((p) => !p.completed)
      .sort((a, b) => +b.identifier - +a.identifier);

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
    !activeCosmosProposals?.length &&
    !activeCompoundProposals?.length &&
    !activeAaveProposals?.length &&
    !activeSputnikProposals?.length
      ? [
          <div key="no-active" className="no-proposals">
            No active proposals
          </div>,
        ]
      : (activeDemocracyProposals || [])
          .map((proposal, i) => <ProposalCard key={i} proposal={proposal} />)
          .concat(
            (activeCosmosProposals || []).map((proposal) => (
              <ProposalCard key={proposal.identifier} proposal={proposal} />
            ))
          )
          .concat(
            (activeCompoundProposals || []).map((proposal, i) => (
              <ProposalCard key={i} proposal={proposal} />
            ))
          )
          .concat(
            (activeAaveProposals || []).map((proposal, i) => (
              <ProposalCard
                key={i}
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
            (activeSputnikProposals || []).map((proposal, i) => (
              <ProposalCard key={i} proposal={proposal} />
            ))
          );

  // inactive proposals
  const inactiveDemocracyProposals =
    onSubstrate &&
    (app.chain as Substrate).democracyProposals.store
      .getAll()
      .filter((p) => p.completed);

  // lazy-loaded in useGetCompletedProposals
  const inactiveCosmosProposals = onCosmos && completedCosmosProposals;

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

  const inactiveProposalContent = isCosmosCompletedProposalsLoading ? (
    <CWSpinner />
  ) : !inactiveDemocracyProposals?.length &&
    !inactiveCosmosProposals?.length &&
    !inactiveCompoundProposals?.length &&
    !inactiveAaveProposals?.length &&
    !inactiveSputnikProposals?.length ? (
    [
      <div key="no-inactive" className="no-proposals">
        No past proposals
      </div>,
    ]
  ) : (
    (inactiveDemocracyProposals || [])
      .map((proposal, i) => <ProposalCard key={i} proposal={proposal} />)
      .concat(
        inactiveCosmosProposals?.length
          ? inactiveCosmosProposals
              .map((proposal) => (
                <ProposalCard key={proposal.identifier} proposal={proposal} />
              ))
              .concat(isCosmosCompletedProposalsLoadingMore && <CWSpinner />)
          : []
      )
      .concat(
        (inactiveCompoundProposals || []).map((proposal, i) => (
          <ProposalCard key={i} proposal={proposal} />
        ))
      )
      .concat(
        (inactiveAaveProposals || []).map((proposal, i) => (
          <ProposalCard
            key={i}
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
        (inactiveSputnikProposals || []).map((proposal, i) => (
          <ProposalCard key={i} proposal={proposal} />
        ))
      )
  );

  return (
    <Sublayout>
      <div className="ProposalsPage">
        {onSubstrate && (
          <SubstrateProposalStats
            nextLaunchBlock={
              (app.chain as Substrate).democracyProposals.nextLaunchBlock
            }
          />
        )}
        {onCompound && <CompoundProposalStats chain={app.chain as Compound} />}
        <CardsCollection content={activeProposalContent} header="Active" />
        <CardsCollection content={inactiveProposalContent} header="Inactive" />
      </div>
    </Sublayout>
  );
};

export default ProposalsPage;
