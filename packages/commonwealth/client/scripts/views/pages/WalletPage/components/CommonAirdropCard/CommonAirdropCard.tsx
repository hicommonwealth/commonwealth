import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import React, { useState } from 'react';
import {
  useGetAllocationQuery,
  useGetClaimAddressQuery,
} from 'state/api/tokenAllocations';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import FloatingBubbles from 'views/components/FloatingBubbles';
import StaggeredAnimation from 'views/components/StaggeredAnimation';
import { AuthModal } from 'views/modals/AuthModal';
import ClaimCard from './ClaimCard';
import './CommonAirdropCard.scss';
import { useCommonAirdrop } from './useCommonAirdrop';

interface CommonAirdropCardProps {
  onConnectNewAddress?: () => void;
}

// Format token balance with locale separators and 4 decimal places
const formatTokenBalance = (balance: string | number): string => {
  const numBalance = Number(balance);
  return numBalance.toLocaleString(undefined, {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
};

const CommonAirdropCard = ({ onConnectNewAddress }: CommonAirdropCardProps) => {
  const user = useUserStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const claimsEnabled = useFlag('claims');
  const { initial, final } = useCommonAirdrop();
  const { data: claimAddress, isLoading: isLoadingClaimAddress } =
    useGetClaimAddressQuery({ enabled: user.isLoggedIn });
  const { data: allocation } = useGetAllocationQuery({
    magna_allocation_id: claimAddress?.magna_allocation_id,
    enabled:
      !!claimAddress?.magna_allocation_id && !initial.txHash && user.isLoggedIn,
  });

  if (!claimsEnabled) {
    return <></>;
  }

  if (!user.isLoggedIn) {
    return (
      <div className="CommonAirdropCard">
        <CWBanner
          type="info"
          body={
            <div className="general-notice">
              <h3 className="description">Login to check your COMMON Claim</h3>
              <CWButton
                label="Login to check"
                onClick={() => setIsAuthModalOpen(true)}
              />
            </div>
          }
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  if (isLoadingClaimAddress) {
    return null;
  }

  // Logged-in user with no claim address or zero allocation: show an informational banner
  const tokensNumber = Number(claimAddress?.tokens ?? 0);
  if (
    user.isLoggedIn &&
    (claimAddress === null || (claimAddress && tokensNumber <= 0))
  ) {
    return (
      <div className="CommonAirdropCard">
        <div className="notice-text">
          <div className="no-allocation-notice">
            <CWText
              type="h5"
              fontWeight="semiBold"
              className="no-allocation-title"
            >
              No COMMON Allocation
            </CWText>
            <CWText className="no-allocation-description">
              This round recognizes earlier participation by community members
              across activity, collectibles, and rewards history. Your account
              isn&apos;t included in this snapshot.
            </CWText>
            <CWText className="no-allocation-encouragement">
              Keep participating, join communities, contribute, and watch for
              future reward opportunities.
            </CWText>
          </div>
        </div>
      </div>
    );
  }

  const canClaim = !!claimAddress;
  const isPendingClaimFunds = !!(
    allocation?.status === 'PENDING_FUNDING' ||
    allocation?.status === 'NOT_STARTED'
  );
  // 🚨 IMP/TODO: THESE DATES SHOULD BE THE TX DATES
  const shouldCollapseClaimState = (() => {
    if (!allocation?.cliff_date) {
      return false;
    }

    const cliffDate = moment(allocation.cliff_date);
    const now = moment();
    const initialClaimedAt = claimAddress?.magna_claimed_at
      ? moment(claimAddress.magna_claimed_at)
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
  const claimSteps = {
    initial: (() => {
      const initialTxHash =
        (claimAddress?.magna_claim_tx_hash as `0x${string}`) ||
        initial.txHash ||
        null;
      const isClaimAvailable = !!claimAddress?.magna_synced_at;
      const hasClaimed = !!(claimAddress?.magna_claimed_at && initialTxHash);
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
        allocation?.unlock_start_at
      );
      return {
        txHash: initialTxHash,
        hasClaimed,
        isClaimAvailable,
        isReadyForClaimNow,
        isReadyForClaimAfterUnlock,
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
        allocation?.cliff_date &&
        moment(allocation?.cliff_date).isBefore(moment());
      const isClaimAvailable =
        !!claimAddress?.magna_synced_at && !isPendingClaimFunds;
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
        allocation?.unlock_start_at &&
        !hasCliffDatePassed
      );
      return {
        txHash: finalTxHash,
        hasClaimed,
        isClaimAvailable,
        isReadyForClaimNow,
        isReadyForClaimAfterUnlock,
      };
    })(),
  };

  const tokensCount = Math.max(
    allocation?.amount || claimAddress?.tokens || 0,
    0,
  );
  const claimableTokens = formatTokenBalance(tokensCount);
  // NOTE: fallback to 0.25, as its done in API, update if changed in api
  const initialClaimPercentage = allocation?.initial_percentage || 0.25;
  const initialClaimablePercentage = (initialClaimPercentage || 0) * 100;
  const initialClaimableTokens = tokensCount * (initialClaimPercentage || 0);
  const finalClaimablePercentage = (1 - (initialClaimPercentage || 0)) * 100;
  const finalClaimableTokens = tokensCount - initialClaimableTokens;

  return canClaim ? (
    <div
      className={clsx('CommonAirdropCard', {
        'in-progress': claimSteps.initial.isClaimAvailable,
        'needs-action':
          !claimSteps.initial.isClaimAvailable &&
          !claimSteps.initial.hasClaimed,
        completed: claimSteps.initial.hasClaimed && claimSteps.final.hasClaimed,
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
                      {`${claimableTokens} ${claimAddress?.token} ${tokensCount <= 1 ? 'Token' : 'Tokens'}`}
                    </CWText>
                  </div>
                </div>
              </div>
            </div>
            {!shouldCollapseClaimState ? (
              <div className="notice-section-container">
                <ClaimCard
                  cardNumber={1}
                  hasClaimed={claimSteps.initial.hasClaimed}
                  isClaimAvailable={claimSteps.initial.isClaimAvailable}
                  isPendingClaimFunds={isPendingClaimFunds}
                  isReadyForClaimNow={claimSteps.initial.isReadyForClaimNow}
                  isReadyForClaimAfterUnlock={
                    claimSteps.initial.isReadyForClaimAfterUnlock
                  }
                  hasClaimableAmount={(allocation?.claimable || 0) > 0}
                  onConnectNewAddress={onConnectNewAddress}
                  claimedTXHash={claimSteps.initial.txHash || undefined}
                  claimedToAddress={claimAddress?.address || undefined}
                  allocationUnlocksAt={allocation?.unlock_start_at || undefined}
                  allocationClaimedAt={
                    claimAddress?.magna_claimed_at || undefined
                  }
                  allocatedToAddress={claimAddress?.address || ''}
                  allocationId={claimAddress?.magna_allocation_id || undefined}
                  claimableTokens={initialClaimableTokens}
                  claimablePercentage={initialClaimablePercentage}
                  tokenSymbol={claimAddress?.token || ''}
                  mode="initial"
                />
                <ClaimCard
                  cardNumber={2}
                  hasClaimed={claimSteps.final.hasClaimed}
                  isClaimAvailable={claimSteps.final.isClaimAvailable}
                  isPendingClaimFunds={isPendingClaimFunds}
                  isReadyForClaimNow={claimSteps.final.isReadyForClaimNow}
                  isReadyForClaimAfterUnlock={
                    claimSteps.final.isReadyForClaimAfterUnlock
                  }
                  hasClaimableAmount={(allocation?.claimable || 0) > 0}
                  onConnectNewAddress={onConnectNewAddress}
                  claimedTXHash={claimSteps.final.txHash || undefined}
                  claimedToAddress={claimAddress?.address || undefined}
                  allocationUnlocksAt={allocation?.cliff_date || undefined}
                  allocationClaimedAt={
                    claimAddress?.magna_cliff_claimed_at || undefined
                  }
                  allocatedToAddress={claimAddress?.address || ''}
                  allocationId={claimAddress?.magna_allocation_id || undefined}
                  claimableTokens={finalClaimableTokens}
                  claimablePercentage={finalClaimablePercentage}
                  tokenSymbol={claimAddress?.token || ''}
                  mode="final"
                />
              </div>
            ) : (
              <ClaimCard
                cardNumber={1}
                hasClaimed={claimSteps.initial.hasClaimed}
                isClaimAvailable={claimSteps.initial.isClaimAvailable}
                isPendingClaimFunds={isPendingClaimFunds}
                isReadyForClaimNow={claimSteps.initial.isReadyForClaimNow}
                isReadyForClaimAfterUnlock={
                  claimSteps.initial.isReadyForClaimAfterUnlock
                }
                hasClaimableAmount={(allocation?.claimable || 0) > 0}
                onConnectNewAddress={onConnectNewAddress}
                claimedTXHash={claimSteps.initial.txHash || undefined}
                claimedToAddress={claimAddress?.address || undefined}
                allocationUnlocksAt={allocation?.unlock_start_at || undefined}
                allocationClaimedAt={
                  claimAddress?.magna_claimed_at || undefined
                }
                allocatedToAddress={claimAddress?.address || ''}
                allocationId={claimAddress?.magna_allocation_id || undefined}
                claimableTokens={initialClaimableTokens}
                claimablePercentage={initialClaimablePercentage}
                tokenSymbol={claimAddress?.token || ''}
                mode="initial"
                isCollapsed
              />
            )}
          </div>
        }
      />
    </div>
  ) : null;
};

export default CommonAirdropCard;
