import React from 'react';
import type ChainInfo from 'client/scripts/models/ChainInfo';
import "components/component_kit/cw_community_card.scss"
import { CWText } from './cw_text';
import app from 'state';
import { CWCommunityAvatar } from './cw_community_avatar';
import { ComponentType } from './types';
import { useSearchProfilesQuery } from '../../../state/api/profiles';
import { 
  APIOrderBy,
  APIOrderDirection
} from '../../../helpers/constants';
import { CWIcon } from './cw_icons/cw_icon';
import { pluralizeWithoutNumberPrefix } from '../../../helpers';
import { CWButton } from './cw_button';

type CWCommunityCardProps = {
  chain: ChainInfo
}

export const CWCommunityCard = ( props: CWCommunityCardProps) => {
  const { chain } = props;

  const prettifyDescription = (chain: ChainInfo) => {
    return (
      chain.description[chain.description.length - 1] === '.'
      ? chain.description
      : `${chain.description}.`
    )
  }

  const { data } = useSearchProfilesQuery({
    chainId: chain.id,
    searchTerm: '',
    limit: 10,
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
    includeRoles: true,
  });

  const num = 12345

  console.log("chains!!! ", data)
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
              {/* { data.pages.length } */}
              {num.toLocaleString('en-US')}
            </span>

            <span className='text'>
              {pluralizeWithoutNumberPrefix(10, 'member')}
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
              {num.toLocaleString('en-US')}
            </span>
            <span className='text'>
              {pluralizeWithoutNumberPrefix(10, 'thread')}
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