/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_banner.scss';

import { isString } from 'helpers/typeGuards';
import { CWText } from './cw_text';
import { ComponentType } from './types';
import { CWIconButton } from './cw_icon_button';
import { getClasses } from './helpers';

type BannerAttrs = {
  bannerContent?: string | m.Vnode;
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
        {isString(bannerContent) ? (
          <CWText type="caption">{bannerContent}</CWText>
        ) : (
          bannerContent
        )}
        {onClose && (
          <CWIconButton iconName="close" iconSize="small" onclick={onClose} />
        )}
      </div>
    );
  }
}
