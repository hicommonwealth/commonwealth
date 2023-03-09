import React from 'react';

type ListedCardWithImageProps = {
  buttonId: string;
  cardId: string;
  handleClick: (creator) => void;
  imageActive: boolean;
  imageAlt: string;
  imageSrc: string;
  isTabHoverActive: boolean;
  subtitle: string;
  subtitleId?: string;
  tabHoverColorClick: string;
  textType?: string;
  title: string;
  variant?: string;
};

export const ListedCardWithImage = ({
  buttonId,
  cardId,
  handleClick,
  imageActive,
  imageAlt,
  imageSrc,
  isTabHoverActive,
  subtitle,
  subtitleId,
  tabHoverColorClick,
  textType,
  title,
  variant,
}: ListedCardWithImageProps) => {
  return (
    <li className="lg:flex-grow">
      <div className="lg:flex lg:flex-row">
        <div className="lg:w-1/3 lg:mr-5 xl:mr-20 p-1 rounded-2xl transition hover:transition-all duration-500">
          <button
            className={`rounded-2xl p-5 text-left w-full focus:outline-none transition transition-all duration-500 ${
              isTabHoverActive ? `${tabHoverColorClick}` : ''
            }  ${variant}`}
            onClick={handleClick}
            id={buttonId}
          >
            <h4
              className={`${
                textType === 'black' ? '' : 'text-white'
              } font-bold text-xl`}
            >
              {title}
            </h4>
            <p
              id={subtitleId}
              className={`${isTabHoverActive ? '' : 'invisible'} ${
                textType === 'black' ? '' : 'text-white'
              }`}
            >
              {subtitle}
            </p>
          </button>
        </div>
        <div
          className={`${
            imageActive ? 'block' : 'invisible'
          }  lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0`}
          id={cardId}
        >
          <img
            className={`TokensCreatorsImage ${
              imageActive ? 'block' : 'hidden'
            } block max-w-2xl w-full h-auto`}
            src={imageSrc}
            alt={imageAlt}
          />
        </div>
      </div>
    </li>
  );
};
