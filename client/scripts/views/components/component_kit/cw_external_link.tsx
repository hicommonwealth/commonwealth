/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_external_link.scss';

import { ExternalLinkIcon } from './icons';
import { ComponentType, State } from './types';

export enum LinkType {
  Button = 'button',
  Inline = 'inline',
}

type ExternalLinkProps = {
  label: string;
  target: string;
  linkType: LinkType;
};

// TODO: Graham 11/17/21 - Synchronize/reconcile against Mithril internal/external link helpers
export const CWExternalLink: m.Component<ExternalLinkProps, State> = {
  view: (vnode) => {
    const { label, target, linkType } = vnode.attrs;
    return (
      <a
        class={`${ComponentType.ExternalLink} ${linkType}`}
        href={target}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>{label}</span>
        {m(ExternalLinkIcon)}
      </a>
    );
  },
};
