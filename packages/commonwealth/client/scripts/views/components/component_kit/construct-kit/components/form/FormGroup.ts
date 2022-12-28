import m from 'mithril';
import classnames from 'classnames';
import { Classes } from 'client/scripts/views/components/component_kit/construct-kit/_shared';
import { FormLabel } from 'client/scripts/views/components/component_kit/construct-kit/components/form/FormLabel';
import { IColAttrs, Col } from 'client/scripts/views/components/component_kit/construct-kit/components/grid';

export interface IFormGroupAttrs extends IColAttrs {
  /** Text label */
  label?: string;

  /** Inner content; can be used instead of passing children */
  content?: m.Children;

  /** Disables interaction */
  disabled?: boolean;
}

export class FormGroup implements m.Component<IFormGroupAttrs> {
  public view({ attrs, children }: m.Vnode<IFormGroupAttrs>) {
    const {
      class: className,
      content,
      disabled,
      label,
      span = 12,
      ...htmlAttrs
    } = attrs;

    const classes = classnames(
      Classes.FORM_GROUP,
      disabled && Classes.DISABLED,
      className
    );

    const innerContent = [
      label && m(FormLabel, label),
      content || children
    ];

    return m(Col, {
      class: classes,
      span,
      ...htmlAttrs
    }, innerContent);
  }
}
