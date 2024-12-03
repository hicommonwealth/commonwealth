import { ChainBase } from '@hicommonwealth/shared';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import React, { useEffect, useState } from 'react';
import app from 'state';
import {
  useDepositParamsQuery,
  usePoolParamsQuery,
  useStakingParamsQuery,
} from 'state/api/chainParams';
import {
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
} from 'state/api/proposals';
import { ProposalCard } from 'views/components/ProposalCard';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import useManageDocumentTitle from '../../hooks/useManageDocumentTitle';
import { CardsCollection } from '../components/cards_collection';
import { CWText } from '../components/component_kit/cw_text';
import CWCircleMultiplySpinner from '../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './proposals.scss';

const ProposalsPage = () => {
  const [isLoading, setLoading] = useState(
    !app.chain || !app.chain.loaded || !app.chain.apiInitialized,
  );
  useInitChainIfNeeded(app); // if chain is selected, but data not loaded, initialize it

  const onCosmos = app.chain?.base === ChainBase.CosmosSDK;

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

  const activeProposalContent = isLoadingCosmosActiveProposals ? (
    <CWCircleMultiplySpinner />
  ) : !activeCosmosProposals?.length ? (
    [
      <div key="no-active" className="no-proposals">
        No active proposals
      </div>,
    ]
  ) : (
    (activeCosmosProposals || []).map((proposal) => (
      // @ts-expect-error <StrictNullChecks/>
      <ProposalCard key={proposal.identifier} proposal={proposal} />
    ))
  );

  // lazy-loaded in useGetCompletedProposals
  const inactiveCosmosProposals = onCosmos && completedCosmosProposals;

  const inactiveProposalContent = isLoadingCosmosCompletedProposals ? (
    <CWCircleMultiplySpinner />
  ) : // @ts-expect-error <StrictNullChecks/>
  !inactiveCosmosProposals?.length ? (
    [
      <div key="no-inactive" className="no-proposals">
        No past proposals
      </div>,
    ]
  ) : (
    [].concat(
      // @ts-expect-error <StrictNullChecks/>
      (inactiveCosmosProposals || []).map((proposal) => (
        // @ts-expect-error <StrictNullChecks/>
        <ProposalCard key={proposal.identifier} proposal={proposal} />
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
        <CardsCollection content={activeProposalContent} header="Active" />
        <CardsCollection content={inactiveProposalContent} header="Inactive" />
      </div>
    </CWPageLayout>
  );
};

export default ProposalsPage;
