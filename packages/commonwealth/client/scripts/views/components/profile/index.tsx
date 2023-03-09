/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import ClassComponent from 'class_component';

import 'components/profile/index.scss';

import app from 'state';
import type { Thread } from 'models';
import { AddressInfo, NewProfile as Profile } from 'models';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

import { ProfileHeader } from './profile_header';
import type { CommentWithAssociatedThread } from './profile_activity';
import { ProfileActivity } from './profile_activity';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { ImageBehavior } from '../../components/component_kit/cw_cover_image_uploader';
import { PageNotFound } from '../../pages/404';
import Sublayout from '../../sublayout';

enum ProfileError {
  None,
  NoAddressFound,
  NoProfileFound,
}

type NewProfileAttrs = {
  profileId: string;
};

export default class ProfileComponent extends ClassComponent<NewProfileAttrs> {
  private addresses: AddressInfo[];
  private content: m.Vnode;
  private comments: CommentWithAssociatedThread[];
  private error: ProfileError;
  private loading: boolean;
  private profile: Profile;
  private threads: Thread[];
  private isOwner: boolean;

  private getProfileData = async (profileId: string) => {
    try {
      const { result } = await $.get(`${app.serverUrl()}/profile/v2`, {
        profileId,
        jwt: app.user.jwt,
      });

      this.profile = new Profile(result.profile);
      this.threads = result.threads.map((t) => app.threads.modelFromServer(t));
      const comments = result.comments.map((c) => modelCommentFromServer(c));
      const commentsWithAssociatedThread = comments.map((c) => {
        const thread = result.commentThreads.find(
          (t) =>
            t.id === parseInt(c.rootProposal.replace('discussion_', ''), 10)
        );
        return { ...c, thread };
      });
      this.comments = commentsWithAssociatedThread;
      this.addresses = result.addresses.map(
        (a) =>
          new AddressInfo(
            a.id,
            a.address,
            a.chain,
            a.keytype,
            a.wallet_id,
            a.ghost_address
          )
      );
      this.isOwner = result.isOwner;
    } catch (err) {
      this.error = ProfileError.NoProfileFound;
    }
    this.loading = false;
    m.redraw();
  };

  private fetchProfile(vnode) {
    this.loading = true;
    this.error = ProfileError.None;
    this.comments = [];
    this.threads = [];
    this.getProfileData(vnode.attrs.profileId);
  }

  oninit(vnode) {
    this.fetchProfile(vnode);
  }

  view(vnode) {
    if (
      this.profile &&
      this.profile.id.toString() !== vnode.attrs.profileId &&
      !this.loading
    ) {
      this.fetchProfile(vnode);
    }
    if (this.loading)
      this.content = (
        <div class="NewProfilePage">
          <div class="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      );

    if (this.error === ProfileError.NoProfileFound)
      return <PageNotFound message="We cannot find this profile." />;

    if (this.error === ProfileError.None) {
      if (!this.profile) return;

      let backgroundUrl;
      let backgroundImageBehavior;

      if (this.profile.backgroundImage) {
        const { url, imageBehavior } = this.profile.backgroundImage;
        backgroundUrl = url;
        backgroundImageBehavior = imageBehavior;
      }

      this.content = (
        <div
          className="Profile"
          style={
            this.profile.backgroundImage
              ? {
                  backgroundImage: `url(${backgroundUrl})`,
                  backgroundRepeat: `${
                    backgroundImageBehavior === ImageBehavior.Fill
                      ? 'no-repeat'
                      : 'repeat'
                  }`,
                  backgroundSize:
                    backgroundImageBehavior === ImageBehavior.Fill
                      ? 'cover'
                      : '100px',
                  backgroundPosition:
                    backgroundImageBehavior === ImageBehavior.Fill
                      ? 'center'
                      : '56px 56px',
                  backgroundAttachment: 'fixed',
                }
              : {}
          }
        >
          <div className={'ProfilePageContainer'}>
            <ProfileHeader profile={this.profile} isOwner={this.isOwner} />
            <ProfileActivity
              threads={this.threads}
              comments={this.comments}
              addresses={this.addresses}
            />
          </div>
        </div>
      );
    } else {
      this.content = (
        <div className="Profile">
          <div className="ProfilePageContainer">
            <ProfileHeader profile={this.profile} isOwner={this.isOwner} />
            <ProfileActivity
              threads={this.threads}
              comments={this.comments}
              addresses={this.addresses}
            />
          </div>
        </div>
      );
    }

    return <Sublayout hideFooter={true}>{this.content}</Sublayout>;
  }
}
