import React from 'react';
import { CWText } from '../cw_text';
import './CWBannerText.scss';

const urlRegex = /(https?:\/\/[^\s]+)/g;

type TextProps = {
  text: string;
};
const RenderTextWithLink = ({ text }: TextProps) => {
  const urls = text.split(urlRegex);

  return (
    <>
      {urls.map((url, index) => {
        // If part matches the URL regex, render it as a link
        if (urlRegex.test(url)) {
          return (
            <a key={index} href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          );
        }
        return (
          <CWText key={index} type="b1" fontWeight="semiBold" className="text">
            {url}
          </CWText>
        );
      })}
    </>
  );
};
export const CWBannerText = ({ text }: { text: string }) => {
  return (
    <div className="linkTextRow">
      <RenderTextWithLink text={text} />.
    </div>
  );
};
