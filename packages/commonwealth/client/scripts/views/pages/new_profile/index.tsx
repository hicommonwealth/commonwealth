/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import ClassComponent from 'class_component';

import 'pages/new_profile/index.scss';

import app from 'state';
import {
  Thread,
  ChainInfo,
  AddressInfo,
  NewProfile as Profile,
} from 'models';
import { modelFromServer as modelThreadFromServer } from 'controllers/server/threads';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

import { NewProfileHeader } from './new_profile_header';
import { CommentWithAssociatedThread, NewProfileActivity } from './new_profile_activity';
import Sublayout from '../../sublayout';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { ImageBehavior } from '../../components/component_kit/cw_cover_image_uploader';
import { PageNotFound } from '../404';

enum ProfileError {
  None,
  NoAddressFound,
  NoProfileFound,
}

type NewProfileAttrs = {
  placeholder?: string;
};

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

export default class NewProfile extends ClassComponent<NewProfileAttrs> {
  private address: string;
  private addresses: AddressInfo[];
  private chains: ChainInfo[];
  private content: m.Vnode;
  private comments: CommentWithAssociatedThread[];
  private error: ProfileError;
  private loading: boolean;
  private profile: Profile;
  private threads: Thread[];
  private username: string;
  private isOwner: boolean;

  private getProfileData = async (username: string) => {
    try {
      const response = await $.get(`${app.serverUrl()}/profile/v2`, {
        username,
        jwt: app.user.jwt,
      });

      this.profile = new Profile(response.profile);
      this.threads = response.threads.map((t) => modelThreadFromServer(t));
      const comments = response.comments.map((c) => modelCommentFromServer(c));
      const commentsWithAssociatedThread = comments.map((c) => {
        const thread = response.commentThreads.find(
          (t) => t.id === parseInt(c.rootProposal.replace('discussion_', ''), 10)
        );
        return { ...c, thread };
      })
      this.comments = commentsWithAssociatedThread;
      this.chains = response.chains.map((c) => ({ ...new ChainInfo(c), iconUrl: c.icon_url }));
      this.addresses = response.addresses.map(
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
      this.isOwner = response.isOwner;
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON.error === NoAddressFoundError
      ) {
        this.error = ProfileError.NoAddressFound;
      }
      if (
        err.status === 500 &&
        err.responseJSON.error === NoProfileFoundError
      ) {
        this.error = ProfileError.NoProfileFound;
      }
    }
    m.redraw();
  };

  oninit() {
    this.username = m.route.param('username');
    this.loading = true;
    this.error = ProfileError.None;
    this.comments = [];
    this.threads = [];
    this.getProfileData(this.username);
    this.loading = false;
  }

  view() {
    if (this.loading)
      this.content = (
        <div class="ProfilePage">
          <div class="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      );

    if (this.error === ProfileError.NoAddressFound)
      return <PageNotFound message="We cannot find this profile." />

    if (this.error === ProfileError.NoProfileFound)
      return <PageNotFound message="We cannot find this profile." />

    if (this.error === ProfileError.None) {
      if (!this.profile) return;

      if (this.profile.coverImage) {
        const { url, imageBehavior, imageAs } = this.profile.coverImage;
        this.content = (
          <div className="ProfilePage"
            style={
              imageAs === 'background' ? (
                  {
                    backgroundImage: `url(${url})`,
                    backgroundRepeat: `${imageBehavior === ImageBehavior.Fill ? 'no-repeat' : 'repeat'}`,
                    backgroundSize: imageBehavior === ImageBehavior.Fill ? 'cover' : '100px',
                    backgroundPosition: imageBehavior === ImageBehavior.Fill ? 'center' : '56px 56px',
                    backgroundAttachment: 'fixed',
                  }
              ) : {}
            }
          >
            { imageAs === 'cover' && (
              <div
                style={
                  {
                    backgroundImage: `url(${url})`,
                    backgroundRepeat: `${imageBehavior === ImageBehavior.Fill ? 'no-repeat' : 'repeat'}`,
                    backgroundSize: imageBehavior === ImageBehavior.Fill ? 'cover' : '100px',
                    backgroundPosition: imageBehavior === ImageBehavior.Fill ? 'center' : '0 0',
                    height: '240px',
                  }
                }
              />
            )}
            <div className={imageAs === 'background' ? 'ProfilePageContainer' : 'ProfilePageContainer smaller-margins'}>
              <NewProfileHeader
                profile={this.profile}
                isOwner={this.isOwner}
              />
              <NewProfileActivity
                threads={this.threads}
                comments={this.comments}
                chains={this.chains}
                addresses={this.addresses}
              />
            </div>
          </div>
        );
      } else {
        this.content = (
          <div className="ProfilePage">
            <div className="ProfilePageContainer">
              <NewProfileHeader
                profile={this.profile}
                isOwner={this.isOwner}
              />
              <NewProfileActivity
                threads={this.threads}
                comments={this.comments}
                chains={this.chains}
                addresses={this.addresses}
              />
            </div>
          </div>
        );
      }
    }

    return <Sublayout>{this.content}</Sublayout>;
  }
}
