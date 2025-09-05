import { DEFAULT_NAME } from '@hicommonwealth/shared';
import jdenticon from 'jdenticon';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type NewProfile from '../../../../models/NewProfile';
import { CWText } from '../../component_kit/cw_text';
import { CWTab, CWTabsRow } from '../../component_kit/new_designs/CWTabs';
import TrustLevelRole from '../../TrustLevelRole';
import './MutualCommunitiesModalContent.scss';

type MutualCommunity = {
  id: string;
  name: string;
  base: string;
  icon_url?: string | null;
  tier: string;
};

type MutualCommunitiesModalContentProps = {
  viewedUserProfile: NewProfile;
  mutualCommunities: MutualCommunity[];
  karma?: number;
  onClose: () => void;
};

export const MutualCommunitiesModalContent = ({
  viewedUserProfile,
  mutualCommunities,
  karma,
  onClose,
}: MutualCommunitiesModalContentProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mutual-communities');

  const handleCommunityClick = (community: MutualCommunity) => {
    navigate(`/${community.id}`);
    onClose();
  };

  const tabs = [
    {
      id: 'mutual-communities',
      label: 'Mutual Communities',
    },
  ];

  return (
    <div className="MutualCommunitiesModalContent">
      <div className="modal-content">
        <div className="profile-section">
          <div className="profile-avatar">
            {viewedUserProfile?.avatarUrl ? (
              <img src={viewedUserProfile.avatarUrl} />
            ) : (
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(
                  jdenticon.toSvg(viewedUserProfile.userId, 120),
                )}`}
              />
            )}
          </div>
          <div className="profile-info">
            <div className="profile-name">
              <CWText type="h3" fontWeight="semiBold">
                {viewedUserProfile.name || DEFAULT_NAME}
              </CWText>
              <TrustLevelRole type="user" level={viewedUserProfile.tier} />
            </div>

            {viewedUserProfile.bio && (
              <CWText type="b2" color="secondary">
                {viewedUserProfile.bio}
              </CWText>
            )}
            {karma !== undefined && (
              <div className="karma-section">
                <CWText type="b1" fontWeight="semiBold">
                  {karma}
                </CWText>
                <CWText type="caption" color="secondary">
                  Aura earned across Common
                </CWText>
              </div>
            )}
          </div>
        </div>

        <div className="content-section">
          <CWTabsRow>
            {tabs.map((tab) => (
              <CWTab
                key={tab.id}
                label={tab.label}
                onClick={() => setActiveTab(tab.id)}
                isSelected={activeTab === tab.id}
              />
            ))}
          </CWTabsRow>

          <div className="tab-content">
            {activeTab === 'mutual-communities' && (
              <div className="mutual-communities-content">
                {mutualCommunities.length === 0 ? (
                  <div className="empty-state">
                    <CWText type="b2" color="secondary">
                      No mutual communities found
                    </CWText>
                  </div>
                ) : (
                  <div className="communities-list">
                    {mutualCommunities.map((community) => (
                      <div
                        key={community.id}
                        className="community-item"
                        onClick={() => handleCommunityClick(community)}
                      >
                        <div className="community-info">
                          {community.icon_url ? (
                            <img
                              src={community.icon_url}
                              alt=""
                              className="community-icon"
                            />
                          ) : (
                            <div className="community-icon-placeholder">
                              {community.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="community-details">
                            <div className="community-name-row">
                              <CWText type="b2" fontWeight="semiBold">
                                {community.name}
                              </CWText>
                              <TrustLevelRole
                                type="community"
                                level={Number(community.tier)}
                              />
                            </div>
                            <CWText type="caption" color="secondary">
                              {community.base}
                            </CWText>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
