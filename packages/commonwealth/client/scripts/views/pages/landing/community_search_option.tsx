import React, { useState } from 'react';

import type { Chain, Token } from './index';
import type { placeholderChain } from './community_search';
import { useCommonNavigate } from 'navigation/helpers';

const ADD_TOKEN_LINK = 'https://hicommonwealth.typeform.com/to/cRP27Rp5';

type CommunitySearchOptionProps = {
  iconImg: string;
  route: string;
  text: string;
};

export const CommunitySearchOption = ({
  iconImg,
  route,
  text,
}: CommunitySearchOptionProps) => {
  const navigate = useCommonNavigate();

  let tokenImage;

  if (!iconImg || !iconImg.length || iconImg.slice(0, 4) === 'ipfs') {
    tokenImage = (
      <div className="TokenIcon">
        <div
          className="token-icon.no-image"
          style={{ width: '1.5rem', height: '1.5rem', marginRight: '1rem' }}
        >
          <span className="font-size: 1.25rem;">{text.slice(0, 1)}</span>
        </div>
      </div>
    );
  } else {
    tokenImage = <img className="mr-4 h-6 w-6" src={iconImg} alt="" />;
  }
  return (
    <li>
      <button
        type="button"
        onClick={(e) => {
          if (route === 'placeholder') {
            e.preventDefault();
            window.location.href = ADD_TOKEN_LINK;
          } else {
            e.preventDefault();
            localStorage['home-scrollY'] = window.scrollY;
            navigate(`/${route}`);
          }
        }}
        className={`p-3 rounded hover:bg-gray-100 flex flex-grow items-center flex-row
           text-left leading-none w-full justify-between focus:outline-none`}
      >
        <span className="flex flex-row font-bold">
          {tokenImage}
          <span className="mt-1">{text}</span>
        </span>
      </button>
    </li>
  );
};

type InputTokenListProps = {
  inputValue: string;
  maxOptions: number;
  optionList: Array<Token | Chain | typeof placeholderChain>;
  refilterResults: boolean;
};

export const InputTokenList = ({
  inputValue,
  maxOptions,
  optionList,
  refilterResults,
}: InputTokenListProps) => {
  const [oldValue, setOldValue] = useState('');
  const [options, setOptions] = useState<Array<any>>();

  if (inputValue.length < 3) return;

  const chainNameInputValue = inputValue.toLowerCase();

  if (refilterResults && inputValue !== oldValue) {
    setOldValue(inputValue);

    const newOptions = (
      inputValue.includes(oldValue) && !!oldValue ? options : optionList
    ).filter((option) => {
      if ((option as Token).symbol) {
        option = option as Token;

        const tokenNameSubtracted = option.name
          .substr(0, inputValue.length)
          .toLowerCase();

        const tokenSymbolSubtracted = option.symbol
          .substr(0, inputValue.length)
          .toLowerCase();

        return (
          tokenNameSubtracted === chainNameInputValue ||
          tokenSymbolSubtracted === chainNameInputValue
        );
      } else {
        option = option as Chain;

        const chainNameSubtracted = option.id
          .substr(0, inputValue.length)
          .toLowerCase();

        if (!option.chainInfo?.symbol) console.log(option);

        const chainSymbolSubtracted = option.chainInfo.symbol
          .substr(0, inputValue.length)
          .toLowerCase();

        return (
          chainNameSubtracted === chainNameInputValue ||
          chainSymbolSubtracted === chainNameInputValue ||
          option.placeholder
        );
      }
    });

    setOptions(newOptions);
  }

  const renderResults = (option) => {
    if ((option as Token).symbol) {
      option = option as Token;

      return (
        <CommunitySearchOption
          route={option.address}
          iconImg={option.logoURI}
          text={option.name}
        />
      );
    } else {
      option = option as Chain;

      return (
        <CommunitySearchOption
          route={option.id}
          iconImg={option.img}
          text={option.name}
        />
      );
    }
  };

  if (!options) return;

  return (
    <ul
      className="absolute left-0 right-0 shadow-xl bg-white rounded top-full mt-16 text-xl p-3 z-10"
      id="tokens-list"
      style={{ overflowY: 'scroll', maxHeight: '16rem' }}
    >
      {options.slice(0, maxOptions).map(renderResults)}
    </ul>
  );
};
