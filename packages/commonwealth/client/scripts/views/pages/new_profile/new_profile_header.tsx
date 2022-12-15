/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import jdenticon from 'jdenticon';

import 'pages/new_profile/new_profile_header.scss';

import app from 'state';
import { NewProfile as Profile } from 'client/scripts/models';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { IconName } from '../../components/component_kit/cw_icons/cw_icon_lookup';

type NewProfileHeaderAttrs = {
  address: string;
  profile: Profile;
};

type NewProfileBioAttrs = {
  bio: string;
  isBioExpanded: boolean;
};

type NewProfileSocialAccountAttrs = {
  iconName: IconName;
  link: string;
};

const DefaultProfileName = 'Anonymous';
const DefaultProfileBio = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sollicitudin vitae faucibus eros
semper pharetra lacus tincidunt diam. Turpis fermentum commodo in suspendisse id auctor libero bibendum egestas.
Cursus et nulla erat pellentesque vitae, amet leo est aliquet. Ornare gravida vitae`;

const maxBioCharCount = 190;
// TODO: Adjust value for responsiveness

class SocialAccount extends ClassComponent<NewProfileSocialAccountAttrs> {
  view(vnode: m.Vnode<NewProfileSocialAccountAttrs>) {
    const { iconName, link } = vnode.attrs;
    return (
      <a href={link} target="_blank">
        <CWIcon iconName={iconName} className="social-icon" />
      </a>
    );
  }
}

class SocialAccounts extends ClassComponent<{profile: Profile}> {
  view(vnode: m.Vnode<NewProfileHeaderAttrs>) {
    const { profile } = vnode.attrs;

    if (!profile) return;

    const { email, website } = profile;

    return (
      <div className="social-accounts">
        {website && <SocialAccount link={website} iconName="website" />}
        {/* {twitter && <SocialAccount link={twitter} iconName="twitter" />}
        {discord && <SocialAccount link={discord} iconName="discord" />}
        {telegram && <SocialAccount link={telegram} iconName="telegram" />}
        {github && <SocialAccount link={github} iconName="github" />} */}
        {email && <SocialAccount link={email} iconName="mail" />}
      </div>
    );
  }
}

class Bio extends ClassComponent<NewProfileBioAttrs> {
  view(vnode: m.Vnode<NewProfileBioAttrs>) {
    const { bio, isBioExpanded } = vnode.attrs;

    if (bio?.length > maxBioCharCount && !isBioExpanded) {
      return `${bio.slice(0, maxBioCharCount)}...`;
    }

    return bio;
  }
}

export class NewProfileHeader extends ClassComponent<NewProfileHeaderAttrs> {
  private isBioExpanded: boolean;
  private defaultAvatar: string;

  oninit(vnode: m.Vnode<NewProfileHeaderAttrs>) {
    this.isBioExpanded = false;
    this.defaultAvatar = jdenticon.toSvg(vnode.attrs.address, 90);
  }

  view(vnode: m.Vnode<NewProfileHeaderAttrs>) {
    const { profile, address } = vnode.attrs;
    const bio = profile?.bio || DefaultProfileBio;

    return (
      <div class="ProfileHeader">
        <div class="profile-image">
          {profile?.avatarUrl ? (
            <img src={profile?.avatarUrl} />
          ) : (
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                this.defaultAvatar
              )}`}
            />
          )}
        </div>

        <div class="profile-name-and-bio">
          <CWText type="h3" className="name">
            {profile?.name ? profile?.name : DefaultProfileName}
          </CWText>
          <div class="buttons">
            <CWButton label="Delegate" buttonType="mini" onClick={() => {}} />
            <CWButton label="Follow" buttonType="mini" onClick={() => {}} />
          </div>
          <SocialAccounts profile={profile} />
          <CWText type="h4">Bio</CWText>
          <CWText className="bio">
            <Bio
              bio={bio}
              isBioExpanded={this.isBioExpanded}
            />
          </CWText>
          {bio.length > maxBioCharCount && (
            <div
              class="read-more"
              onclick={() => {
                this.isBioExpanded = !this.isBioExpanded;
              }}
            >
              <p>{!this.isBioExpanded ? 'Show More' : 'Show Less'}</p>
            </div>
          )}
        </div>

        <div class="edit">
          {app.isLoggedIn() &&
            app.user.addresses
              .map((addressInfo) => addressInfo.address)
              .includes(address) && (
              <div class="edit-button">
                <CWButton
                  label="Edit"
                  buttonType="primary-blue"
                  onclick={() =>
                    m.route.set(`/profile/${m.route.param('address')}/edit`)
                  }
                />
              </div>
            )}
        </div>
      </div>
    );
  }
}
