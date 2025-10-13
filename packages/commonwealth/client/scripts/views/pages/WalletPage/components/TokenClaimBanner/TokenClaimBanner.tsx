import { ChainBase } from '@hicommonwealth/shared';
import { notifySuccess } from 'client/scripts/controllers/app/notifications';
import { formatAddressShort } from 'client/scripts/helpers';
import { useFlag } from 'client/scripts/hooks/useFlag';
import AddressInfo from 'client/scripts/models/AddressInfo';
import {
  useClaimTokenFlow,
  useGetAllocationQuery,
  useGetClaimAddressQuery,
  useUpdateClaimAddressMutation,
} from 'client/scripts/state/api/tokenAllocations';
import CWBanner from 'client/scripts/views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { AuthModal } from 'client/scripts/views/modals/AuthModal';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { CWDivider } from 'client/scripts/views/components/component_kit/cw_divider';
import clsx from 'clsx';
// eslint-disable-next-line max-len
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import './TokenClaimBanner.scss';

interface TokenClaimBannerProps {
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

const TokenClaimBanner = ({ onConnectNewAddress }: TokenClaimBannerProps) => {
  const user = useUserStore();
  const [formattedClaimable, setFormattedClaimable] = useState<string>('0');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // token claim address
  const [evmAddresses, setEvmAddresses] = useState<AddressInfo[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<
    AddressInfo | undefined
  >(undefined);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [unlockCountdown, setUnlockCountdown] = useState<string>('00:00:00');
  const [syncCountdown, setSyncCountdown] = useState<string>('00:00:00');
  const claimsEnabled = useFlag('claims');
  const {
    claim: claimToken,
    claimTxData,
    isPending: isClaiming,
    transactionHash,
  } = useClaimTokenFlow();
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);
  const { data: claimAddress, isLoading: isLoadingClaimAddress } =
    useGetClaimAddressQuery({ enabled: user.isLoggedIn });
  const { data: allocation, isLoading: isLoadingAllocation } =
    useGetAllocationQuery({
      magna_allocation_id: claimAddress?.magna_allocation_id,
      enabled:
        !!claimAddress?.magna_allocation_id &&
        !transactionHash &&
        user.isLoggedIn,
    });
  const { mutate: updateClaimAddress, isPending: isUpdating } =
    useUpdateClaimAddressMutation();
  console.log('allocation => ', allocation);

  useEffect(() => {
    const addresses = new Map<string, AddressInfo>();
    user.addresses
      .filter((address) => address.community.base === ChainBase.Ethereum)
      .forEach((address) => {
        addresses.set(address.address, address);
      });
    setEvmAddresses([...addresses.values()]);
  }, [user]);

  useEffect(() => {
    if (claimAddress?.address) {
      setSelectedAddress(
        evmAddresses.find((a) => a.address === claimAddress?.address),
      );
    }
    setFormattedClaimable(
      formatTokenBalance(
        allocation?.claimable ||
          allocation?.amount ||
          claimAddress?.tokens ||
          0,
      ),
    );
    setTxHash(
      (claimAddress?.magna_claim_tx_hash as `0x${string}`) ?? transactionHash,
    );
  }, [claimAddress, evmAddresses, allocation, transactionHash]);

  // Countdown timer effect - updates every second
  useEffect(() => {
    const updateCountdown = () => {
      // Get current time in ET (approximating with UTC-5 for EST)
      const nowET = moment().utcOffset(-5, true); // ET timezone

      // Batch processing times in ET: 2am, 8am, 2pm, 8pm
      const batchHours = [2, 8, 14, 20];

      // Find next batch times
      let nextBatchTime: moment.Moment | null = null;
      const today = nowET.clone().startOf('day');

      // Check today's batch times
      for (const hour of batchHours) {
        const batchTime = today.clone().hour(hour).minute(0).second(0);
        if (batchTime.isAfter(nowET)) {
          const hoursUntil = batchTime.diff(nowET, 'hours', true);
          if (hoursUntil <= 6) {
            nextBatchTime = batchTime;
            break;
          }
        }
      }

      // If no suitable time today, check tomorrow's first batch time
      if (!nextBatchTime) {
        nextBatchTime = today
          .clone()
          .add(1, 'day')
          .hour(batchHours[0])
          .minute(0)
          .second(0);
      }

      const duration = moment.duration(nextBatchTime.diff(nowET));
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      const formattedTime = [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
      ].join(':');
      setCountdown(formattedTime);
    };

    // Update immediately
    updateCountdown();

    // Then update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Separate unlock countdown timer effect
  useEffect(() => {
    if (!allocation?.unlock_start_at) {
      setUnlockCountdown('00:00:00');
      return;
    }

    const updateUnlockCountdown = () => {
      const unlockTime = moment(allocation.unlock_start_at);
      const now = moment();

      if (unlockTime.isAfter(now)) {
        const duration = moment.duration(unlockTime.diff(now));
        const days = Math.floor(duration.asDays());
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        // Format as DD:HH:MM:SS or HH:MM:SS if no days
        let formattedTime;
        if (days > 0) {
          formattedTime = [
            String(days).padStart(2, '0'),
            String(hours).padStart(2, '0'),
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0'),
          ].join(':');
        } else {
          formattedTime = [
            String(hours).padStart(2, '0'),
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0'),
          ].join(':');
        }

        setUnlockCountdown(formattedTime);
      } else {
        setUnlockCountdown('00:00:00');
      }
    };

    // Update immediately
    updateUnlockCountdown();

    // Then update every second
    const interval = setInterval(updateUnlockCountdown, 1000);

    return () => clearInterval(interval);
  }, [allocation?.unlock_start_at]);

  // Sync countdown timer effect - updates every second
  useEffect(() => {
    const updateSyncCountdown = () => {
      const now = moment();
      const nextHour = now.clone().add(1, 'hour').startOf('hour');
      const duration = moment.duration(nextHour.diff(now));
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      const formattedTime = [
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
      ].join(':');

      setSyncCountdown(formattedTime);
    };

    // Update immediately
    updateSyncCountdown();

    // Then update every second
    const interval = setInterval(updateSyncCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClaimAddressUpdate = () => {
    if (selectedAddress) {
      updateClaimAddress({
        address: selectedAddress.address! as `0x${string}`,
      });
    }
  };

  // Prepare options for the dropdown
  const addressOptions = [
    ...(evmAddresses || []).map((account) =>
      convertAddressToDropdownOption(account.address!),
    ),
  ];

  // Add "Connect a new address" option
  if (onConnectNewAddress) {
    addressOptions.push({
      label: 'Connect a new address',
      value: '__connect_new__',
    });
  }

  const handleAddressChange = (
    option: { label: string; value: string } | null,
  ) => {
    if (option?.value === '__connect_new__') {
      onConnectNewAddress?.();
    } else {
      const account = evmAddresses.find((acc) => acc.address === option?.value);
      setSelectedAddress(account);
    }
  };

  if (!claimsEnabled) {
    return <></>;
  }

  if (!user.isLoggedIn) {
    return (
      <div className="TokenClaimBanner">
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
      <div className="TokenClaimBanner">
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
  const hasClaimed = claimAddress?.magna_claimed_at && txHash;
  const isClaimAvailable = claimAddress?.magna_synced_at;
  const isPendingClaimFunds = allocation?.status === 'PENDING_FUNDING';
  const isReadyForClaimNow =
    isClaimAvailable &&
    allocation?.magna_allocation_id &&
    allocation?.walletAddress &&
    (allocation?.claimable ?? 0) > 0;
  const isReadyForClaimAfterUnlock =
    isClaimAvailable &&
    !isReadyForClaimNow &&
    (allocation?.claimable ?? 0) > 0 &&
    allocation?.unlock_start_at;

  const getClaimBody = () => {
    if (!canClaim) return null;

    if (hasClaimed) {
      const formatClaimDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const time = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `${day} ${month} ${year} @ ${time}`;
      };

      return (
        <div className="claimed-section">
          <div className="claimed-content">
            <div className="claimed-info">
              <div className="claimed-text">
                <CWText
                  type="h4"
                  fontWeight="semiBold"
                  className="claimed-title"
                >
                  Claim Completed
                </CWText>
                <CWText className="claimed-date">
                  {claimAddress?.magna_claimed_at &&
                    formatClaimDate(claimAddress.magna_claimed_at)}
                </CWText>
              </div>
            </div>
            <CWButton
              label="View Transaction"
              onClick={() =>
                window.open(
                  `https://basescan.org/tx/${txHash}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              buttonType="secondary"
              iconRight="externalLink"
              aria-label="View transaction on BaseScan"
            />
          </div>
        </div>
      );
    }

    if (isClaimAvailable) {
      if (isReadyForClaimNow) {
        return (
          <div className="notice-text">
            {isPendingClaimFunds ? (
              <>
                <div className="countdown-timer">
                  <CWText type="h4" fontWeight="medium" className="timer-label">
                    Claim In
                  </CWText>
                  <CWText type="h1" fontWeight="bold" className="timer-display">
                    {countdown}
                  </CWText>
                </div>
                <p className="batch-processing-notice">
                  Your claim request has been received. Claims are processed in
                  batches, and your request is expected to be included in the
                  next batch.
                </p>
              </>
            ) : (
              <>
                <div className="claim-action-container">
                  <div className="left-section">
                    <div className="claim-instructions">
                      <CWText
                        type="h5"
                        fontWeight="semiBold"
                        className="instructions-title"
                      >
                        Before You Claim
                      </CWText>
                      <ol className="instructions-list">
                        <li>
                          <CWText>
                            Verify you are on&nbsp;<strong>common.xyz</strong>
                          </CWText>
                        </li>
                        <li>
                          <CWText>
                            Ensure your wallet is connected to&nbsp;
                            <strong>Base network</strong>
                          </CWText>
                        </li>
                        <li>
                          <CWText>
                            Never approve unlimited token allowances
                          </CWText>
                        </li>
                      </ol>
                    </div>
                  </div>
                  <CWButton
                    label={`Claim to ${formatAddressShort(
                      allocation?.walletAddress || '',
                      6,
                    )}`}
                    onClick={() => {
                      if (allocation) {
                        claimToken({
                          allocation_id: allocation.magna_allocation_id,
                        });
                      }
                    }}
                    disabled={
                      isClaiming || isLoadingAllocation || isPendingClaimFunds
                    }
                    className="hero-colored-button"
                    aria-label={`Claim to ${formatAddressShort(
                      allocation?.walletAddress || '',
                      6,
                    )}`}
                  />
                </div>
                {claimTxData && (
                  <>
                    <CWDivider />
                    <div className="claim-action-container">
                      <div className="left-section">
                        <div className="claim-instructions">
                          <CWText
                            type="h5"
                            fontWeight="semiBold"
                            className="instructions-title"
                          >
                            If you face any issues, try a manual transaction
                          </CWText>

                          <ol className="instructions-list">
                            <li>
                              <CWText>
                                Enable&nbsp;<strong>Show hex data</strong>
                                &nbsp;in your wallet settings
                              </CWText>
                            </li>
                            <li>
                              <CWText>
                                Send 0.0003 ETH to&nbsp;
                                <span
                                  className="copyable-address"
                                  onClick={() => {
                                    void navigator.clipboard.writeText(
                                      claimTxData.from,
                                    );
                                    notifySuccess('Address copied!');
                                  }}
                                >
                                  {formatAddressShort(claimTxData.from, 4)}
                                  <CWIcon iconName="copy" iconSize="small" />
                                </span>
                                &nbsp;with hex data&nbsp;
                                <span
                                  className="copyable-address"
                                  onClick={() => {
                                    void navigator.clipboard.writeText(
                                      claimTxData.data,
                                    );
                                    notifySuccess('Hex data copied!');
                                  }}
                                >
                                  {formatAddressShort(claimTxData.data, 4)}
                                  <CWIcon iconName="copy" iconSize="small" />
                                </span>
                              </CWText>
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      }

      if (isReadyForClaimAfterUnlock) {
        return (
          <div className="notice-text">
            <div className="countdown-timer">
              <CWText type="h4" fontWeight="medium" className="timer-label">
                Your tokens will unlock in
              </CWText>
              <CWText type="h2" fontWeight="bold" className="timer-display">
                {unlockCountdown}
              </CWText>
            </div>
          </div>
        );
      }

      // claim is available but we landed on an error case
      return (
        <div className="notice-text">
          <div className="error-notice">
            <CWText type="h5" fontWeight="semiBold" className="error-title">
              Unexpected Allocation State!
            </CWText>
            <CWText className="error-description">
              Please contact&nbsp;
              <a href="mailto:tech@common.foundation" className="contact-link">
                tech@common.foundation
              </a>
              &nbsp; or reach out in the&nbsp;
              <a
                href="https://discord.gg/common"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                Common Discord.
              </a>
              &nbsp;
            </CWText>
          </div>
        </div>
      );
    }

    // Show ui to set address for claim
    if (!selectedAddress || !selectedAddress?.address) {
      return (
        <div className="notice-text">
          <div className="banner-actions">
            <div className="address-form-section">
              <CWText
                type="h5"
                fontWeight="semiBold"
                className="address-form-title"
              >
                Setup your claim address
              </CWText>
              <CWText className="address-form-description">
                Select your EVM address where you&apos;d like to receive your
                allocated tokens.
              </CWText>
              <div className="address-input-container">
                <CWSelectList
                  components={{
                    Option: (originalProps) =>
                      CustomAddressOption({
                        originalProps,
                        selectedAddressValue: selectedAddress?.address || '',
                      }),
                  }}
                  noOptionsMessage={() => 'No available addresses'}
                  placeholder="Select or paste your EVM address"
                  value={
                    selectedAddress?.address
                      ? convertAddressToDropdownOption(selectedAddress.address)
                      : null
                  }
                  defaultValue={
                    claimAddress?.address
                      ? convertAddressToDropdownOption(claimAddress.address)
                      : null
                  }
                  formatOptionLabel={(option) => (
                    <CustomAddressOptionElement
                      value={option.value}
                      label={option.label}
                      selectedAddressValue={selectedAddress?.address || ''}
                    />
                  )}
                  isClearable={false}
                  isSearchable={true}
                  options={addressOptions}
                  onChange={handleAddressChange}
                  className="enhanced-address-select"
                  aria-label="Select or enter your EVM address for token claiming"
                />
                {selectedAddress?.address && (
                  <div className="address-actions">
                    <CWIcon
                      iconName="copy"
                      iconSize="medium"
                      className="copy-icon"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          selectedAddress.address,
                        );
                        notifySuccess('Address copied to clipboard!');
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="terms-and-button-section">
                <div className="terms-checkbox-container">
                  <CWCheckbox
                    checked={isAcknowledged}
                    onChange={(e) => setIsAcknowledged(!!e?.target?.checked)}
                    label={
                      <CWText className="terms-text">
                        I understand that by adding my address, I adhere to
                        the&nbsp;
                        <a
                          href="/airdrop-terms.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="terms-link"
                        >
                          airdrop terms of service
                        </a>
                        &nbsp;and&nbsp;
                        <a
                          href="https://common.foundation/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="terms-link"
                        >
                          privacy policy
                        </a>
                        .
                      </CWText>
                    }
                  />
                </div>
                {isAcknowledged && (
                  <CWButton
                    label={isUpdating ? 'Saving...' : 'Save Address'}
                    onClick={handleClaimAddressUpdate}
                    disabled={isUpdating || !selectedAddress}
                    buttonType="primary"
                    buttonHeight="sm"
                    className="save-address-button"
                    aria-label="Save the selected address for token claiming"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="notice-text">
        <div className="sync-countdown-notice">
          <CWText type="h5" fontWeight="semiBold" className="sync-title">
            Sync Pending
          </CWText>
          <CWText className="sync-description">
            We need to sync onchain with your saved address.
          </CWText>
          <div className="countdown-timer">
            <CWText type="h4" fontWeight="medium" className="timer-label">
              Next Sync In
            </CWText>
            <CWText type="h1" fontWeight="bold" className="timer-display">
              {syncCountdown}
            </CWText>
          </div>
        </div>
      </div>
    );
  };

  return canClaim ? (
    <div
      className={clsx('TokenClaimBanner', {
        'in-progress': isClaimAvailable,
        'needs-action': !isClaimAvailable && !hasClaimed,
        completed: hasClaimed,
      })}
    >
      <CWBanner
        type={claimAddress?.address ? 'info' : 'error'}
        body={
          <div className="banner-content">
            <div className="hero-section">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  width: 'fit-content',
                }}
              >
                <CWText
                  type="h1"
                  fontWeight="semiBold"
                  className="description-text"
                >
                  {claimAddress?.description}
                </CWText>
                <CWDivider />
              </div>
              <div className="token-balance-container">
                <CWText type="caption" className="balance-label">
                  Your Allocation
                </CWText>
                <CWText type="h1" fontWeight="bold" className="balance-amount">
                  {formattedClaimable} {claimAddress?.token} Tokens
                </CWText>
              </div>
            </div>
            <div className="notice-section">{getClaimBody()}</div>
          </div>
        }
      />
    </div>
  ) : null;
};

export default TokenClaimBanner;
