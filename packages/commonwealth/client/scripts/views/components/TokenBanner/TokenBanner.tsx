import React from 'react';

import { Avatar } from 'views/components/Avatar';

import clsx from 'clsx';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import CWPopover, {
  CWPopoverProps,
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

import './TokenBanner.scss';

interface TokenBannerProps {
  avatarUrl?: string;
  name?: string;
  ticker?: string | null;
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
        {avatarUrl ? (
          <Avatar url={avatarUrl} size={40} />
        ) : (
          <div className="avatar-placeholder">
            {(name || 'Token').charAt(0).toUpperCase()}
          </div>
        )}
        <CWText fontWeight="medium">{name}</CWText>
        <CWText fontWeight="medium" className="ticker">
          {ticker}
        </CWText>
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
