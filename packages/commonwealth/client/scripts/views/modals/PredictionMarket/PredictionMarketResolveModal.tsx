import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import PredictionMarket from 'client/scripts/helpers/ContractHelpers/predictionMarket';
import type Thread from 'client/scripts/models/Thread';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import useResolvePredictionMarketMutation from 'state/api/predictionMarket/resolvePredictionMarket';
import useUserStore from 'state/ui/user';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { SelectList } from '../../components/component_kit/cw_select_list';
import { CWText } from '../../components/component_kit/cw_text';
import CWBanner from '../../components/component_kit/new_designs/CWBanner';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { CWTooltip } from '../../components/component_kit/new_designs/CWTooltip';
import './PredictionMarketResolveModal.scss';
import { resolvePredictionMarketOnChain } from './resolvePredictionMarketOnChain';

const TWAP_WINDOW_OPTIONS = [
  { value: '300', label: 'Last 5 min' },
  { value: '900', label: 'Last 15 min' },
  { value: '1800', label: 'Last 30 min' },
  { value: '3600', label: 'Last 1 Hour' },
  { value: '14400', label: 'Last 4 Hours' },
  { value: '43200', label: 'Last 12 Hours' },
  { value: '86400', label: 'Last 24 Hours' },
];

type ActiveMarket = {
  id: number;
  thread_id: number;
  prompt: string;
  status: string;
  proposal_id?: string | null;
  governor_address?: string | null;
  resolution_threshold?: number;
  end_time?: Date | string | null;
  [key: string]: unknown;
};

type PredictionMarketResolveModalProps = {
  thread: Thread;
  market: ActiveMarket;
  onClose: () => void;
  onSuccess?: () => void;
};

