/* @jsx m */

import m from 'mithril';
import app from 'state';
import jdenticon from 'jdenticon';

import { NewProfile as Profile, SocialAccount } from 'client/scripts/models';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWButton } from '../../components/component_kit/cw_button';

import 'pages/new_profile.scss';
import { CWText } from '../../components/component_kit/cw_text';

type NewProfileHeaderAttrs = {
  profile: Profile;
  socialAccounts: Array<SocialAccount>;
  address: string;
};

type NewProfileHeaderState = {
  isBioExpanded: boolean;
  defaultAvatar: string;
};

type NewProfileBioAttrs = {
  bio: string;
  isBioExpanded: boolean;
}

const DefaultProfileName = 'Anonymous';
const DefaultProfileBio = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sollicitudin vitae faucibus eros
semper pharetra lacus tincidunt diam. Turpis fermentum commodo in suspendisse id auctor libero bibendum egestas.
Cursus et nulla erat pellentesque vitae, amet leo est aliquet. Ornare gravida vitae`;

const maxBioCharCount = 190;
// TODO: Adjust value for responsiveness

const SocialAccounts: m.Component<NewProfileHeaderAttrs> = {
  view: (vnode) => {
    const { socialAccounts } = vnode.attrs;

    return socialAccounts?.map((account) => (
      <div class="social-account-icon">
        {account.provider === 'github' ? (
          <a href={`https://github.com/${account.username}`} target="_blank">
            <CWIcon iconName="github" iconSize="large" />
          </a>
        ) : account.provider === 'discord' ? (
          <a
            href={`https://discordapp.com/users/${account.username}`}
            target="_blank"
          >
            <CWIcon iconName="discord" iconSize="large" />
          </a>
        ) : account.provider === 'telegram' ? (
          <a href={`https://t.me/${account.username}`} target="_blank">
            <CWIcon iconName="telegram" iconSize="large" />
          </a>
        ) : (
          <div />
        )}
      </div>
    ));
  }
};

const Bio: m.Component<NewProfileBioAttrs> = {
  view: (vnode) => {
    const { bio, isBioExpanded } = vnode.attrs;

    if (bio?.length > maxBioCharCount && !isBioExpanded) {
      return `${bio.slice(0, maxBioCharCount)}...`;
    }

    return bio;
  }
}

const NewProfileHeader: m.Component<NewProfileHeaderAttrs, NewProfileHeaderState> = {
  oninit(vnode: m.Vnode<NewProfileHeaderAttrs, NewProfileHeaderState>) {
    vnode.state.isBioExpanded = false;
    vnode.state.defaultAvatar = jdenticon.toSvg(vnode.attrs.address, 90);
  },
  view(vnode: m.Vnode<NewProfileHeaderAttrs, NewProfileHeaderState>) {
    const { profile, address } = vnode.attrs;
    const { isBioExpanded, defaultAvatar } = vnode.state;
    const bio = profile?.bio || DefaultProfileBio;

    return (
      <div class="ProfileHeader">
        <div class="profile-image">
          {profile?.avatarUrl ? (
            <img src={profile?.avatarUrl} />
          ) : (
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                defaultAvatar
              )}`}
            />
          )}
        </div>

        <div class="profile-name-and-bio">
          <CWText
            type="h3"
            className="name"
          >
            {profile?.name ? profile.name : DefaultProfileName}
          </CWText>
          <div class="buttons">
            <CWButton
              label="Delegate"
              buttonType="mini"
              onClick={() => {}}
            />
            <CWButton
              label="Follow"
              buttonType="mini"
              onClick={() => {}}
            />
          </div>
          {m(SocialAccounts, vnode.attrs)}
          <CWText
            type="h4"
          >
            Bio
          </CWText>
          <CWText
            className="bio"
          >
            {m(Bio, { bio, isBioExpanded })}
          </CWText>
          {(bio.length > maxBioCharCount) && (
            <div
              class="read-more"
              onclick={() => {
                vnode.state.isBioExpanded = !isBioExpanded;
              }}
            >
              <p>{!isBioExpanded ? 'Show More' : 'Show Less'}</p>
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

export default NewProfileHeader;
