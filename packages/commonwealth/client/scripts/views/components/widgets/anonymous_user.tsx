/* @jsx m */
/* eslint-disable no-script-url */

import ClassComponent from 'class_component';
import m from 'mithril';
import jdenticon from 'jdenticon';

import 'components/widgets/user.scss';

export class AnonymousUser extends ClassComponent<{
  avatarOnly?: boolean;
  avatarSize?: number;
  distinguishingKey: string; // To distinguish user from other anonymous users
  hideAvatar?: boolean;
  showAsDeleted?: boolean;
}> {
  view(vnode) {
    const {
      avatarOnly,
      avatarSize,
      distinguishingKey,
      hideAvatar,
      showAsDeleted,
    } = vnode.attrs;

    const showAvatar = !hideAvatar;

    let profileAvatar;

    if (showAvatar) {
      const pseudoAddress = distinguishingKey;

      profileAvatar = (
        <svg
          style={`width: ${avatarSize}px; height: ${avatarSize}px;`}
          data-address={pseudoAddress}
          oncreate={(vnode_) => {
            jdenticon.update(vnode_.dom as HTMLElement, pseudoAddress);
          }}
          onupdate={(vnode_) => {
            jdenticon.update(vnode_.dom as HTMLElement, pseudoAddress);
          }}
        />
      );
    }

    return avatarOnly ? (
      <div class="User avatar-only" key="-">
        <div
          class="user-avatar-only"
          style={`width: ${avatarSize}px; height: ${avatarSize}px;`}
        >
          {profileAvatar}
        </div>
      </div>
    ) : (
      <div class="User" key="-">
        {showAvatar && (
          <div
            class="user-avatar-only"
            style={`width: ${avatarSize}px; height: ${avatarSize}px;`}
          >
            {profileAvatar}
          </div>
        )}
        <a class="user-display-name username">
          {showAsDeleted ? 'Deleted' : 'Anonymous'}
        </a>
      </div>
    );
  }
}