export const PredictionMarketResolveModal = ({
  thread,
  market,
  onClose,
  onSuccess,
}: PredictionMarketResolveModalProps) => {
  const [phase, setPhase] = useState<
    'confirm' | 'loading' | 'resolving' | 'error'
  >('confirm');
  const [twapWindowSeconds, setTwapWindowSeconds] = useState(300);
  const [twapProbability, setTwapProbability] = useState<number | null>(null);
  const [twapProbabilityChange, setTwapProbabilityChange] = useState<
    number | null
  >(null);
  const previousTwapProbabilityRef = useRef<number | null>(null);
  const [twapLoading, setTwapLoading] = useState(true);
  const [twapError, setTwapError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const user = useUserStore();
  const activeAddress = user.activeAccount?.address ?? '';
  const resolveMutation = useResolvePredictionMarketMutation();

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

  const governorAddress = (market.governor_address ?? '') as string;
  const proposalId = (market.proposal_id ?? '') as `0x${string}`;
  const resolutionThreshold =
    typeof market.resolution_threshold === 'number'
      ? market.resolution_threshold
      : 0.55;

  const canResolve =
    governorAddress &&
    proposalId &&
    proposalId.startsWith('0x') &&
    chainRpc &&
    ethChainId &&
    PredictionMarket.isDeployConfigured(ethChainId);

  const endTime = market.end_time ? new Date(market.end_time) : new Date(0);
  const isPastEndTime = endTime.getTime() <= Date.now();
  const predictedOutcome: 'PASS' | 'FAIL' =
    twapProbability != null
      ? twapProbability >= resolutionThreshold
        ? 'PASS'
        : 'FAIL'
      : 'PASS'; // default for display
  const passPercent =
    twapProbability != null ? Math.round(twapProbability * 100) : 0;
  const failPercent = 100 - passPercent;

  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const endTimeMs = endTime.getTime();
  useEffect(() => {
    const updateCountdown = () => {
      const nowMs = Date.now();
      const totalSecondsRemaining = Math.max(
        0,
        Math.floor((endTimeMs - nowMs) / 1000),
      );
      setCountdown({
        hours: Math.floor(totalSecondsRemaining / 3600),
        minutes: Math.floor((totalSecondsRemaining % 3600) / 60),
        seconds: totalSecondsRemaining % 60,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [endTimeMs]);

  const endTimeFormatted = moment(endTime).format('D MMMM YYYY @ h:mm A');

  const fetchTwapProbability = useCallback(async () => {
    if (
      !governorAddress ||
      !proposalId ||
      !chainRpc ||
      proposalId.length < 66
    ) {
      setTwapLoading(false);
      setTwapError('Market not fully deployed on-chain.');
      return;
    }
    setTwapLoading(true);
    setTwapError(null);
    try {
      const pm = new PredictionMarket(governorAddress, chainRpc);
      await pm.initialize(false, String(ethChainId));
      const probWei = await pm.getCurrentProbability(
        proposalId as `0x${string}`,
        twapWindowSeconds,
      );
      const prob = Number(probWei) / 1e18;
      const prev = previousTwapProbabilityRef.current;
      const changePct = prev != null ? (prob - prev) * 100 : null;
      previousTwapProbabilityRef.current = prob;
      setTwapProbability(prob);
      setTwapProbabilityChange(changePct);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTwapUnavailable =
        /OLD|twap/i.test(msg) ||
        (/\bexecute\b/i.test(msg) && /\bsmart contract\b/i.test(msg));
      setTwapError(
        isTwapUnavailable
          ? 'TWAP not available for this pool yet (too new). Try a shorter window.'
          : msg,
      );
      setTwapProbability(null);
      setTwapProbabilityChange(null);
    } finally {
      setTwapLoading(false);
    }
  }, [governorAddress, proposalId, chainRpc, ethChainId, twapWindowSeconds]);

  useEffect(() => {
    void fetchTwapProbability();
  }, [fetchTwapProbability]);

  const handleResolve = async () => {
    if (!thread?.id || !activeAddress || !canResolve) {
      setErrorMessage('Wallet not connected or chain not configured.');
      notifyError('Cannot resolve.');
      return;
    }
    if (!isPastEndTime) {
      setErrorMessage('Market has not ended yet.');
      notifyError('Market has not ended yet.');
      return;
    }

    setErrorMessage(null);
    setPhase('resolving');

    try {
      const { winner } = await resolvePredictionMarketOnChain({
        eth_chain_id: ethChainId,
        chain_rpc: chainRpc,
        user_address: activeAddress,
        governor_address: governorAddress,
        proposal_id: proposalId,
        twap_window_seconds: twapWindowSeconds,
      });

      await resolveMutation.mutateAsync({
        thread_id: thread.id,
        prediction_market_id: market.id,
        winner,
      });

      notifySuccess('Prediction market resolved.');
      onSuccess?.();
      onClose();
    } catch (err) {
      setPhase('error');
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to resolve prediction market';
      setErrorMessage(message);
      notifyError(message);
    }
  };

  if (phase === 'resolving') {
    return (
      <div className="PredictionMarketResolveModal" ref={modalContainerRef}>
        <CWModalHeader
          label="Resolve prediction market"
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
            <CWText type="b1">Resolving on-chain…</CWText>
          </div>
        </CWModalBody>
      </div>
    );
  }

  return (
    <div className="PredictionMarketResolveModal" ref={modalContainerRef}>
      <CWModalHeader label="Resolve Market" onModalClose={onClose} />
      <CWModalBody>
        <div className="countdown-section">
          <div className="countdown-header">
            <CWText type="b2" className="countdown-label">
              Resolves In
            </CWText>
            <CWTag
              type="active"
              label={endTimeFormatted}
              classNames="countdown-tag"
            />
          </div>
          <div className="countdown-boxes">
            <div className="countdown-box">
              <CWText type="h2" className="countdown-value">
                {String(countdown.hours).padStart(2, '0')}
              </CWText>
              <CWText type="caption" className="countdown-unit">
                HOURS
              </CWText>
            </div>
            <div className="countdown-box">
              <CWText type="h2" className="countdown-value">
                {String(countdown.minutes).padStart(2, '0')}
              </CWText>
              <CWText type="caption" className="countdown-unit">
                MINUTES
              </CWText>
            </div>
            <div className="countdown-box">
              <CWText type="h2" className="countdown-value">
                {String(countdown.seconds).padStart(2, '0')}
              </CWText>
              <CWText type="caption" className="countdown-unit">
                SECONDS
              </CWText>
            </div>
          </div>
        </div>

        <div className="twap-section">
          <CWText type="h5" className="twap-label">
            Current TWAP Probability
          </CWText>
          {twapLoading ? (
            <div className="twap-skeleton">
              <CWCircleMultiplySpinner />
            </div>
          ) : twapError ? (
            <CWBanner
              type="error"
              body={twapError}
              className="twap-error-banner"
            />
          ) : (
            <>
              <div className="probability-value-row">
                <CWText type="h1" className="probability-value">
                  {passPercent}%
                </CWText>
                {twapProbabilityChange != null && (
                  <span
                    className={`probability-change ${
                      twapProbabilityChange >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    <CWIcon
                      iconName={
                        twapProbabilityChange >= 0 ? 'trendUp' : 'trendDown'
                      }
                      iconSize="small"
                      className="probability-change-icon"
                    />
                    {twapProbabilityChange >= 0 ? '+' : ''}
                    {twapProbabilityChange.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="resolution-threshold-row">
                <div className="threshold-label-row">
                  <CWText type="caption" className="threshold-label">
                    Resolution Threshold
                  </CWText>
                  <span className="threshold-value">
                    {Math.round(resolutionThreshold * 100)}%
                  </span>
                </div>
                <div className="threshold-bar-container">
                  <div className="threshold-bar">
                    <div
                      className="threshold-bar-fill"
                      style={{
                        width: `${resolutionThreshold * 100}%`,
                      }}
                    />
                    <div
                      className="threshold-bar-empty"
                      style={{
                        width: `${(1 - resolutionThreshold) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="twap-window-row">
          <CWText type="b2" className="twap-window-label">
            TWAP Window
          </CWText>
          <SelectList
            menuPortalTarget={modalContainerRef?.current}
            isSearchable={false}
            options={TWAP_WINDOW_OPTIONS}
            value={TWAP_WINDOW_OPTIONS.find(
              (o) => Number(o.value) === twapWindowSeconds,
            )}
            onChange={(opt: { value: string } | null) => {
              if (opt?.value) setTwapWindowSeconds(Number(opt.value));
            }}
          />
        </div>

        <div
          className={`predicted-outcome-box outcome-${predictedOutcome.toLowerCase()}`}
        >
          <CWIcon
            iconName="checkCircleFilled"
            iconSize="medium"
            weight="bold"
            className="predicted-outcome-icon"
          />
          <div className="predicted-outcome-content">
            <CWText
              type="caption"
              fontWeight="bold"
              className="predicted-outcome-label"
            >
              PREDICTED OUTCOME
            </CWText>
            <CWText
              type="h4"
              fontWeight="bold"
              className="predicted-outcome-value"
            >
              {predictedOutcome}
            </CWText>
          </div>
        </div>

        {errorMessage && (
          <CWBanner
            type="error"
            body={errorMessage}
            className="resolve-modal-error-banner"
          />
        )}
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onClose}
        />
        {!isPastEndTime ? (
          <CWTooltip
            placement="top"
            content="Resolution is only available after the market ends."
            renderTrigger={(handleInteraction) => (
              <div
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
              >
                <CWButton
                  iconLeft="checkCircleFilled"
                  label="Resolve Market"
                  buttonType="primary"
                  buttonAlt={predictedOutcome === 'PASS' ? 'green' : 'rorange'}
                  buttonHeight="sm"
                  disabled
                  onClick={() => void handleResolve()}
                />
              </div>
            )}
          />
        ) : (
          <CWButton
            iconLeft="checkCircleFilled"
            label="Resolve Market"
            buttonType="primary"
            buttonAlt={predictedOutcome === 'PASS' ? 'green' : 'rorange'}
            buttonHeight="sm"
            disabled={!canResolve || !activeAddress || !!twapError}
            onClick={() => void handleResolve()}
          />
        )}
      </CWModalFooter>
    </div>
  );
};
