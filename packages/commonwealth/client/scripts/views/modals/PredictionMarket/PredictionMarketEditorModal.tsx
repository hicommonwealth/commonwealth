import React, { useRef, useState } from 'react';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import PredictionMarket from 'helpers/ContractHelpers/predictionMarket';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import {
  useCreatePredictionMarketMutation,
  useDeployPredictionMarketMutation,
} from 'state/api/predictionMarket';
import useUserStore from 'state/ui/user';
import { trpc } from 'utils/trpcClient';
import type Thread from '../../../models/Thread';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWForm } from '../../components/component_kit/new_designs/CWForm';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import { CWSelectList } from '../../components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { deployPredictionMarketOnChain } from './deployPredictionMarketOnChain';
import './PredictionMarketEditorModal.scss';
import {
  DURATION_MAX,
  DURATION_MIN,
  predictionMarketEditorFormSchema,
  PROMPT_MAX_LENGTH,
  THRESHOLD_DEFAULT,
  THRESHOLD_MAX,
  THRESHOLD_MIN,
} from './predictionMarketEditorValidation';

// Base Sepolia placeholder addresses; replace with chain config when available
const COLLATERAL_OPTIONS = [
  {
    value: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    label: 'USDC',
  },
  {
    value: '0x4200000000000000000000000000000000000006',
    label: 'WETH',
  },
  { value: 'custom', label: 'Custom ERC20' },
];

type Phase = 'form' | 'creating' | 'deploying' | 'success' | 'error';

type PredictionMarketEditorModalProps = {
  onModalClose: () => void;
  thread: Thread;
  onSuccess?: () => void;
};

const INITIAL_FORM_VALUES = {
  prompt: '',
  collateralOption: COLLATERAL_OPTIONS[0],
  customCollateralAddress: '',
  durationDays: 14,
  resolutionThreshold: THRESHOLD_DEFAULT,
  initialLiquidity: '',
};

