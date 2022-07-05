/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_banner.scss';

import { isString } from 'helpers/typeGuards';
import { CWText } from './cw_text';
import { ComponentType } from './types';
import { CWIconButton } from './cw_icon_button';
import { getClasses } from './helpers';
import QuillFormattedText from '../quill/quill_formatted_text';
import { MarkdownFormattedText } from '../quill/markdown_formatted_text';

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
        <MarkdownFormattedText doc={bannerContent} hideFormatting collapse />
        {/* <CWText>{bannerContent}</CWText> */}
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
