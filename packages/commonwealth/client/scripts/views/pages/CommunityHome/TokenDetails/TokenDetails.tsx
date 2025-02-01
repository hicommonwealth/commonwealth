import { formatAddressShort } from 'client/scripts/helpers';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import { CWIconButton } from 'client/scripts/views/components/component_kit/cw_icon_button';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import React from 'react';
import './TokenDetails.scss';

interface TokenDetailsProps {
  name: string;
  symbol: string;
  description: string;
  priceChange: number;
  address: string;
  marketCap: number;
  members: number;
  threads: number;
  iconUrl: string;
}

const TokenDetails: React.FC<TokenDetailsProps> = ({
  name,
  symbol,
  description,
  priceChange,
  address,
  marketCap,
  members,
  threads,
  iconUrl,
}) => {
  return (
    <div className="token-details">
      <div className="token-info">
        <div className="token-header">
          <img src={iconUrl} alt={name} className="token-icon" />
          <div>
            <CWText type="h4" fontWeight="semiBold">
              {name}
            </CWText>
            <CWText type="b1" className="faded">
              ${symbol}
            </CWText>
          </div>
        </div>
        <div className="token-description">
          <CWText type="h4" fontWeight="semiBold">
            About
          </CWText>
          <CWText type="b1">{description}</CWText>
        </div>
      </div>

      <div className="token-stats">
        <div className="stat-item">
          <CWText type="b1" className="faded">
            24h Change
          </CWText>
          <span
            className={`price-change ${priceChange > 0 ? 'positive' : 'negative'}`}
          >
            {priceChange > 0 ? `▲ ${priceChange}%` : `▼ ${priceChange}%`}
          </span>
        </div>
        <div className="stat-item">
          <CWText type="b1" className="faded">
            Address
          </CWText>
          <CWText>
            {formatAddressShort(address)}
            <CWTooltip
              placement="top"
              content="address copied!"
              renderTrigger={(handleInteraction, isTooltipOpen) => {
                return (
                  <CWIconButton
                    iconName="copySimple"
                    onClick={(event) => {
                      saveToClipboard(address).catch(console.error);
                      handleInteraction(event);
                    }}
                    onMouseLeave={(e) => {
                      if (isTooltipOpen) {
                        handleInteraction(e);
                      }
                    }}
                    className="copy-icon"
                  />
                );
              }}
            />
          </CWText>
        </div>
        <div className="stat-item">
          <CWText type="b1" className="faded">
            Market Cap
          </CWText>
          <CWText>{marketCap}</CWText>
        </div>
        <div className="token-footer">
          <CWText type="b1" className="faded">
            <CWIcon iconName="users" /> {members} members
          </CWText>
          <span className="dot">•</span>
          <CWText type="b1" className="faded">
            <CWIcon iconName="calenderBlank" iconSize="small" /> {threads}{' '}
            threads
          </CWText>
        </div>
      </div>
    </div>
  );
};

export default TokenDetails;
