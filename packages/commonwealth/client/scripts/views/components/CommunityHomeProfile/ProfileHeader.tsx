import React from 'react';
import 'components/CommunityHomeProfile/ProfileHeader.scss';
import { CWText } from '../component_kit/cw_text';
import { QuillRenderer } from '../react_quill_editor/quill_renderer';
import { SocialAccounts } from '../social_accounts';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import type { CategorizedSocialLinks } from '../../../models/ChainInfo';

export interface ProfileHeaderProps {
  name: string;
  iconUrl: string;
  description: string;
  socialLinks: CategorizedSocialLinks;
  threadCount: number;
  addressCount: number;
  defaultSymbol: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  iconUrl,
  description,
  socialLinks,
  threadCount,
  addressCount,
  defaultSymbol,
}) => {
  const subHeaderData = {
    mcap: '$5.6k', // This is a dummy value, replace with actual data if available
    coin: `$0.10`,
    change24h: '0.00%', // This is a dummy value, replace with actual data if available
    members: addressCount,
    threads: threadCount,
  };

  return (
    <>
      <div className="ProfileHeader">
        <div className="content-container">
          <div className="top-content">
            <div className="community-info">
              <div className="header">
                <div className="community-name">
                  {iconUrl ? (
                    <img src={iconUrl} alt="Community Icon" className="community-avatar" />
                  ) : (
                    <div className="default-icon">{name.charAt(0)}</div>
                  )}
                </div>
              </div>
              {description && (
                <CWText className="description" type="b2">
                  {description}
                </CWText>
              )}
            </div>
          </div>
          <SocialAccounts socialLinks={socialLinks} />
        </div>
      </div>
      <div className="SubHeader">
        <div className="stat">
          <CWText type='b1'>{subHeaderData.mcap}</CWText>
          <CWText type="b2">mcap</CWText>
        </div>
        <div className="stat">
          <CWText type="b1">{subHeaderData.coin}</CWText>
          <CWText type="b2">per ${defaultSymbol}</CWText>
        </div>
        <div className="stat">
          <CWText type="b1">{subHeaderData.change24h}</CWText>
          <CWText type="b2">24h</CWText>
        </div>
        <div className="stat">
          <div className="member-data">
            <CWIcon iconName="users" iconSize="small" />
            <CWText type="b1">{subHeaderData.members.toLocaleString('en-US')}</CWText>
          </div>
          <CWText type="b2">members</CWText>
        </div>
        <div className="stat">
          <div className="thread-data">
            <CWIcon iconName="notepad" iconSize="small" />
            <CWText type="b1">{subHeaderData.threads.toLocaleString('en-US')}</CWText>
          </div>
          <CWText type="b2">threads</CWText>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;