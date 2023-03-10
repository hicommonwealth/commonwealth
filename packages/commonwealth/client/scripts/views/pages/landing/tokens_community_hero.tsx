import React, { useState } from 'react';

import 'pages/landing/tokens_community_hero.scss';

import type { Chain } from './index';

import { notifyError } from 'controllers/app/notifications';
import { InputTokenList } from './input_tokens_lists';
import { useCommonNavigate } from 'navigation/helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

export const placeholderChain = {
  img: 'static/img/add.svg',
  id: 'placeholder',
  chainInfo: { symbol: 'PLACEHOLDER' },
  name: 'Add your token!',
  placeholder: true,
};

type TokensCommunityHeroProps = {
  chains: Array<Chain>;
};

export const TokensCommunityHero = ({ chains }: TokensCommunityHeroProps) => {
  const navigate = useCommonNavigate();

  const [inputTimeout, setInputTimeout] = useState<any>();
  const [inputTokenValue, setInputTokenValue] = useState('');
  const [refilterResults, setRefilterResults] = useState(true);

  const initiateFullSearch = (searchTerm: string) => {
    if (
      !searchTerm ||
      !searchTerm.toString().trim() ||
      !searchTerm.match(/[A-Za-z]+/)
    ) {
      return;
    }

    if (searchTerm.length < 3) {
      notifyError('Query must be at least 3 characters');
    }

    const params = `q=${encodeURIComponent(
      searchTerm.toString().trim()
    )}&scope[]=Communities`;

    navigate(`/search?${params}`);
  };

  return (
    <div className="TokensCommunityHero">
      <div className="search-section">
        <CWText className="header-text" type="h2" fontWeight="semiBold">
          A <span className="community-span"> community </span>
          for every token.
        </CWText>
        <CWText type="h5">
          Commonwealth is an all-in-one platform for on-chain communities to
          discuss, vote, and fund projects together. Never miss an on-chain
          event, proposal, or important discussion again.
        </CWText>
        <input
          autoComplete="off"
          type="text"
          placeholder="Find your community"
          onInput={(event: any) => {
            setInputTokenValue(event.target.value);
            setRefilterResults(false);
            clearTimeout(inputTimeout);
            setInputTimeout(
              setTimeout(() => {
                setRefilterResults(true);
              }, 200)
            );
          }}
          onKeyUp={(event: any) => {
            if (event.key === 'Enter') {
              // initiateFullSearch(event.target.value);
            }
          }}
          onClick={() => {
            // initiateFullSearch(inputTokenValue);
          }}
        />
        {inputTokenValue && inputTokenValue.length > 2 && (
          <InputTokenList
            optionList={[placeholderChain, ...chains]}
            inputValue={inputTokenValue}
            maxOptions={20}
            refilterResults={refilterResults}
          />
        )}
        <div className="links-section">
          <CWText type="h3" fontWeight="semiBold">
            We’re also here
          </CWText>
          <div className="links-container">
            <CWIconButton
              iconName="discord"
              onClick={() => {
                console.log('https://discord.gg/t9XscHdZrG');
              }}
              iconSize="large"
            />
            <CWIconButton
              iconName="telegram"
              onClick={() => {
                console.log('https://t.me/HiCommonwealth');
              }}
              iconSize="large"
            />
            <CWIconButton
              iconName="twitter"
              onClick={() => {
                console.log('https://twitter.com/hicommonwealth');
              }}
              iconSize="large"
            />
          </div>
        </div>
      </div>
      <div className="images-section">
        <img
          src="static/img/discussions.svg"
          alt=""
          className="discussions-img"
        />
        <img
          src="static/img/notification.svg"
          alt=""
          className="notification-img"
        />
        <img
          src="static/img/discussion.svg"
          alt=""
          className="discussion-img"
        />
      </div>
    </div>
  );
};
