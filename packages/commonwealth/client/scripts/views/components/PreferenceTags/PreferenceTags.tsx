import clsx from 'clsx';
import React from 'react';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './PreferenceTags.scss';
import { PreferenceTagsProps } from './types';
const ICONS = {
  DAO: '🏛️',
  NFTs: '🖼️',
  Gaming: '👾',
  Social: '💬',
  Memes: '😹',
  AI: '🤖',
  DeFi: '💰',
  ReFi: '♻️',
  'Lending/Borrowing': '🏦',
  Staking: '📈',
  dApp: '📱',
  Technology: '🛠️',
  'Security/Auditing': '🔒',
  Governance: '⚖️',
  Marketplace: '🛍️',
  DeSci: '🔬',
  '🔛  Swaps': '🔛',
};
const PreferenceTags = ({
  preferenceTags,
  onTagClick,
  containerClassName,
  maxSelectableTags,
}: PreferenceTagsProps) => {
  return (
    <div className={clsx('PreferenceTags', containerClassName)}>
      {preferenceTags.map(({ item, isSelected }) => {
        const label = `${ICONS[item.tag] || '?'}  ${item.tag}`;
        return (
          <CWButton
            key={`${item.id}-${isSelected}`}
            label={label}
            type="button"
            buttonWidth="narrow"
            buttonType={isSelected ? 'primary' : 'secondary'}
            containerClassName={clsx('tag', { isSelected })}
            onClick={() => onTagClick(item, !isSelected)}
            disabled={
              isSelected
                ? false
                : maxSelectableTags ===
                  preferenceTags.filter((t) => t.isSelected).length
            }
            buttonHeight="sm"
          />
        );
      })}
    </div>
  );
};

export default PreferenceTags;
