import { ClaimAddressView } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import CommonClaim from 'helpers/ContractHelpers/CommonClaim';
import moment from 'moment';
import React from 'react';
import { useGetAllocationQuery } from 'state/api/tokenAllocations';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import FloatingBubbles from 'views/components/FloatingBubbles';
import StaggeredAnimation from 'views/components/StaggeredAnimation';
import z from 'zod';
import ClaimCard from './ClaimCard';
import './CommonAirdropCard.scss';
import { useCommonAirdrop } from './useCommonAirdrop';

type ClaimAddress = Omit<
  z.infer<typeof ClaimAddressView>,
  | 'cliff_date'
  | 'magna_claim_tx_at'
  | 'magna_cliff_claim_tx_at'
  | 'unlock_start_at'
> & {
  unlock_start_at: string | undefined;
  cliff_date: string | undefined;
  magna_claim_tx_at: string | undefined;
  magna_cliff_claim_tx_at: string | undefined;
};
type CommonAirdropCardProps = {
  onConnectNewAddress?: () => void;
  claim: ClaimAddress;
};

// Format token balance with locale separators and 4 decimal places
const formatTokenBalance = (balance: string | number): string => {
  const numBalance = Number(balance);
  return numBalance.toLocaleString(undefined, {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
};

const CommonAirdropCard = ({
  onConnectNewAddress,
  claim,
}: CommonAirdropCardProps) => {
  const user = useUserStore();

  const claimAddress = claim;
  const shouldCollapseClaimState = (() => {
    if (!claimAddress?.cliff_date) {
      return false;
    }

    const cliffDate = moment(claimAddress.cliff_date);
    const now = moment();
    const initialClaimedAt = claimAddress?.magna_claim_tx_at
      ? moment(claimAddress.magna_claim_tx_at)
      : null;

    const cliffDatePassedButInitialClaimNotDone =
      cliffDate.isBefore(now) && !claimAddress?.magna_claim_tx_hash;

    const initialClaimCompletedAfterCliffDate =
      initialClaimedAt && initialClaimedAt.isAfter(cliffDate);

    return (
      cliffDatePassedButInitialClaimNotDone ||
      initialClaimCompletedAfterCliffDate
    );
  })();
  const { initial, final, getWalletProvider } = useCommonAirdrop({
    eventId: claimAddress?.event_id || '',
    tokenSymbol: claimAddress?.token || 'C',
    userClaimAddress: claimAddress?.address || undefined,
    magnaContractAddress: claimAddress?.contract_address || undefined,
    shouldCheckInitialTransactionStatus: !!(
      !claimAddress?.magna_claim_tx_hash && claimAddress?.magna_claimed_at
    ),
    shouldCheckFinalTransactionStatus: !!(
      claimAddress?.magna_claim_tx_hash &&
      claimAddress?.magna_claimed_at &&
      !claimAddress?.magna_cliff_claim_tx_hash &&
      claimAddress?.magna_cliff_claimed_at &&
      !shouldCollapseClaimState
    ),
  });
  const { data: allocation } = useGetAllocationQuery({
    magna_allocation_id: claimAddress?.magna_allocation_id,
    enabled:
      !!claimAddress?.magna_allocation_id && !initial.txHash && user.isLoggedIn,
  });

  const handleImportToken = async () => {
    if (!claimAddress?.token_address) {
      notifyError('Failed to import token');
      return;
    }

    try {
      const { isMagicAddress, provider } = await getWalletProvider(
        claimAddress?.token_address,
      );
      if (isMagicAddress) {
        // magic doesnt expose any api to import tokens to wallet, however if there
        // are any tokens with > 0 value, it auto addes them to their wallet UI
        notifySuccess('Imported to magic wallet');
        return;
      }

      const contract = new CommonClaim(
        claimAddress?.token_address,
        claimAddress?.token || 'C',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider as any,
      );
      await contract.addTokenToWallet({
        address: claimAddress?.token_address,
        symbol: claimAddress?.token,
        providerInstance: isMagicAddress ? provider : undefined,
      });
      notifySuccess('Imported to external wallet');
    } catch (error) {
      console.error('Failed to import token: ', error);
      if (
        error?.message?.toLowerCase().includes('not available') ||
        error?.message?.toLowerCase().includes('unavailable') ||
        error?.message?.toLowerCase().includes('not supported') ||
        error?.message?.toLowerCase().includes('unsupported')
      ) {
        notifyError(
          `Your wallet doesn't support token imports, please import manually`,
        );
        return;
      }
      notifyError('Failed to import token');
    }
  };

  const canClaim = !!claimAddress;
  const isPendingClaimFunds = !!(
    allocation?.status === 'PENDING_FUNDING' ||
    allocation?.status === 'NOT_STARTED'
  );
  const isAllocationCancelled = allocation?.status === 'CANCELLED';
  const unlockStartsAt =
    allocation?.unlock_start_at || claimAddress?.unlock_start_at;
  const launchDateUTC = moment(unlockStartsAt);
  const registrationEndDate = claimAddress?.end_registration_date
    ? moment(claimAddress?.end_registration_date)
    : undefined;
  const claimSteps = {
    initial: (() => {
      const initialTxHash =
        (claimAddress?.magna_claim_tx_hash as `0x${string}`) ||
        initial.txHash ||
        null;
      const isClaimAvailable = !!claimAddress?.magna_synced_at;
      const hasClaimed = !!(claimAddress?.magna_claimed_at && initialTxHash);
      const isPendingBlockchainIndex = !!(
        claimAddress?.magna_claimed_at &&
        isClaimAvailable &&
        allocation?.magna_allocation_id &&
        allocation?.walletAddress &&
        allocation?.claimable === 0 &&
        !initialTxHash
      );
      const isReadyForClaimNow = !!(
        isClaimAvailable &&
        allocation?.magna_allocation_id &&
        allocation?.walletAddress &&
        (allocation?.claimable ?? 0) > 0
      );
      const isReadyForClaimAfterUnlock = !!(
        isClaimAvailable &&
        !isReadyForClaimNow &&
        (allocation?.claimable ?? 0) > 0 &&
        unlockStartsAt
      );
      const shouldWaitTillDate =
        moment().isBefore(launchDateUTC) && claimAddress?.address
          ? launchDateUTC
          : undefined;
      return {
        txHash: initialTxHash,
        hasClaimed,
        isClaimAvailable,
        isReadyForClaimNow,
        isPendingBlockchainIndex,
        isReadyForClaimAfterUnlock,
        shouldWaitTillDate,
      };
    })(),
    final: (() => {
      const initialTxHash =
        (claimAddress?.magna_claim_tx_hash as `0x${string}`) ||
        initial.txHash ||
        null;
      const finalTxHash =
        (claimAddress?.magna_cliff_claim_tx_hash as `0x${string}`) ||
        final.txHash ||
        null;
      const hasClaimed = !!(
        claimAddress?.magna_cliff_claimed_at && finalTxHash
      );
      const hasCliffDatePassed =
        claimAddress?.cliff_date &&
        moment(claimAddress?.cliff_date).isBefore(moment());
      const isClaimAvailable =
        !!claimAddress?.magna_synced_at && !isPendingClaimFunds;
      const isPendingBlockchainIndex = !!(
        claimAddress?.magna_cliff_claimed_at &&
        isClaimAvailable &&
        allocation?.magna_allocation_id &&
        allocation?.walletAddress &&
        allocation?.claimable === 0 &&
        !finalTxHash
      );
      const isReadyForClaimNow = !!(
        isClaimAvailable &&
        allocation?.magna_allocation_id &&
        allocation?.walletAddress &&
        (allocation?.claimable ?? 0) > 0 &&
        hasCliffDatePassed
      );
      const isReadyForClaimAfterUnlock = !!(
        isClaimAvailable &&
        !isReadyForClaimNow &&
        (initialTxHash || (allocation?.claimable ?? 0) > 0) &&
        unlockStartsAt &&
        !hasCliffDatePassed
      );
      return {
        txHash: finalTxHash,
        hasClaimed,
        isClaimAvailable,
        isReadyForClaimNow,
        isPendingBlockchainIndex,
        isReadyForClaimAfterUnlock,
        shouldWaitTillDate: undefined,
      };
    })(),
  };

  const tokensCount = Math.max(
    allocation?.amount || claimAddress?.tokens || 0,
    0,
  );
  const claimableTokens = formatTokenBalance(tokensCount);
  const initialClaimPercentage =
    claimAddress?.initial_percentage || claimAddress?.initial_percentage;
  const initialClaimablePercentage = (initialClaimPercentage || 0) * 100;
  const initialClaimableTokens = tokensCount * (initialClaimPercentage || 0);
  const finalClaimablePercentage = (1 - (initialClaimPercentage || 0)) * 100;
  const finalClaimableTokens = tokensCount - initialClaimableTokens;

  const allocatedAmountText = `${claimableTokens} ${claimAddress?.token}`;
  const tokenOrTokensText = tokensCount <= 1 ? 'Token' : 'Tokens';
  const allocatedAmountTextWithTokenOrTokens = `${allocatedAmountText} ${
    allocatedAmountText.length > 3 ? '' : tokenOrTokensText
  }`;

  return canClaim ? (
    <div
      className={clsx('CommonAirdropCard', {
        'in-progress': claimSteps.initial.isClaimAvailable,
        'needs-action':
          !claimSteps.initial.isClaimAvailable &&
          !claimSteps.initial.hasClaimed,
        completed: shouldCollapseClaimState
          ? claimSteps.initial.hasClaimed
          : claimSteps.initial.hasClaimed && claimSteps.final.hasClaimed,
      })}
    >
      <CWBanner
        type={claimAddress?.address ? 'info' : 'error'}
        body={
          <div className="banner-content">
            <div className="hero-section">
              <FloatingBubbles intensity="medium" speed="normal" />
              <StaggeredAnimation
                animationType="sparkle"
                delay={0.3}
                duration={6}
                className="hero-sparkles"
              >
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </StaggeredAnimation>
              <div className="header-content">
                <div className="airdrop-title-section">
                  <CWText
                    type="h1"
                    fontWeight="semiBold"
                    className="description-text"
                  >
                    {claimAddress?.description}
                  </CWText>
                  <button
                    className="add-to-wallet-button"
                    onClick={() => {
                      handleImportToken().catch(console.error);
                    }}
                  >
                    <span className="button-icon">+</span>
                    <span className="button-text">Add to wallet</span>
                  </button>
                </div>
                <div className="allocation-section-container">
                  <div className="diagonal-separator"></div>
                  <div className="diagonal-separator"></div>
                  <div className="allocation-section">
                    <CWText type="caption" className="balance-label">
                      Your Allocation
                    </CWText>
                    <CWText
                      type="h1"
                      fontWeight="bold"
                      className="balance-amount"
                    >
                      {allocatedAmountTextWithTokenOrTokens}
                    </CWText>
                  </div>
                </div>
              </div>
            </div>
            {!shouldCollapseClaimState && !isAllocationCancelled ? (
              <div className="notice-section-container">
                <ClaimCard
                  cardNumber={1}
                  hasClaimed={claimSteps.initial.hasClaimed}
                  isClaimAvailable={claimSteps.initial.isClaimAvailable}
                  isPendingBlockchainIndex={
                    claimSteps.initial.isPendingBlockchainIndex
                  }
                  isPendingClaimFunds={isPendingClaimFunds}
                  isReadyForClaimNow={claimSteps.initial.isReadyForClaimNow}
                  isReadyForClaimAfterUnlock={
                    claimSteps.initial.isReadyForClaimAfterUnlock
                  }
                  hasClaimableAmount={(allocation?.claimable || 0) > 0}
                  onConnectNewAddress={onConnectNewAddress}
                  claimedTXHash={claimSteps.initial.txHash || undefined}
                  claimedToAddress={claimAddress?.address || undefined}
                  allocationUnlocksAt={unlockStartsAt || undefined}
                  allocationClaimedAt={
                    claimAddress?.magna_claim_tx_at || undefined
                  }
                  allocatedToAddress={claimAddress?.address || ''}
                  allocationId={claimAddress?.magna_allocation_id || undefined}
                  claimableTokens={initialClaimableTokens}
                  claimablePercentage={initialClaimablePercentage}
                  tokenSymbol={claimAddress?.token || ''}
                  shouldWaitTillDate={claimSteps.initial.shouldWaitTillDate}
                  registrationEndDate={registrationEndDate}
                  mode="initial"
                  eventId={claimAddress?.event_id || ''}
                />
                <ClaimCard
                  cardNumber={2}
                  hasClaimed={claimSteps.final.hasClaimed}
                  isClaimAvailable={claimSteps.final.isClaimAvailable}
                  isPendingBlockchainIndex={
                    claimSteps.final.isPendingBlockchainIndex
                  }
                  isPendingClaimFunds={isPendingClaimFunds}
                  isReadyForClaimNow={claimSteps.final.isReadyForClaimNow}
                  isReadyForClaimAfterUnlock={
                    claimSteps.final.isReadyForClaimAfterUnlock
                  }
                  hasClaimableAmount={(allocation?.claimable || 0) > 0}
                  onConnectNewAddress={onConnectNewAddress}
                  claimedTXHash={claimSteps.final.txHash || undefined}
                  claimedToAddress={claimAddress?.address || undefined}
                  allocationUnlocksAt={claimAddress?.cliff_date || undefined}
                  allocationClaimedAt={
                    claimAddress?.magna_cliff_claim_tx_at || undefined
                  }
                  allocatedToAddress={claimAddress?.address || ''}
                  allocationId={claimAddress?.magna_allocation_id || undefined}
                  claimableTokens={finalClaimableTokens}
                  claimablePercentage={finalClaimablePercentage}
                  tokenSymbol={claimAddress?.token || ''}
                  shouldWaitTillDate={claimSteps.final.shouldWaitTillDate}
                  mode="final"
                  eventId={claimAddress?.event_id || ''}
                />
              </div>
            ) : (
              <ClaimCard
                cardNumber={1}
                hasClaimed={claimSteps.initial.hasClaimed}
                isClaimAvailable={claimSteps.initial.isClaimAvailable}
                isPendingBlockchainIndex={
                  claimSteps.initial.isPendingBlockchainIndex
                }
                isPendingClaimFunds={isPendingClaimFunds}
                isReadyForClaimNow={claimSteps.initial.isReadyForClaimNow}
                isReadyForClaimAfterUnlock={
                  claimSteps.initial.isReadyForClaimAfterUnlock
                }
                hasClaimableAmount={(allocation?.claimable || 0) > 0}
                onConnectNewAddress={onConnectNewAddress}
                claimedTXHash={claimSteps.initial.txHash || undefined}
                claimedToAddress={claimAddress?.address || undefined}
                allocationUnlocksAt={unlockStartsAt || undefined}
                allocationClaimedAt={
                  claimAddress?.magna_claim_tx_at || undefined
                }
                allocatedToAddress={claimAddress?.address || ''}
                allocationId={claimAddress?.magna_allocation_id || undefined}
                claimableTokens={initialClaimableTokens}
                claimablePercentage={initialClaimablePercentage}
                tokenSymbol={claimAddress?.token || ''}
                shouldWaitTillDate={claimSteps.initial.shouldWaitTillDate}
                registrationEndDate={registrationEndDate}
                mode="initial"
                isAllocationCancelled={isAllocationCancelled}
                isCollapsed
                eventId={claimAddress?.event_id || ''}
              />
            )}
          </div>
        }
      />
    </div>
  ) : null;
};

export default CommonAirdropCard;
