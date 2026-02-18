import React, { useState } from 'react';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import PredictionMarket from 'helpers/ContractHelpers/predictionMarket';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import { useDeployPredictionMarketMutation } from 'state/api/predictionMarket';
import useUserStore from 'state/ui/user';
import type Thread from '../../models/Thread';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { deployPredictionMarketOnChain } from './deployPredictionMarketOnChain';
import './PredictionMarketEditorModal.scss';

type DraftMarket = {
  id: number;
  thread_id: number;
  prompt: string;
  status: string;
  duration?: number;
  resolution_threshold?: number;
  collateral_address?: string;
  [key: string]: unknown;
};

type DeployDraftPredictionMarketModalProps = {
  thread: Thread;
  market: DraftMarket;
  onClose: () => void;
  onSuccess?: () => void;
};

export const DeployDraftPredictionMarketModal = ({
  thread,
  market,
  onClose,
  onSuccess,
}: DeployDraftPredictionMarketModalProps) => {
  const [phase, setPhase] = useState<'confirm' | 'deploying' | 'error'>(
    'confirm',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const user = useUserStore();
  const activeAddress = user.activeAccount?.address ?? '';
  const { data: community } = useGetCommunityByIdQuery({
    id: thread?.communityId ?? '',
    includeNodeInfo: true,
    enabled: !!thread?.id,
  });
  const chainRpc =
    (community as { ChainNode?: { url?: string } } | undefined)?.ChainNode
      ?.url ?? '';
  const ethChainId =
    (community as { ChainNode?: { eth_chain_id?: number } } | undefined)
      ?.ChainNode?.eth_chain_id ?? 0;

  const deployMutation = useDeployPredictionMarketMutation();

  const deployConfigured =
    ethChainId && chainRpc && PredictionMarket.isDeployConfigured(ethChainId);
  const durationSeconds =
    typeof market.duration === 'number' ? market.duration : 0;
  const durationDays =
    durationSeconds > 0 ? Math.round(durationSeconds / 86400) : 1;
  const resolutionThreshold =
    typeof market.resolution_threshold === 'number'
      ? market.resolution_threshold
      : 0.55;
  const collateralAddress = (market.collateral_address ?? '') as `0x${string}`;

  const handleDeploy = async () => {
    if (!thread?.id || !activeAddress) {
      setErrorMessage('Wallet not connected. Connect a wallet to deploy.');
      notifyError('Wallet not connected.');
      return;
    }
    if (!deployConfigured) {
      setErrorMessage(
        'On-chain deployment is not configured for this chain. Set FutarchyGovernor in chainConfig.',
      );
      notifyError('On-chain deployment is not configured.');
      return;
    }

    setErrorMessage(null);
    setPhase('deploying');

    try {
      const payload = await deployPredictionMarketOnChain({
        eth_chain_id: ethChainId,
        chain_rpc: chainRpc,
        user_address: activeAddress,
        prompt: market.prompt,
        collateral_address: collateralAddress,
        duration_days: durationDays,
        resolution_threshold: resolutionThreshold,
        initial_liquidity: '0',
      });

      await deployMutation.mutateAsync({
        thread_id: thread.id,
        prediction_market_id: market.id,
        vault_address: payload.vault_address,
        governor_address: payload.governor_address,
        router_address: payload.router_address,
        strategy_address: payload.strategy_address,
        p_token_address: payload.p_token_address,
        f_token_address: payload.f_token_address,
        start_time: payload.start_time,
        end_time: payload.end_time,
      });

      notifySuccess('Prediction market deployed.');
      onSuccess?.();
      onClose();
    } catch (err) {
      setPhase('error');
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to deploy prediction market';
      setErrorMessage(message);
      notifyError(message);
    }
  };

  if (phase === 'deploying') {
    return (
      <div className="PredictionMarketEditorModal">
        <CWModalHeader
          label="Deploy prediction market"
          onModalClose={onClose}
        />
        <CWModalBody>
          <div
            className="loading-state"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
            }}
          >
            <CWCircleMultiplySpinner />
            <CWText type="b1">Deploying on-chain…</CWText>
          </div>
        </CWModalBody>
      </div>
    );
  }

  return (
    <div className="PredictionMarketEditorModal">
      <CWModalHeader label="Deploy draft on-chain" onModalClose={onClose} />
      <CWModalBody>
        <CWText type="b2" className="prediction-prompt">
          {market.prompt || 'No prompt'}
        </CWText>
        <CWText type="caption" className="help-text">
          This draft will be deployed to the chain. You will need to sign a
          transaction.
        </CWText>
        {!deployConfigured && (
          <CWText type="caption" className="help-text">
            On-chain deployment is not configured for this chain. Set
            FutarchyGovernor in libs/evm-protocols chainConfig.
          </CWText>
        )}
        {errorMessage && (
          <CWText type="b2" className="error-message">
            {errorMessage}
          </CWText>
        )}
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onClose}
        />
        <CWButton
          label="Deploy on-chain"
          buttonType="primary"
          buttonHeight="sm"
          disabled={!deployConfigured || !activeAddress}
          onClick={() => void handleDeploy()}
        />
      </CWModalFooter>
    </div>
  );
};
