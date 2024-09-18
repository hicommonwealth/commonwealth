import React from 'react';
import { CWText } from '../cw_text';
import './RenderTextWithLink.scss';

const urlRegex = /(https?:\/\/[^\s]+)/g;

type TextProps = {
  text: string | React.ReactNode;
};

export const RenderTextWithLink = ({ text }: TextProps) => {
  if (typeof text !== 'string') {
    return <>{text}</>;
  }
  const parts = text.split(urlRegex);

  return (
    <div className="RenderTextWithLink">
      <div className="mainText">
        {parts.map((part, index) => {
          if (urlRegex.test(part)) {
            return (
              <React.Fragment key={index}>
                <CWText type="b2">
                  <a
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                  >
                    {part}
                  </a>
                </CWText>
              </React.Fragment>
            );
          } else {
            return (
              <CWText type="b2" className="text" key={index}>
                {part}
              </CWText>
            );
          }
        })}
      </div>
    </div>
  );
};
