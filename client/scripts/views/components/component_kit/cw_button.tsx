/* @jsx m */

import m from 'mithril';
import { ButtonIntent, GradientType } from './buttons';

export const CWButton: m.Component<
  {
    intent: ButtonIntent;
    label: string;
    onclick: () => void;
    disabled?: boolean;
    className?: string;
    gradient?: GradientType;
  },
  Record<string, unknown>
> = {
  view: () => {
    return <div>poop</div>;
  },
};
