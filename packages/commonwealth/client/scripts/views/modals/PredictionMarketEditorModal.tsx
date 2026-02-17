import React, { useRef, useState } from 'react';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useCreatePredictionMarketMutation } from 'state/api/predictionMarket';
import type Thread from '../../models/Thread';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWTextArea } from '../components/component_kit/cw_text_area';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { SelectList } from '../components/component_kit/cw_select_list';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import CWCircleMultiplySpinner from '../components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  DURATION_MAX,
  DURATION_MIN,
  isPredictionMarketFormValid,
  PROMPT_MAX_LENGTH,
  THRESHOLD_DEFAULT,
  THRESHOLD_MAX,
  THRESHOLD_MIN,
} from './predictionMarketEditorValidation';
import './PredictionMarketEditorModal.scss';

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

export const PredictionMarketEditorModal = ({
  onModalClose,
  thread,
  onSuccess,
}: PredictionMarketEditorModalProps) => {
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const [prompt, setPrompt] = useState('');
  const [collateralOption, setCollateralOption] = useState(COLLATERAL_OPTIONS[0]);
  const [customCollateralAddress, setCustomCollateralAddress] = useState('');
  const [durationDays, setDurationDays] = useState(14);
  const [resolutionThreshold, setResolutionThreshold] = useState(THRESHOLD_DEFAULT);
  const [initialLiquidity, setInitialLiquidity] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreatePredictionMarketMutation();

  const collateralAddress =
    collateralOption.value === 'custom'
      ? customCollateralAddress.trim()
      : collateralOption.value;

  const isCustomCollateral = collateralOption.value === 'custom';

  const isValid = isPredictionMarketFormValid({
    prompt,
    durationDays,
    resolutionThreshold,
    collateralAddress,
    initialLiquidity,
  });

  const handleCreateAndDeploy = async () => {
    if (!thread?.id || !isValid) return;
    setErrorMessage(null);

    try {
      setPhase('creating');
      const market = await createMutation.mutateAsync({
        thread_id: thread.id,
        prompt: prompt.trim(),
        collateral_address: collateralAddress as `0x${string}`,
        duration: durationDays,
        resolution_threshold: resolutionThreshold / 100,
      });

      setPhase('deploying');

      // On-chain deployment: Governor.propose() and then deployPredictionMarket with tx result.
      // Contract encoding and wallet signing will be wired when Futarchy contract helpers
      // are available. For now we create the draft and close; full deploy flow in a follow-up.
      notifySuccess('Prediction market draft created.');
      setPhase('success');
      onSuccess?.();
      onModalClose();
    } catch (err) {
      setPhase('error');
      const message =
        err instanceof Error ? err.message : 'Failed to create prediction market';
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
      <CWModalBody>
        <div className="prompt-row">
          <CWTextArea
            label="Prompt"
            placeholder="What outcome should this market resolve?"
            value={prompt}
            onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
            maxLength={PROMPT_MAX_LENGTH}
            charCount={PROMPT_MAX_LENGTH}
          />
          <CWText type="caption" className="help-text">
            This question will determine PASS vs FAIL resolution.
          </CWText>
        </div>

        <div className="collateral-select-row">
          <CWLabel label="Collateral token" />
          <SelectList
            menuPortalTarget={modalContainerRef?.current}
            isSearchable={false}
            options={COLLATERAL_OPTIONS}
            value={collateralOption}
            onChange={(option: { value: string; label: string }) =>
              setCollateralOption(option)
            }
            placeholder="Select collateral"
          />
          {isCustomCollateral && (
            <div className="custom-address-row">
              <CWTextInput
                placeholder="0x..."
                value={customCollateralAddress}
                onInput={(e) =>
                  setCustomCollateralAddress(
                    (e.target as HTMLInputElement).value,
                  )
                }
                label="ERC20 contract address"
              />
            </div>
          )}
        </div>

        <div className="duration-threshold-row">
          <div className="duration-input-row">
            <CWLabel label="Duration (days)" />
            <CWTextInput
              value={String(durationDays)}
              onInput={(e) => {
                const v = parseInt(
                  (e.target as HTMLInputElement).value,
                  10,
                );
                if (!Number.isNaN(v))
                  setDurationDays(Math.min(DURATION_MAX, Math.max(DURATION_MIN, v)));
              }}
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
                {resolutionThreshold}%
              </span>
            </div>
            <input
              type="range"
              min={THRESHOLD_MIN}
              max={THRESHOLD_MAX}
              value={resolutionThreshold}
              onChange={(e) =>
                setResolutionThreshold(Number(e.target.value))
              }
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
            label="Initial liquidity (optional)"
            placeholder="0"
            value={initialLiquidity}
            onInput={(e) =>
              setInitialLiquidity((e.target as HTMLInputElement).value)
            }
          />
          <CWText type="caption" className="help-text">
            Optional amount of collateral to add when the market is created.
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
            label="Create and Deploy"
            buttonType="primary"
            buttonHeight="sm"
            disabled={!isValid}
            onClick={() => void handleCreateAndDeploy()}
          />
        </div>
      </CWModalFooter>
    </div>
  );
};
