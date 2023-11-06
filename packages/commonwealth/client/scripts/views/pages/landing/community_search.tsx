import { sortBy } from 'lodash';
import type { ChangeEvent } from 'react';
import React, { useEffect, useState } from 'react';
import { useDebounce } from 'usehooks-ts';

import 'pages/landing/community_search.scss';

import type { Community } from './index';

import { useCommonNavigate } from 'navigation/helpers';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

const strip = (str: string) => {
  return str.replace(/\s/g, '').toLowerCase();
};

type CommunitySearchProps = {
  communities: Array<Community>;
};

export const CommunitySearch = ({ communities }: CommunitySearchProps) => {
  const navigate = useCommonNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<Community>>([]);

  const debouncedValue = useDebounce<string>(searchTerm, 500);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    const search = () => {
      const results = communities
        .filter(
          (c) =>
            strip(c.name).includes(strip(searchTerm)) ||
            strip(c.id).includes(strip(searchTerm)),
        )
        .slice(0, 5);

      const sortedResults = sortBy(results, ['name', 'id']);

      setSearchResults(sortedResults);
    };

    if (debouncedValue.length > 0) {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className="CommunitySearch">
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
        <div className="search-input-container">
          <div className="search-and-icon-container">
            <div className="search-icon">
              <CWIconButton iconName="search" />
            </div>
            <input
              className={getClasses<{ isClearable: boolean }>({
                isClearable: searchTerm.length > 0,
              })}
              autoComplete="off"
              type="text"
              placeholder="Find your community"
              value={searchTerm}
              onInput={handleChange}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowDropdown(false);
                }, 500); // hack to prevent the dropdown closing too quickly on click
              }}
            />
            {searchTerm.length > 0 && (
              <div className="clear-icon">
                <CWIconButton
                  iconName="close"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                />
              </div>
            )}
            {searchResults.length > 0 && showDropdown && (
              <div className="search-results-dropdown">
                {searchResults.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(c.id)}
                    className="search-result-row"
                  >
                    <CWCommunityAvatar
                      community={c.communityInfo}
                      size="small"
                    />
                    <CWText fontWeight="medium">{c.name}</CWText>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="links-section">
          <CWText type="h3" fontWeight="semiBold">
            We’re also here
          </CWText>
          <div className="links-container">
            <CWIconButton
              iconName="discord"
              onClick={() => {
                window.open('https://discord.gg/t9XscHdZrG', '_blank');
              }}
              className="discord-icon"
              iconSize="large"
            />
            <CWIconButton
              iconName="telegram"
              onClick={() => {
                window.open('https://t.me/HiCommonwealth', '_blank');
              }}
              iconSize="large"
            />
            <CWIconButton
              iconName="twitter"
              onClick={() => {
                window.open('https://twitter.com/hicommonwealth', '_blank');
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
