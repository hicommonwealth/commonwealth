import React from 'react';
import type ChainInfo from 'client/scripts/models/ChainInfo';
import "components/component_kit/cw_community_card.scss"
import { CWText } from './cw_text';
import app from 'state';
import { CWCommunityAvatar } from './cw_community_avatar';
import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { pluralizeWithoutNumberPrefix } from '../../../helpers';
import { CWButton } from './cw_button';
import { integer } from 'aws-sdk/clients/cloudfront';

type CWCommunityCardProps = {
  chain: ChainInfo,
  memberCount: number,
  threadCount: number,
}

export const CWCommunityCard = ( props: CWCommunityCardProps) => {
  const { chain, memberCount, threadCount } = props;

  const prettifyDescription = (chain: ChainInfo) => {
    return (
      chain.description[chain.description.length - 1] === '.'
      ? chain.description
      : `${chain.description}.`
    )
  }

  return (
    <div className={ComponentType.CommunityCard}>
      <div className='content-container'>
        <div className='top-content'>
          <div className='header'>
            <CWCommunityAvatar community={chain} size='large'/>
            <CWText
              type="h5"
              title={chain.name}
              fontWeight='medium'
            >
              {chain.name}
            </CWText>
          </div>
          <div className='description'>
            {chain.description ? prettifyDescription(chain) : null}
          </div>
        </div>
        <div className='metadata'>
          <div className='member-data'>
            <CWIcon
                iconName='users'
                iconSize='small'
              />
            <span className='count'>
              {memberCount.toLocaleString('en-US')}
            </span>

            <span className='text'>
              {pluralizeWithoutNumberPrefix(memberCount, 'member')}
            </span>

          </div>

          <div className='divider'>
            <CWIcon
              iconName='dot'
            />
          </div>

          <div className='thread-data'>
            <CWIcon iconName='notepad' />
            <span className='count'>
              {threadCount.toLocaleString('en-US')}
            </span>
            <span className='text'>
              {pluralizeWithoutNumberPrefix(threadCount, 'thread')}
            </span>
          </div>

        </div>
        <div className='actions'>
          <CWButton
            buttonType='primary-black'
            disabled={false}
            className='action-btn'
            label="Button"
          />
        </div>
      </div>
    </div>
  )
}