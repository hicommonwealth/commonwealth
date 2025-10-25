import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from 'helpers';
import AddressInfo from 'models/AddressInfo';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useUpdateClaimAddressMutation } from 'state/api/tokenAllocations';
import useUserStore from 'state/ui/user';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import { useCommonAirdrop } from '../useCommonAirdrop';
import './ClaimCard.scss';

interface ClaimCardProps {
  hasClaimed: boolean;
  cardNumber: number;
  isClaimAvailable: boolean;
  isPendingBlockchainIndex: boolean;
  isPendingClaimFunds: boolean;
  isReadyForClaimNow: boolean;
  isReadyForClaimAfterUnlock: boolean;
  claimableTokens: string | number;
  claimablePercentage: number;
  claimedTXHash?: string;
  claimedToAddress?: string;
  allocationId?: string;
  allocationUnlocksAt?: string; // ISO timestamp if present
  allocationClaimedAt?: string; // ISO timestamp if present
  allocatedToAddress?: string;
  hasClaimableAmount?: boolean;
  mode: 'initial' | 'final';
  tokenSymbol: string;
  shouldWaitTillDate?: moment.Moment;
  isCollapsed?: boolean;
  onConnectNewAddress?: () => void;
}

const ClaimCard = ({
  onConnectNewAddress,
  hasClaimed,
  cardNumber,
  isClaimAvailable,
  isPendingBlockchainIndex,
  isPendingClaimFunds,
  isReadyForClaimNow,
  isReadyForClaimAfterUnlock,
  claimableTokens,
  claimablePercentage,
  tokenSymbol,
  claimedTXHash,
  claimedToAddress,
  allocationId,
  allocationUnlocksAt,
  allocationClaimedAt,
  mode,
  hasClaimableAmount,
  allocatedToAddress,
  shouldWaitTillDate,
  isCollapsed = false,
}: ClaimCardProps) => {
  const user = useUserStore();
  // token claim address
  const [evmAddresses, setEvmAddresses] = useState<AddressInfo[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<
    AddressInfo | undefined
  >(undefined);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [pendingSignatureCountdown, setPendingSignatureCountdown] =
    useState<string>('00:00:00');
  const [launchCountdown, setLaunchCountdown] = useState<string>('00:00:00');
  const [unlockCountdown, setUnlockCountdown] = useState<string>('00:00:00');
  const [syncCountdown, setSyncCountdown] = useState<string>('00:00:00');
  const commonAirdrop = useCommonAirdrop({ tokenSymbol });
  const claimTxData = commonAirdrop.txData;
  const claimState =
    mode === 'initial' ? commonAirdrop.initial : commonAirdrop.final;
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);
  const { mutate: updateClaimAddress, isPending: isUpdating } =
    useUpdateClaimAddressMutation();
  const ethClaimAmount =
    claimTxData?.requiredEth || (mode === 'initial' ? 0.0003 : 0.0001);

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
    if (claimedToAddress) {
      setSelectedAddress(
        evmAddresses.find((a) => a.address === claimedToAddress),
      );
    }
    setTxHash((claimedTXHash as `0x${string}`) ?? claimState.txHash);
  }, [claimedToAddress, claimedTXHash, evmAddresses, claimState.txHash]);

  // Countdown timer effect - updates every second
  useEffect(() => {
    const updateCountdown = () => {
      // Get current time in user's local browser timezone
      const nowLocal = moment();

      // Get current ET offset (handles DST automatically)
      // Create a date in ET timezone using native APIs
      const nowDate = new Date();
      const etString = nowDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
      });
      const etDate = new Date(etString);

      // Calculate the offset between ET and UTC
      const etOffset = (etDate.getTime() - nowDate.getTime()) / 60000; // in minutes

      // Get current time in ET
      const nowET = moment().utcOffset(etOffset);
      const todayET = nowET.clone().startOf('day');

      // Batch processing times in ET: 2am, 8am, 2pm, 8pm
      const batchHours = [2, 8, 14, 20];

      let nextBatchTime: moment.Moment | null = null;

      // Check today's batch times in ET
      for (const hour of batchHours) {
        const batchTimeET = todayET.clone().hour(hour).minute(0).second(0);
        if (batchTimeET.isAfter(nowET)) {
          const hoursUntil = batchTimeET.diff(nowET, 'hours', true);
          if (hoursUntil <= 6) {
            nextBatchTime = batchTimeET;
            break;
          }
        }
      }

      // If no suitable time today, check tomorrow's first batch time
      if (!nextBatchTime) {
        nextBatchTime = todayET
          .clone()
          .add(1, 'day')
          .hour(batchHours[0])
          .minute(0)
          .second(0);
      }

      // Calculate duration between local time and ET batch time
      const duration = moment.duration(nextBatchTime.diff(nowLocal));
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      const formattedTime = [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
      ].join(':');
      setPendingSignatureCountdown(formattedTime);
    };

    // Update immediately
    updateCountdown();

    // Then update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Launch countdown timer effect - updates every second
  useEffect(() => {
    if (!shouldWaitTillDate) {
      setLaunchCountdown('00:00:00');
      return;
    }

    const updateLaunchCountdown = () => {
      // Get current time in user's local browser timezone
      const nowLocal = moment();

      // Get current ET offset (handles DST automatically)
      const nowDate = new Date();
      const etString = nowDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
      });
      const etDate = new Date(etString);
      const etOffset = (etDate.getTime() - nowDate.getTime()) / 60000;

      // Convert launch date to ET
      const launchDateET = shouldWaitTillDate.clone().utcOffset(etOffset);

      if (launchDateET.isAfter(nowLocal)) {
        const duration = moment.duration(launchDateET.diff(nowLocal));
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

        setLaunchCountdown(formattedTime);
      } else {
        setLaunchCountdown('00:00:00');
      }
    };

    // Update immediately
    updateLaunchCountdown();

    // Then update every second
    const interval = setInterval(updateLaunchCountdown, 1000);

    return () => clearInterval(interval);
  }, [shouldWaitTillDate]);

  // Separate unlock countdown timer effect
  useEffect(() => {
    if (!allocationUnlocksAt) {
      setUnlockCountdown('00:00:00');
      return;
    }

    const updateUnlockCountdown = () => {
      // Get current time in user's local browser timezone
      const nowLocal = moment();

      // Parse the unlock time (assumed to be in ET timezone)
      const unlockTime = moment(allocationUnlocksAt);

      if (unlockTime.isAfter(nowLocal)) {
        const duration = moment.duration(unlockTime.diff(nowLocal));
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
  }, [allocationUnlocksAt]);

  // Sync countdown timer effect - updates every second
  useEffect(() => {
    const updateSyncCountdown = () => {
      // Get current time in user's local browser timezone
      const nowLocal = moment();

      // Get current ET offset (handles DST automatically)
      const nowDate = new Date();
      const etString = nowDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
      });
      const etDate = new Date(etString);
      const etOffset = (etDate.getTime() - nowDate.getTime()) / 60000;

      // Get current time in ET
      const nowET = moment().utcOffset(etOffset);
      const nextHourET = nowET.clone().add(1, 'hour').startOf('hour');

      // Calculate duration from local time to next hour in ET
      const duration = moment.duration(nextHourET.diff(nowLocal));
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

  const getCardBody = () => {
    const formatDate = (dateString: string) => {
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

    if (hasClaimed) {
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
                  Claimed
                </CWText>
                <CWText className="claimed-date">
                  {allocationClaimedAt && formatDate(allocationClaimedAt)}
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

    if (shouldWaitTillDate) {
      return (
        <div className="countdown-container countdown-needs-action">
          <div className="countdown-left">
            <CWText type="h5" fontWeight="semiBold" className="countdown-title">
              Request Received
            </CWText>
            <CWText className="countdown-description">
              Claims process will start approximately at&nbsp;
              {formatDate(shouldWaitTillDate.toISOString())}.
            </CWText>
          </div>
          <div className="countdown-timer">
            <CWText type="h4" fontWeight="medium" className="timer-label">
              Come Back In
            </CWText>
            <CWText type="h1" fontWeight="bold" className="timer-display">
              {launchCountdown}
            </CWText>
          </div>
        </div>
      );
    }

    // This instance should be displayed without a countdown timer for cliff state
    const finalTokensLocked = (
      <div className="notice-text">
        <div className="countdown-container countdown-in-progress">
          <div className="countdown-left">
            <CWText type="h5" fontWeight="semiBold" className="countdown-title">
              Tokens Locked
            </CWText>
            <CWText className="countdown-description">
              Your tokens will be available for claiming once the initial claim
              transaction is confirmed.
            </CWText>
          </div>
        </div>
      </div>
    );

    if (isPendingBlockchainIndex) {
      return (
        <div className="notice-text">
          <div className="countdown-container countdown-in-progress">
            <div className="countdown-left">
              <CWText
                type="h5"
                fontWeight="semiBold"
                className="countdown-title"
              >
                Pending Blockchain Index
              </CWText>
              <CWText className="countdown-description">
                Our systems are indexing the blockchain to confirm your
                transaction.
              </CWText>
            </div>
          </div>
        </div>
      );
    }

    if (isClaimAvailable) {
      const pendingMagnaProcessing = (
        <div className="countdown-container countdown-in-progress">
          <div className="countdown-left">
            <CWText type="h5" fontWeight="semiBold" className="countdown-title">
              Claim Request Received
            </CWText>
            <CWText className="countdown-description">
              Your claim request has been received. Claims are processed in
              batches, and your request is expected to be included in the next
              batch.
            </CWText>
          </div>
          <div className="countdown-timer">
            <CWText type="h4" fontWeight="medium" className="timer-label">
              Claim In
            </CWText>
            <CWText type="h1" fontWeight="bold" className="timer-display">
              {pendingSignatureCountdown}
            </CWText>
          </div>
        </div>
      );

      if (isReadyForClaimNow) {
        return (
          <div className="notice-text">
            {isPendingClaimFunds ? (
              pendingMagnaProcessing
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
                      allocatedToAddress || '',
                      6,
                    )}`}
                    onClick={() => {
                      if (allocationId && allocatedToAddress) {
                        claimState
                          .claim({
                            allocation_id: allocationId,
                            claimAddress: allocatedToAddress,
                          })
                          .catch(console.error);
                      }
                    }}
                    disabled={
                      claimState.isPending ||
                      !allocatedToAddress ||
                      isPendingClaimFunds
                    }
                    className="hero-colored-button"
                    aria-label={`Claim to ${formatAddressShort(
                      allocatedToAddress || '',
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
                                Send&nbsp;
                                <span
                                  className="copyable-address"
                                  onClick={() => {
                                    void navigator.clipboard.writeText(
                                      ethClaimAmount.toString(),
                                    );
                                    notifySuccess('Amount copied!');
                                  }}
                                >
                                  {ethClaimAmount}
                                  <CWIcon iconName="copy" iconSize="small" />
                                </span>
                                &nbsp;ETH to&nbsp;
                                <span
                                  className="copyable-address"
                                  onClick={() => {
                                    void navigator.clipboard.writeText(
                                      claimTxData.to,
                                    );
                                    notifySuccess('Address copied!');
                                  }}
                                >
                                  {formatAddressShort(claimTxData.to, 4)}
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
            <div className="countdown-container countdown-in-progress">
              <div className="countdown-left">
                <CWText
                  type="h5"
                  fontWeight="semiBold"
                  className="countdown-title"
                >
                  Tokens Locked
                </CWText>
                <CWText className="countdown-description">
                  Your tokens will be available for claiming once the unlock
                  period completes.
                </CWText>
              </div>
              <div className="countdown-timer">
                <CWText type="h4" fontWeight="medium" className="timer-label">
                  Unlocks In
                </CWText>
                <CWText type="h1" fontWeight="bold" className="timer-display">
                  {unlockCountdown}
                </CWText>
              </div>
            </div>
          </div>
        );
      }

      if (!hasClaimableAmount) {
        if (mode === 'final') {
          return finalTokensLocked;
        } else {
          return pendingMagnaProcessing;
        }
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
              &nbsp;or reach out in the&nbsp;
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

    if (mode === 'final') {
      return finalTokensLocked;
    }

    // Show ui to set address for claim
    if (!selectedAddress || !selectedAddress?.address || !claimedToAddress) {
      return (
        <div className="notice-text">
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
                  claimedToAddress
                    ? convertAddressToDropdownOption(claimedToAddress)
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
              <CWButton
                label={isUpdating ? 'Saving...' : 'Save Address'}
                onClick={handleClaimAddressUpdate}
                disabled={!isAcknowledged || isUpdating || !selectedAddress}
                buttonType="primary"
                buttonHeight="sm"
                className="save-address-button"
                aria-label="Save the selected address for token claiming"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="notice-text">
        <div className="countdown-container countdown-needs-action">
          <div className="countdown-left">
            <CWText type="h5" fontWeight="semiBold" className="countdown-title">
              Sync Pending
            </CWText>
            <CWText className="countdown-description">
              We need to sync onchain with your saved address.
            </CWText>
          </div>
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

  return (
    <div className={clsx('notice-section-count-container', { isCollapsed })}>
      <div className="notice-section-count-number">#{cardNumber}</div>
      <div className="notice-section-content">
        <div className="banner">
          <CWText type="buttonSm" fontWeight="semiBold" isCentered>
            {claimablePercentage}% tokens // {claimableTokens} {tokenSymbol}
          </CWText>
        </div>
        <div className="notice-section">{getCardBody()}</div>
      </div>
    </div>
  );
};

export default ClaimCard;
