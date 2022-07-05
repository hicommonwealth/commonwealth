/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_banner.scss';

import { CWText } from './cw_text';
import { ComponentType } from './types';
import { CWIconButton } from './cw_icon_button';
import { getClasses } from './helpers';
import { renderQuillTextBody } from '../quill/helpers';

type BannerAttrs = {
  bannerContent: string;
  onClose: () => void;
};

export class CWBanner implements m.ClassComponent<BannerAttrs> {
  view(vnode) {
    const { bannerContent, onClose } = vnode.attrs;

    return (
      <div
        class={getClasses<{ onClose?: boolean }>(
          { onClose: !!onClose },
          ComponentType.Banner
        )}
      >
        <CWText>{bannerContent}</CWText>
        {onClose && (
          <CWIconButton iconName="close" iconSize="small" onclick={onClose} />
        )}
      </div>
    );
  }
}

export class CWMessageBanner implements m.ClassComponent<BannerAttrs> {
  view(vnode) {
    const { bannerContent, onClose } = vnode.attrs;

    return (
      <div
        class={getClasses<{ onClose?: boolean }>(
          { onClose: !!onClose },
          ComponentType.MessageBanner
        )}
      >
        {renderQuillTextBody(bannerContent, {
          // collapse: true,
        })}
        {onClose && (
          <CWIconButton
            iconName="close"
            iconSize="small"
            onclick={onClose}
            iconButtonTheme="primary"
          />
        )}
      </div>
    );
  }
}
