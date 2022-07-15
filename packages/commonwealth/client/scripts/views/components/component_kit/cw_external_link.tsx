/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_external_link.scss';

import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';

export type LinkType = 'button' | 'inline';

type ExternalLinkAttrs = {
  label: string;
  target: string;
  linkType: LinkType;
};

// TODO: Graham 11/17/21 - Synchronize/reconcile against Mithril internal/external link helpers
export class CWExternalLink implements m.ClassComponent<ExternalLinkAttrs> {
  view(vnode) {
    const { label, target, linkType } = vnode.attrs;
    return (
      <a
        class={`${ComponentType.ExternalLink} ${linkType}`}
        href={target}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>{label}</span>
        <CWIcon iconName="externalLink" />
      </a>
    );
  }
}
