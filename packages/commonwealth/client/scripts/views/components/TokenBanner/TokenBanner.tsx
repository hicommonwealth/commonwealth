import React from 'react';

import { Avatar } from 'views/components/Avatar';

import clsx from 'clsx';
import { CWText } from 'views/components/component_kit/cw_text';
import CWIconButton from 'views/components/component_kit/CWIconButton';
import CWPopover, {
  CWPopoverProps,
  usePopover,
} from 'views/components/component_kit/CWPopover';
import { Skeleton } from 'views/components/Skeleton';

import { formatAddressShort } from 'client/scripts/helpers';
import './TokenBanner.scss';

interface TokenBannerProps {
  avatarUrl?: string;
  name?: string;
  ticker?: string | null;
  tokenAddress?: string;
  chainName?: string;
  chainEthId?: number;
  value?: number;
  change?: number;
  isLoading?: boolean;
  popover?: Pick<CWPopoverProps, 'title' | 'body'>;
  voteWeight?: string;
}

const TokenBanner = ({
  avatarUrl,
  name,
  ticker,
  tokenAddress,
  chainName,
  chainEthId,
  value,
  change,
  isLoading,
  popover,
  voteWeight,
}: TokenBannerProps) => {
  const popoverProps = usePopover();

  if (isLoading) {
    return <Skeleton height="100px" />;
  }

  return (
    <div className="TokenBanner">
      <div className="token-identification">
        <div className="token-details-avatar">
          {avatarUrl ? (
            <Avatar url={avatarUrl} size={40} />
          ) : (
            <div className="avatar-placeholder">
              {(name || 'ETH').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="token-details-info">
          <div className="token-details-row">
            <CWText fontWeight="medium">{name || 'ETH'}</CWText>
            <CWText fontWeight="medium" className="ticker">
              {ticker}
            </CWText>
          </div>
          <div className="token-details-row">
            {tokenAddress && (
              <CWText type="caption" className="token-address">
                {formatAddressShort(tokenAddress)}
              </CWText>
            )}
            {chainName && chainEthId && (
              <CWText type="caption" className="chain-info">
                • {chainName} ({chainEthId})
              </CWText>
            )}
          </div>
        </div>
      </div>

      {value && change && (
        <div className="token-info">
          <CWText type="h5" className="token-value">
            ${value}
          </CWText>
          <CWText type="caption" className="token-change">
            <CWText
              className={clsx(
                `percentage`,
                change >= 0 ? 'positive' : 'negative',
              )}
            >
              {change.toFixed(2)}%
            </CWText>
            <CWText className="hours">24h</CWText>
          </CWText>
        </div>
      )}

      {voteWeight && (
        <div className="vote-weight">
          <CWText className="vote-weight-label" type="caption">
            Your vote weight
          </CWText>
          <CWText fontWeight="medium">{voteWeight}</CWText>
        </div>
      )}

      {popover && (
        <div
          onMouseEnter={popoverProps.handleInteraction}
          onMouseLeave={popoverProps.handleInteraction}
        >
          <CWIconButton iconName="infoEmpty" buttonSize="sm" />
          <CWPopover
            className="TokenBannerPopover"
            title={<>{popover.title}</>}
            body={popover.body}
            {...popoverProps}
          />
        </div>
      )}
    </div>
  );
};

export default TokenBanner;
