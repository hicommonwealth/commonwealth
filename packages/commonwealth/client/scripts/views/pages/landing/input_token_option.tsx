import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';

const ADD_TOKEN_LINK = 'https://hicommonwealth.typeform.com/to/cRP27Rp5';

type InputTokenOptionProps = {
  iconImg: string;
  route: string;
  text: string;
};

export const InputTokenOption = ({
  iconImg,
  route,
  text,
}: InputTokenOptionProps) => {
  const navigate = useCommonNavigate();

  let tokenImage;

  if (!iconImg || !iconImg.length || iconImg.slice(0, 4) === 'ipfs') {
    tokenImage = (
      <div className="TokenIcon">
        <div
          className="token-icon.no-image"
          style={{ width: '1.5rem', height: '1.5rem', marginRight: '1rem' }}
        >
          <span className="font-size: 1.25rem;">{text.slice(0, 1)}</span>
        </div>
      </div>
    );
  } else {
    tokenImage = <img className="mr-4 h-6 w-6" src={iconImg} alt="" />;
  }
  return (
    <li>
      <button
        type="button"
        onClick={(e) => {
          if (route === 'placeholder') {
            e.preventDefault();
            window.location.href = ADD_TOKEN_LINK;
          } else {
            e.preventDefault();
            localStorage['home-scrollY'] = window.scrollY;
            navigate(`/${route}`);
          }
        }}
        className={`p-3 rounded hover:bg-gray-100 flex flex-grow items-center flex-row
           text-left leading-none w-full justify-between focus:outline-none`}
      >
        <span className="flex flex-row font-bold">
          {tokenImage}
          <span className="mt-1">{text}</span>
        </span>
      </button>
    </li>
  );
};
