import React, { useState } from 'react';

import type { Chain, Token } from './index';
import type { placeholderChain } from './tokens_community_hero';

import { InputTokenOption } from './input_token_option';

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
        <InputTokenOption
          route={option.address}
          iconImg={option.logoURI}
          text={option.name}
        />
      );
    } else {
      option = option as Chain;

      return (
        <InputTokenOption
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