export const PredictionMarketEditorModal = ({
  onModalClose,
  thread,
  onSuccess,
}: PredictionMarketEditorModalProps) => {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('form');
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

  const createMutation = useCreatePredictionMarketMutation();
  const deployMutation = useDeployPredictionMarketMutation();
  const utils = trpc.useUtils();

  const handleCreateAndDeploy = async (values: {
    prompt: string;
    collateralOption: { value: string; label: string };
    customCollateralAddress: string;
    durationDays: number;
    resolutionThreshold: number;
    initialLiquidity: string;
  }) => {
    console.log('values => ', values);
    if (!thread?.id) return;
    const collateralAddress =
      values.collateralOption.value === 'custom'
        ? values.customCollateralAddress.trim()
        : values.collateralOption.value;

    setErrorMessage(null);

    try {
      setPhase('creating');
      await createMutation.mutateAsync({
        thread_id: thread.id,
        prompt: values.prompt.trim(),
        collateral_address: collateralAddress as `0x${string}`,
        duration: values.durationDays * 86400,
        resolution_threshold: values.resolutionThreshold / 100,
      });

      if (!activeAddress) {
        setPhase('error');
        setErrorMessage(
          'Wallet not connected. Connect a wallet to deploy on-chain.',
        );
        notifyError('Wallet not connected.');
        return;
      }

      const deployConfigured =
        ethChainId &&
        chainRpc &&
        PredictionMarket.isDeployConfigured(ethChainId);

      if (!deployConfigured) {
        notifySuccess(
          'Prediction market draft created. On-chain deployment is not configured for this chain.',
        );
        setPhase('success');
        onSuccess?.();
        onModalClose();
        return;
      }

      setPhase('deploying');

      const marketsData =
        await utils.predictionMarket.getPredictionMarkets.fetch({
          thread_id: thread.id,
          limit: 1,
        });
      const results = (
        marketsData as { results?: { id: number }[] } | undefined
      )?.results;
      const predictionMarketId =
        Array.isArray(results) && results[0] ? results[0].id : null;

      if (predictionMarketId == null) {
        setPhase('error');
        setErrorMessage('Could not find the created prediction market.');
        notifyError('Could not find the created prediction market.');
        return;
      }

      const payload = await deployPredictionMarketOnChain({
        eth_chain_id: ethChainId,
        chain_rpc: chainRpc,
        user_address: activeAddress,
        prompt: values.prompt.trim(),
        collateral_address: collateralAddress as `0x${string}`,
        duration_days: values.durationDays,
        resolution_threshold: values.resolutionThreshold / 100,
        initial_liquidity: (values.initialLiquidity ?? '').trim() || '0',
      });

      await deployMutation.mutateAsync({
        thread_id: thread.id,
        prediction_market_id: predictionMarketId,
        vault_address: payload.vault_address,
        governor_address: payload.governor_address,
        router_address: payload.router_address,
        strategy_address: payload.strategy_address,
        p_token_address: payload.p_token_address,
        f_token_address: payload.f_token_address,
        start_time: payload.start_time,
        end_time: payload.end_time,
      });

      notifySuccess('Prediction market created and deployed.');
      setPhase('success');
      onSuccess?.();
      onModalClose();
    } catch (err) {
      setPhase('error');
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to create prediction market';
      setErrorMessage(message);
      notifyError(message);
    }
  };

  if (phase === 'creating' || phase === 'deploying') {
    return (
      <div className="PredictionMarketEditorModal" ref={modalContainerRef}>
        <CWModalHeader
          label="Create Prediction Market"
          onModalClose={onModalClose}
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
            <CWText type="b1">
              {phase === 'creating'
                ? 'Creating draft…'
                : 'Preparing deployment…'}
            </CWText>
          </div>
        </CWModalBody>
      </div>
    );
  }

  return (
    <div className="PredictionMarketEditorModal" ref={modalContainerRef}>
      <CWModalHeader
        label="Create Prediction Market"
        onModalClose={onModalClose}
      />
      <CWForm
        className="PredictionMarketEditorModal-form"
        validationSchema={predictionMarketEditorFormSchema}
        initialValues={INITIAL_FORM_VALUES}
        onSubmit={handleCreateAndDeploy}
        onErrors={(values) => console.log(values)}
      >
        {({ watch, register }) => (
          <>
            <CWModalBody>
              <div className="prompt-row">
                <CWTextArea
                  name="prompt"
                  hookToForm
                  label="Prompt"
                  placeholder="What outcome should this market resolve?"
                  maxLength={PROMPT_MAX_LENGTH}
                  charCount={PROMPT_MAX_LENGTH}
                />
                <CWText type="caption" className="help-text">
                  This question will determine PASS vs FAIL resolution.
                </CWText>
              </div>

              <div className="collateral-select-row">
                <CWSelectList
                  name="collateralOption"
                  hookToForm
                  value={watch('collateralOption')}
                  label="Collateral token"
                  menuPortalTarget={modalContainerRef?.current}
                  isSearchable={false}
                  options={COLLATERAL_OPTIONS}
                  placeholder="Select collateral"
                />
                {watch('collateralOption')?.value === 'custom' && (
                  <div className="custom-address-row">
                    <CWTextInput
                      name="customCollateralAddress"
                      hookToForm
                      placeholder="0x..."
                      label="ERC20 contract address"
                    />
                  </div>
                )}
              </div>

              <div className="duration-threshold-row">
                <div className="duration-input-row">
                  <CWTextInput
                    name="durationDays"
                    hookToForm
                    type="number"
                    label="Duration (days)"
                    placeholder={`${DURATION_MIN}-${DURATION_MAX}`}
                  />
                  <CWText type="caption" className="help-text">
                    Market will be open for trading for this many days.
                  </CWText>
                </div>

                <div className="threshold-row">
                  <div className="threshold-label-row">
                    <CWLabel label="Resolution threshold (%)" />
                    <span className="threshold-value" aria-live="polite">
                      {watch('resolutionThreshold') ?? THRESHOLD_DEFAULT}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={THRESHOLD_MIN}
                    max={THRESHOLD_MAX}
                    {...register('resolutionThreshold', {
                      valueAsNumber: true,
                    })}
                    aria-label="Resolution threshold percentage"
                    style={{ width: '100%' }}
                  />
                  <CWText type="caption" className="help-text">
                    When the PASS token TWAP reaches this percentage, the market
                    resolves to PASS. Otherwise it resolves to FAIL.
                  </CWText>
                </div>
              </div>

              <div className="liquidity-row">
                <CWTextInput
                  name="initialLiquidity"
                  hookToForm
                  label="Initial liquidity (optional)"
                  placeholder="0"
                />
                <CWText type="caption" className="help-text">
                  Optional amount of collateral to add when the market is
                  created.
                </CWText>
              </div>

              {errorMessage && (
                <CWText type="b2" className="error-message">
                  {errorMessage}
                </CWText>
              )}
            </CWModalBody>
            <CWModalFooter>
              <div className="modal-footer-actions">
                <CWButton
                  label="Cancel"
                  buttonType="secondary"
                  buttonHeight="sm"
                  onClick={onModalClose}
                />
                <CWButton
                  type="submit"
                  label="Create and Deploy"
                  buttonType="primary"
                  buttonHeight="sm"
                />
              </div>
            </CWModalFooter>
          </>
        )}
      </CWForm>
    </div>
  );
};
