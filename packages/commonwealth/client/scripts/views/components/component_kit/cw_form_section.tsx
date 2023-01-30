/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_form_section.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';
import { CWDivider } from './cw_divider';

type FormSectionProps = {
  description: string;
  title: string;
  topRightElement?: React.ReactNode;
} & React.PropsWithChildren;

export const CWFormSection = (props: FormSectionProps) => {
  const { description, title, topRightElement } = props;

  return (
    <div className={ComponentType.FormSection}>
      <div className="title">
        <CWText type="h4">{title}</CWText>
        {topRightElement && (
          <div className="top-right-element">{topRightElement}</div>
        )}
      </div>
      <div className="columns">
        <div className="left-side">
          <CWText type="b1">{description}</CWText>
        </div>
        <div className="right-side">{props.children}</div>
      </div>
      <CWDivider />
    </div>
  );
};
