import React from 'react';

import 'components/component_kit/cw_form.scss';
import { CWDivider } from './cw_divider';
import { CWText } from './cw_text';
import { ComponentType } from './types';

type FormProps = {
  description: string;
  title: string;
  topRightElement?: React.ReactNode;
} & React.PropsWithChildren;

export const CWForm = (props: FormProps) => {
  const { description, title, topRightElement } = props;

  return (
    <div className={ComponentType.Form}>
      <div className="header">
        <div>
          <CWText type="h3" fontWeight="medium">
            {title}
          </CWText>
          <CWText type="b1">{description}</CWText>
        </div>
        {topRightElement && (
          <div className="top-right-element">{topRightElement}</div>
        )}
      </div>
      <CWDivider />
      <div className="content">{props.children}</div>
    </div>
  );
};
