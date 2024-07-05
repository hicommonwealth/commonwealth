import 'components/CommunityHomeProfile/Profile.scss';
import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../component_kit/cw_text';
import { ImageBehavior } from '../component_kit/cw_cover_image_uploader';
import ProfileHeader, { ProfileHeaderProps } from './ProfileHeader';

const CommunityProfile = () => {
  const chainInfo = app.chain.meta;

  const profile = {
    name: chainInfo.name,
    backgroundImage: {
      url: chainInfo.background_image_url || '',
      imageBehavior: ImageBehavior.Fill,
    },
  };

  const profileHeaderProps: ProfileHeaderProps = {
    name: chainInfo.name,
    iconUrl: chainInfo.iconUrl,
    description: chainInfo.description,
    socialLinks: chainInfo.categorizeSocialLinks(),
    threadCount: chainInfo.threadCount,
    addressCount: chainInfo.addressCount,
    defaultSymbol: chainInfo.default_symbol,
  };

  return (
    <CWPageLayout>
      <div
        className="Profile"
        style={
          profile.backgroundImage.url
            ? {
                backgroundImage: `url(${profile.backgroundImage.url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
              }
            : {}
        }
      >
        <div className="header">
          <CWText type="h2" fontWeight="medium">
            {`$${profile.name}`}
          </CWText>
        </div>
        <div className={profile.backgroundImage.url ? 'ProfilePageContainer' : 'ProfilePageContainer smaller-margins'}>
          <ProfileHeader {...profileHeaderProps} />
          {/* <ProfileActivity /> */}
        </div>
      </div>
    </CWPageLayout>
  );
};

export default CommunityProfile;