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

const NoProfileFoundError = 'No profile found';

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
      this.loading = false;
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON.error === NoProfileFoundError
      ) {
        this.error = ProfileError.NoProfileFound;
      }
      this.loading = false;
    }
    m.redraw();
  };

  oninit(vnode) {
    this.loading = true;
    this.error = ProfileError.None;
    this.comments = [];
    this.threads = [];
    this.getProfileData(vnode.attrs.profileId);
  }

  view() {
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

      let coverUrl;
      let coverImageBehavior;
      let backgroundUrl;
      let backgroundImageBehavior;

      if (this.profile.coverImage) {
        const { url, imageBehavior } = this.profile.coverImage;
        coverUrl = url;
        coverImageBehavior = imageBehavior;
      }

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
          {this.profile.coverImage && (
            <div
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundRepeat: `${
                  coverImageBehavior === ImageBehavior.Fill
                    ? 'no-repeat'
                    : 'repeat'
                }`,
                backgroundSize:
                  coverImageBehavior === ImageBehavior.Fill ? 'cover' : '100px',
                backgroundPosition:
                  coverImageBehavior === ImageBehavior.Fill ? 'center' : '0 0',
                height: '240px',
              }}
            />
          )}
          <div
            className={
              this.profile.backgroundImage
                ? 'ProfilePageContainer'
                : 'ProfilePageContainer smaller-margins'
            }
          >
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

    return (
      <Sublayout>
        {this.content}
      </Sublayout>
    );
  }
}
