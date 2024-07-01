import { ChainBase, ChainNetwork } from '@hicommonwealth/shared';
import type Aave from 'controllers/chain/ethereum/aave/adapter';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import type Compound from 'controllers/chain/ethereum/compound/adapter';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import 'pages/proposals.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import {
  useDepositParamsQuery,
  usePoolParamsQuery,
  useStakingParamsQuery,
} from 'state/api/chainParams';
import {
  useAaveProposalsQuery,
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
  useCompoundProposalsQuery,
} from 'state/api/proposals';
import { ProposalCard } from 'views/components/ProposalCard';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import useManageDocumentTitle from '../../hooks/useManageDocumentTitle';
import { getStatusText } from '../components/ProposalCard/helpers';
import { CardsCollection } from '../components/cards_collection';
import { CWText } from '../components/component_kit/cw_text';
import CWCircleMultiplySpinner from '../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { AaveProposalCardDetail } from '../components/proposals/aave_proposal_card_detail';
import { CompoundProposalStats } from '../components/proposals/proposals_explainers';

const ProposalsPage = () => {
  const [isLoading, setLoading] = useState(
    !app.chain || !app.chain.loaded || !app.chain.apiInitialized,
  );
  useInitChainIfNeeded(app); // if chain is selected, but data not loaded, initialize it

  const onCompound = app.chain?.network === ChainNetwork.Compound;
  const onAave = app.chain?.network === ChainNetwork.Aave;
  const onCosmos = app.chain?.base === ChainBase.CosmosSDK;

  const { data: cachedAaveProposals } = useAaveProposalsQuery({
    moduleReady: app.chain?.network === ChainNetwork.Aave && !isLoading,
    communityId: app.chain?.id,
  });

  const { data: cachedCompoundProposals } = useCompoundProposalsQuery({
    moduleReady: app.chain?.network === ChainNetwork.Compound && !isLoading,
    communityId: app.chain?.id,
  });

  useEffect(() => {
    app.chainAdapterReady.on('ready', () => setLoading(false));

    return () => {
      app.chainAdapterReady.off('ready', () => {
        setLoading(false);
        app.chainAdapterReady.removeAllListeners();
      });
    };
  }, [setLoading]);

  useManageDocumentTitle('Proposals');

  // lazy load Cosmos chain params
  const { data: stakingDenom } = useStakingParamsQuery();
  // @ts-expect-error <StrictNullChecks/>
  useDepositParamsQuery(stakingDenom);
  usePoolParamsQuery();

  const {
    data: activeCosmosProposals,
    isLoading: isLoadingCosmosActiveProposalsRQ,
  } = useActiveCosmosProposalsQuery({
    isApiReady: !!app.chain?.apiInitialized,
  });
  const isLoadingCosmosActiveProposals =
    onCosmos && isLoadingCosmosActiveProposalsRQ;

  const {
    data: completedCosmosProposals,
    isLoading: isCosmosCompletedProposalsLoadingRQ,
  } = useCompletedCosmosProposalsQuery({
    isApiReady: !!app.chain?.apiInitialized,
  });
  const isLoadingCosmosCompletedProposals =
    onCosmos && isCosmosCompletedProposalsLoadingRQ;

  if (isLoading) {
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

  // if (isAaveError || isCompoundError) {
  //   return <ErrorPage message="Could not connect to chain" />;
  // }

  let aaveProposals: AaveProposal[];
  if (onAave)
    aaveProposals =
      cachedAaveProposals || (app.chain as Aave).governance.store.getAll();

  let compoundProposals: CompoundProposal[];
  if (onCompound)
    compoundProposals =
      cachedCompoundProposals ||
      (app.chain as Compound).governance.store.getAll();

  // active proposals
  const activeCompoundProposals =
    onCompound &&
    // @ts-expect-error <StrictNullChecks/>
    compoundProposals
      .filter((p) => !p.completed)
      .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);

  const activeAaveProposals =
    onAave &&
    // @ts-expect-error <StrictNullChecks/>
    aaveProposals
      .filter((p) => !p.completed)
      .sort((p1, p2) => +p2.startBlock - +p1.startBlock);

  const activeProposalContent = isLoadingCosmosActiveProposals ? (
    <CWCircleMultiplySpinner />
  ) : !activeCosmosProposals?.length &&
    // @ts-expect-error <StrictNullChecks/>
    !activeCompoundProposals?.length &&
    // @ts-expect-error <StrictNullChecks/>
    !activeAaveProposals?.length ? (
    [
      <div key="no-active" className="no-proposals">
        No active proposals
      </div>,
    ]
  ) : (
    (activeCosmosProposals || [])
      .map((proposal) => (
        // @ts-expect-error <StrictNullChecks/>
        <ProposalCard key={proposal.identifier} proposal={proposal} />
      ))
      .concat(
        (activeCompoundProposals || []).map((proposal, i) => (
          <ProposalCard key={i} proposal={proposal} />
        )),
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
        )),
      )
  );

  // lazy-loaded in useGetCompletedProposals
  const inactiveCosmosProposals = onCosmos && completedCosmosProposals;

  const inactiveCompoundProposals =
    onCompound &&
    // @ts-expect-error <StrictNullChecks/>
    compoundProposals
      .filter((p) => p.completed)
      .sort((p1, p2) => +p2.startingPeriod - +p1.startingPeriod);

  const inactiveAaveProposals =
    onAave &&
    // @ts-expect-error <StrictNullChecks/>
    aaveProposals
      .filter((p) => p.completed)
      .sort((p1, p2) => +p2.startBlock - +p1.startBlock);

  const inactiveProposalContent = isLoadingCosmosCompletedProposals ? (
    <CWCircleMultiplySpinner />
  ) : // @ts-expect-error <StrictNullChecks/>
  !inactiveCosmosProposals?.length &&
    // @ts-expect-error <StrictNullChecks/>
    !inactiveCompoundProposals?.length &&
    // @ts-expect-error <StrictNullChecks/>
    !inactiveAaveProposals?.length ? (
    [
      <div key="no-inactive" className="no-proposals">
        No past proposals
      </div>,
    ]
  ) : (
    []
      .concat(
        // @ts-expect-error <StrictNullChecks/>
        (inactiveCosmosProposals || []).map((proposal) => (
          // @ts-expect-error <StrictNullChecks/>
          <ProposalCard key={proposal.identifier} proposal={proposal} />
        )),
      )
      .concat(
        // @ts-expect-error <StrictNullChecks/>
        (inactiveCompoundProposals || []).map((proposal, i) => (
          <ProposalCard key={i} proposal={proposal} />
        )),
      )
      .concat(
        // @ts-expect-error <StrictNullChecks/>
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
        )),
      )
  );

  return (
    <CWPageLayout>
      <div className="ProposalsPage">
        <div className="header">
          <CWText type="h2" fontWeight="medium">
            Proposals
          </CWText>
        </div>
        {onCompound && <CompoundProposalStats chain={app.chain as Compound} />}
        <CardsCollection content={activeProposalContent} header="Active" />
        <CardsCollection content={inactiveProposalContent} header="Inactive" />
      </div>
    </CWPageLayout>
  );
};

export default ProposalsPage;
