// import { RenderTextWithLink } from 'client/scripts/views/components/component_kit/CWBannerText/RenderTextWithLink';
import React from 'react';
import { CWText } from '../cw_text';
import './CWBannerText.scss';

const urlRegex = /(https?:\/\/[^\s]+)/g;

type TextProps = {
  text: string | React.ReactNode;
};

const RenderTextWithLink = ({ text }: TextProps) => {
  if (typeof text !== 'string') {
    return <>{text}</>;
  }
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <React.Fragment key={index}>
              <CWText type="b2" className="terms-text">
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
            <CWText type="b2" className="terms-text text" key={index}>
              {part}
            </CWText>
          );
        }
      })}
    </>
  );
};
export const CWBannerText = ({ text }: TextProps) => {
  return (
    <div className="linkTextRow">
      <RenderTextWithLink text={text} />
    </div>
  );
};
