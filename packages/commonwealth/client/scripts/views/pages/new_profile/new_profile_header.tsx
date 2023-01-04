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
import { renderQuillTextBody } from '../../components/quill/helpers';

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

    const { email, socials } = profile;

    return (
      <div className="social-accounts">
        {email && <SocialAccount link={`mailto:${email}`} iconName="mail" />}
        {socials.map((social) => {
          const link = `https://${social}`;
          if (social.includes('twitter')) {
            return <SocialAccount link={link} iconName="twitter" />
          } else if (social.includes('discord')) {
            return <SocialAccount link={link} iconName="discord" />
          } else if (social.includes('telegram')) {
            return <SocialAccount link={link} iconName="telegram" />
          } else if (social.includes('github')) {
            return <SocialAccount link={link} iconName="github" />
          } else {
            return <SocialAccount link={link} iconName="website" />
          }
        })}
      </div>
    );
  }
}

class Bio extends ClassComponent<NewProfileBioAttrs> {
  view(vnode: m.Vnode<NewProfileBioAttrs>) {
    const { bio, isBioExpanded } = vnode.attrs;

    // if (bio?.length > maxBioCharCount && !isBioExpanded) {
    //   return `${bio.slice(0, maxBioCharCount)}...`;
    // }

    return renderQuillTextBody(bio, {
      collapse: true,
    });
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
    const bio = profile?.bio;

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
            {profile?.name}
          </CWText>
          <div class="buttons">
            <CWButton label="Delegate" buttonType="mini" onClick={() => {}} />
            <CWButton label="Follow" buttonType="mini" onClick={() => {}} />
            {app.isLoggedIn() && app.user.addresses
              .map((addressInfo) => addressInfo.address)
              .includes(address) && (
                <CWButton
                  label="Edit"
                  buttonType="mini"
                  onclick={() =>
                    m.route.set(`/profile/${m.route.param('address')}/edit`)
                  }
                />
              )
            }
          </div>
          <SocialAccounts profile={profile} />
          <CWText type="h4">Bio</CWText>
          <CWText className="bio">
            <Bio
              bio={bio}
              isBioExpanded={this.isBioExpanded}
            />
          </CWText>
          {bio?.length > maxBioCharCount && (
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
      </div>
    );
  }
}
