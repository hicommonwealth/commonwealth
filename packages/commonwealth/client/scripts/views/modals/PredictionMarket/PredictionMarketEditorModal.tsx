import React, { useMemo, useRef, useState } from 'react';

import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import PredictionMarket from 'client/scripts/helpers/ContractHelpers/predictionMarket';
import type Thread from 'client/scripts/models/Thread';
import { trpc } from 'client/scripts/utils/trpcClient';
import clsx from 'clsx';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import {
  useCreatePredictionMarketMutation,
  useDeployPredictionMarketMutation,
} from 'state/api/predictionMarket';
import useUserStore from 'state/ui/user';
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
import {
  convertInitialLiquidityToWei,
  deployPredictionMarketOnChain,
} from './deployPredictionMarketOnChain';
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
import { SyncPromptData } from './SyncPromptData';

const BASE_MAINNET_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

const BASE_SEPOLIA_COLLATERAL_OPTIONS = [
  {
    value: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    label: 'USDC',
  },
  {
    value: '0x4200000000000000000000000000000000000006',
    label: 'WETH',
  },
];

const BASE_MAINNET_COLLATERAL_OPTIONS = [
  {
    value: '0x833589fCD6EDb6E08f4c7C32D4f71b54bDa02913',
    label: 'USDC',
  },
  {
    value: '0x4200000000000000000000000000000000000006',
    label: 'WETH',
  },
];

type Phase = 'form' | 'creating' | 'deploying' | 'success' | 'error';

type PredictionMarketEditorModalProps = {
  onModalClose: () => void;
  thread: Thread;
  onSuccess?: () => void;
  /** AI-generated prompt text; synced into the form when present */
  promptData?: string;
  /** False while AI is streaming the prompt */
  isAIresponseCompleted?: boolean;
  /** Called when user clicks the AI generate button; only shown when AI is enabled */
  onGeneratePrompt?: () => void;
};

export const PredictionMarketEditorModal = ({
  onModalClose,
  thread,
  onSuccess,
  promptData = '',
  isAIresponseCompleted = true,
  onGeneratePrompt,
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
  const collateralOptions = useMemo(
    () => [
      ...(ethChainId === BASE_MAINNET_CHAIN_ID
        ? BASE_MAINNET_COLLATERAL_OPTIONS
        : ethChainId === BASE_SEPOLIA_CHAIN_ID
          ? BASE_SEPOLIA_COLLATERAL_OPTIONS
          : BASE_SEPOLIA_COLLATERAL_OPTIONS),
      { value: 'custom', label: 'Custom ERC20' },
    ],
    [ethChainId],
  );
  const initialFormValues = useMemo(
    () => ({
      prompt: '',
      collateralOption: collateralOptions[0],
      customCollateralAddress: '',
      durationDays: 14,
      resolutionThreshold: THRESHOLD_DEFAULT,
      initialLiquidity: '1',
    }),
    [collateralOptions],
  );

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
    if (!thread?.id) return;
    const collateralAddress =
      values.collateralOption.value === 'custom'
        ? values.customCollateralAddress.trim()
        : values.collateralOption.value;

    setErrorMessage(null);

    try {
      setPhase('creating');
      const initialLiquidity = (values.initialLiquidity ?? '').trim() || '0';
      const initialLiquidityWei = await convertInitialLiquidityToWei({
        chain_rpc: chainRpc,
        collateral_address: collateralAddress as `0x${string}`,
        initial_liquidity: initialLiquidity,
        user_address: activeAddress,
      });
      if (initialLiquidityWei <= 0n) {
        throw new Error('Initial liquidity is too small for token decimals.');
      }

      await createMutation.mutateAsync({
        thread_id: thread.id,
        prompt: values.prompt.trim(),
        collateral_address: collateralAddress as `0x${string}`,
        duration: values.durationDays * 86400,
        resolution_threshold: values.resolutionThreshold / 100,
        initial_liquidity: initialLiquidityWei.toString(),
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
        initial_liquidity_wei: initialLiquidityWei.toString(),
      });

      await deployMutation.mutateAsync({
        thread_id: thread.id,
        prediction_market_id: predictionMarketId,
        proposal_id: payload.proposal_id,
        market_id: payload.market_id,
        vault_address: payload.vault_address as string,
        governor_address: payload.governor_address as string,
        router_address: payload.router_address as string,
        strategy_address: payload.strategy_address as string,
        p_token_address: payload.p_token_address as string,
        f_token_address: payload.f_token_address as string,
        start_time: payload.start_time as unknown,
        end_time: payload.end_time as unknown,
        initial_liquidity: initialLiquidityWei.toString(),
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
        initialValues={initialFormValues}
        onSubmit={handleCreateAndDeploy}
        onErrors={(values) => console.log(values)}
      >
        {({ watch, register }) => (
          <>
            <SyncPromptData promptData={promptData} />
            <CWModalBody>
              <div className="prompt-row">
                <div className="prompt-input-with-ai">
                  <CWTextArea
                    name="prompt"
                    hookToForm
                    label="Prompt"
                    placeholder="What outcome should this market resolve? This will determine PASS vs FAIL resolution"
                    maxLength={PROMPT_MAX_LENGTH}
                    charCount={PROMPT_MAX_LENGTH}
                  />
                  {onGeneratePrompt && (
                    <CWButton
                      type="button"
                      iconLeft="sparkle"
                      label="Generate with AI"
                      buttonType="secondary"
                      buttonHeight="sm"
                      disabled={!isAIresponseCompleted}
                      onClick={onGeneratePrompt}
                      className="prompt-ai-button prompt-ai-button--compact"
                    />
                  )}
                  {!isAIresponseCompleted && (
                    <span className="prompt-ai-spinner">
                      <CWCircleMultiplySpinner center={false} />
                    </span>
                  )}
                </div>
              </div>

              <div
                className={clsx('collateral-select-row', {
                  fullRow: watch('collateralOption')?.value !== 'custom',
                })}
              >
                <CWSelectList
                  name="collateralOption"
                  hookToForm
                  label="Collateral token"
                  isSearchable={false}
                  options={collateralOptions}
                  placeholder="Select collateral"
                />
                {watch('collateralOption')?.value === 'custom' && (
                  <CWTextInput
                    name="customCollateralAddress"
                    hookToForm
                    placeholder="0x..."
                    label="ERC20 contract address"
                    fullWidth
                  />
                )}
              </div>

              <div className="duration-liquidity-row">
                <CWTextInput
                  name="durationDays"
                  hookToForm
                  type="number"
                  label="Duration Days"
                  placeholder={`${DURATION_MIN}-${DURATION_MAX}`}
                  instructionalMessage="Market will be open for trading for this many days."
                  fullWidth
                />
                <CWTextInput
                  name="initialLiquidity"
                  hookToForm
                  label="Initial Liquidity"
                  placeholder="0"
                  fullWidth
                />
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
