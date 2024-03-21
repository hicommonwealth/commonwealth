import React from 'react';

/* eslint-disable max-len */
/* eslint-disable react/no-multi-comp */

import 'components/component_kit/cw_icon.scss';

import { getClasses } from '../helpers';
import type { CustomIconProps, CustomIconStyleProps } from './types';

// ADDING CUSTOM ICONS: INSTRUCTIONS
//
// Base instructions + template for adding CWIcons can be found in cw_icons.tsx
// However, "custom" icons—defined as having static, predefined coloration—
// require slightly different handling:
// (1) The "fill" properties in path tags should be left in, to preserve coloration
// (2) Extra attention must be paid to the JSX conversion output, since distortions
//     of width, height, and coloration have been observed with some regularity

export const CWCosmosEvmMetamask = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#000"
        d="M12.892 7.862c-4.84 1.865-5.283 6.642-6.67 8.873-1.404 2.258-4.62 3.503-4.181 4.654.44 1.15 3.66-.086 6.208.648 2.518.726 6.03 3.978 10.87 2.113a8.683 8.683 0 005.07-5.223.403.403 0 00-.338-.539.397.397 0 00-.393.217 6.866 6.866 0 01-12.358-.121 6.894 6.894 0 01-.217-.504 6.995 6.995 0 01-.174-.521 78.534 78.534 0 015.035-2.135 78.77 78.77 0 015.076-1.77 57.357 57.357 0 012.806-.791l.182-.046a.26.26 0 01.306.16l.001.003c.028.073.052.146.078.22.168.476.293.956.376 1.438.036.21.265.325.454.224.694-.375 1.33-.74 1.898-1.092 2.116-1.308 3.289-2.418 3.048-3.047-.24-.629-1.852-.665-4.296-.216a38.586 38.586 0 00-3.054.7c-.781.207-1.605.446-2.463.712a81.5 81.5 0 00-5.074 1.772 82.328 82.328 0 00-4.657 1.957c-.017-2.795 1.665-5.437 4.417-6.498a6.83 6.83 0 014.97.016c.152.06.325.018.436-.103a.404.404 0 00-.108-.628 8.637 8.637 0 00-7.248-.473z"
      ></path>
    </svg>
  );
};

export const CWKeplr = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="42"
      height="42"
      viewBox="0 0 42 42"
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      {...otherProps}
    >
      <g clipPath="url(#clip0_425_5107)">
        <path
          d="M32.4545 0H9.54545C4.27365 0 0 4.27365 0 9.54545V32.4545C0 37.7264 4.27365 42 9.54545 42H32.4545C37.7264 42 42 37.7264 42 32.4545V9.54545C42 4.27365 37.7264 0 32.4545 0Z"
          fill="url(#paint0_linear_425_5107)"
        />
        <path
          d="M32.4545 0H9.54545C4.27365 0 0 4.27365 0 9.54545V32.4545C0 37.7264 4.27365 42 9.54545 42H32.4545C37.7264 42 42 37.7264 42 32.4545V9.54545C42 4.27365 37.7264 0 32.4545 0Z"
          fill="url(#paint1_radial_425_5107)"
        />
        <path
          d="M32.4545 0H9.54545C4.27365 0 0 4.27365 0 9.54545V32.4545C0 37.7264 4.27365 42 9.54545 42H32.4545C37.7264 42 42 37.7264 42 32.4545V9.54545C42 4.27365 37.7264 0 32.4545 0Z"
          fill="url(#paint2_radial_425_5107)"
        />
        <path
          d="M32.4545 0H9.54545C4.27365 0 0 4.27365 0 9.54545V32.4545C0 37.7264 4.27365 42 9.54545 42H32.4545C37.7264 42 42 37.7264 42 32.4545V9.54545C42 4.27365 37.7264 0 32.4545 0Z"
          fill="url(#paint3_radial_425_5107)"
        />
        <path
          d="M17.2526 32.2614V22.5192L26.7185 32.2614H31.9849V32.0079L21.0964 20.9122L31.1469 10.3857V10.2614H25.8464L17.2526 19.5635V10.2614H12.9849V32.2614H17.2526Z"
          fill="white"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_425_5107"
          x1="21"
          y1="0"
          x2="21"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1FD1FF" />
          <stop offset="1" stopColor="#1BB8FF" />
        </linearGradient>
        <radialGradient
          id="paint1_radial_425_5107"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(2.00623 40.4086) rotate(-45.1556) scale(67.3547 68.3624)"
        >
          <stop stopColor="#232DE3" />
          <stop offset="1" stopColor="#232DE3" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="paint2_radial_425_5107"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(39.7379 41.7602) rotate(-138.45) scale(42.1137 64.2116)"
        >
          <stop stopColor="#8B4DFF" />
          <stop offset="1" stopColor="#8B4DFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="paint3_radial_425_5107"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(20.6501 0.311498) rotate(90) scale(33.1135 80.3423)"
        >
          <stop stopColor="#24D5FF" />
          <stop offset="1" stopColor="#1BB8FF" stopOpacity="0" />
        </radialGradient>
        <clipPath id="clip0_425_5107">
          <rect width="42" height="42" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const CWLeap = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 34.32 22.29"
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      {...otherProps}
    >
      <defs>
        <clipPath id="clippath">
          <path
            d="M0 0h34.31v22.29H0z"
            style={{
              fill: 'none'
            }}
          />
        </clipPath>
        <style>
          {'.cls-4{fill:#4bc174}.cls-5{fill:#0d0d0d}.cls-6{fill:#eee}'}
        </style>
      </defs>
      <g>
        <path
          d="M30.91 15.39c0 4.91-5.99 6.9-13.43 6.9s-13.52-2-13.52-6.9S10 6.51 17.43 6.51s13.47 3.98 13.47 8.88Z"
          style={{
            fill: '#4baf74'
          }}
        />
        <path
          d="M29.55 4.69C29.55 2.1 27.44 0 24.84 0c-1.47 0-2.77.67-3.64 1.71-1.18-.26-2.43-.41-3.73-.41s-2.56.14-3.73.41C12.86.67 11.56 0 10.1 0 7.5 0 5.39 2.1 5.39 4.69c0 .85.23 1.64.62 2.32-.38.8-.58 1.65-.58 2.53 0 4.55 5.39 8.24 12.04 8.24s12.04-3.69 12.04-8.24c0-.88-.2-1.73-.58-2.53.39-.69.62-1.47.62-2.32Z"
          className="cls-4"
        />
        <path
          d="M9.72 7.29c1.59 0 2.88-1.28 2.88-2.86s-1.29-2.86-2.88-2.86-2.88 1.28-2.88 2.86 1.29 2.86 2.88 2.86ZM25.08 7.29c1.59 0 2.88-1.28 2.88-2.86s-1.29-2.86-2.88-2.86-2.88 1.28-2.88 2.86 1.29 2.86 2.88 2.86Z"
          className="cls-6"
        />
        <path
          d="M8.18 21.94c.62 0 1.11-.54 1.04-1.14-.25-2.15-1.33-6.81-6.04-9.61-6.28-3.73-1.31 9.11-1.31 9.11l-1.3.75c-.44.25-.25.9.24.9h7.37ZM26.93 21.94c-.56 0-.99-.54-.93-1.14.22-2.14 1.19-6.81 5.45-9.61 5.68-3.73 1.19 9.11 1.19 9.11l1.18.75c.39.25.23.9-.22.9h-6.66Z"
          className="cls-4"
        />
        <path
          d="M9.72 4.95c.29 0 .52-.23.52-.52s-.23-.52-.52-.52-.52.23-.52.52.23.52.52.52ZM25.07 4.95c.29 0 .52-.23.52-.52s-.23-.52-.52-.52-.52.23-.52.52.23.52.52.52Z"
          className="cls-5"
        />
      </g>
    </svg>
  );
};

export const CWX = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 1200 1227"
      fill="black"
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      {...otherProps}
    >
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
    </svg>
  );
};

export const CWApple = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="#000000"
      height="800px"
      width="800px"
      version="1.1"
      id="Capa_1"
      viewBox="0 0 22.773 22.773"
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      {...otherProps}
    >
      <g>
        <path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573    c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z" />
        <path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334    c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0    c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019    c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464    c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648    c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z" />
      </g>
    </svg>
  );
};

export const CWMagic = (props: CustomIconProps) => {
  const { componentType, iconSize, className, ...otherProps } = props;

  console.log('otherProps', otherProps);
  return (
    <svg
      {...otherProps}
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
    >
      <path
        fill="#6452F6"
        d="M3.285 10.49c.88-.42 1.78-.8 2.63-1.26.85-.46 1.67-1 2.5-1.54 1.42 2.08 1.5 13 .14 16.57l-5.27-2.9v-.19c.073-.135.137-.276.19-.42.58-2.142.759-4.373.53-6.58a8.45 8.45 0 00-.72-3.3v-.38zM20.355 5.2a37.12 37.12 0 000 21.57l-4.35 4.46-4.34-4.45a36.87 36.87 0 000-21.57l4.34-4.44 4.35 4.43zM23.455 7.64l5.26 3a18.92 18.92 0 000 10.6l-5.27 3.07a36.701 36.701 0 01.01-16.67z"
      ></path>
    </svg>
  );
};

export const CWBlast = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}) => {
  return (
    <svg
      {...otherProps}
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g clip-path="url(#clip0_465_7874)">
        <path
          d="M6 12C9.31371 12 12 9.31371 12 6C12 2.68629 9.31371 0 6 0C2.68629 0 0 2.68629 0 6C0 9.31371 2.68629 12 6 12Z"
          fill="black"
        />
        <rect x="1.5" y="1.5" width="9" height="9" fill="url(#pattern0)" />
      </g>
      <defs>
        <pattern
          id="pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image0_465_7874" transform="scale(0.00465116)" />
        </pattern>
        <clipPath id="clip0_465_7874">
          <rect width="12" height="12" fill="white" />
        </clipPath>
        <image
          id="image0_465_7874"
          width="215"
          height="215"
          xlinkHref="data:image/png;base64,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E2+WvGfgz4H9ULm4ukO3JwbGRcUZkgCTInlaIpk35GHD7n4To73RvIWmcnExdIuwzIduhw2i9h+SQJK03xjykBy7x/UWmsrFxUMiJYwS5oijDhmCQNriBHnEEAfk2NW9haZxZ44DKzukUnFhCV3+Eldl4feVcccS7uUrtQHpLMMSBv+S8allr1RcrPB0PGe8PaYWSH/HR4ARvE32pU6ie2yt0pvIZazwZB/0Uc+BoQze7GhHIXU3ppdwb+s2uzxsUq70JnIZKzzZYFOqPQJMtV+NuAyut9LXu6L6MXZwQy+/mLaV9VyAO7rVsl3hKaZAxFpWHram4fs8R6ebaRu/oKf6aayi6sWyMnG5FZ6Ap0/0BJL3+alCuglRXd0VFQvbxP+prHmXscJT/OEJuwZYwkewhCwoVOTTEdViRPUzTra1EFWPRiU9F2eow7CEpkun9SqorR0BLKF7UUZOcaWv0Q6uQlSX1k1UPeKViKuMFZ56FdTWkkCeE2S6EVFdiaguQ1QbLUtXddoViauh662qI18wf7cgJ5ZwQfZk0lcR0xW8WvWKuouqx6R0cXHW4q3uFkO3vSppWwYBLOHTWMIM4kpf6YrqcrYl3Gwuo/bZ8ihdXFjCRdmKpr1CJoBQ3sWJcoZPZ8bw5fRUV46aqHpQKhBXcjqw9YmYAL3WE2naHNBrpS8T38u6ono94moWLnqp4uJMN6/VSj/u96ZjYQZKYEgCXG89SQwP3P6w9CVEdSmiWsx2pEXV41KquLZaQvVbPfixbjlJ7rMtiumLXVFdxbaEOV3xUCtVXDziqen88bSNviXFEj7FHLyDWfjzBcT0c3qqqyWqvqi8PhTWP4fut5zttMLTjIRi+bF9J0Pw9yKqJRJVLDFTOUVABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERABERglAn8D3YMBubS70daAAAAAElFTkSuQmCC"
        />
      </defs>
    </svg>
  );
};

export const CWBase = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: CustomIconProps) => {
  return (
    <svg
      {...otherProps}
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <rect width="12" height="12" fill="url(#pattern0)" />
      <defs>
        <pattern
          id="pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image0_465_7913" transform="scale(0.00684932)" />
        </pattern>
        <image
          id="image0_465_7913"
          width="146"
          height="146"
          xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJIAAACSCAYAAACue5OOAAAMbGlDQ1BJQ0MgUHJvZmlsZQAASImVVwdYU8kWnluSkJDQAghICb0JIjWAlBBaAOlFEJWQBBJKjAlBxY4uKrh2EcWKroootpVmx64sir0vFhSUdVEXGypvQgK67ivfO/nm3j9nzvyn3LnlAKD5gSuR5KFaAOSLC6TxYUGMsalpDFInQOBPH1gDKpcnk7BiY6MAlMHz3+XdTWgL5ZqTguuf8/9VdPgCGQ8AJB3iTL6Mlw/xCQDw9TyJtAAAokJvOaVAosBzINaVwgAhXqXA2Uq8U4EzlfjIgE1iPBviKwCoUblcaTYAGvehnlHIy4Y8Gp8hdhHzRWIANEdA7M8TcvkQK2IfkZ8/SYErILaD9hKIYTyAmfkdZ/bf+DOH+Lnc7CGszGtA1IJFMkked9r/WZr/Lfl58kEfNnBQhdLweEX+sIa3cydFKjAV4m5xZnSMotYQfxDxlXUHAKUI5eFJSnvUmCdjw/rBaw5QFz43OBJiY4hDxXnRUSp9ZpYolAMx3C3oVFEBJxFiA4gXCmQhCSqbzdJJ8SpfaF2WlM1S6c9zpQN+Fb4eynOTWCr+N0IBR8WPaRQJE1MgpkBsVShKjoZYA2JnWW5CpMpmdJGQHT1oI5XHK+K3gjheIA4LUvJjhVnS0HiVfWm+bDBfbLNQxIlW4QMFwsRwZX2w0zzuQPwwF+yKQMxKGuQRyMZGDebCFwSHKHPHOgXipAQVzwdJQVC8ci1OkeTFquxxC0FemEJvAbG7rDBBtRZPLoCbU8mPZ0kKYhOVceJFOdyIWGU8+DIQBdggGDCAHI5MMAnkAFFrd303/KecCQVcIAXZQACcVJrBFSkDM2J4TABF4A+IBEA2tC5oYFYACqH+y5BWeXQCWQOzhQMrcsEziPNBJMiD/+UDq8RD3pLBU6gR/cM7Fw4ejDcPDsX8v9cPar9pWFATpdLIBz0yNActiSHEYGI4MZRojxvh/rgvHgWPgXC44kzcezCPb/aEZ4Q2wmPCDUI74c5EUbH0hyjHgHbIH6qqReb3tcBtIKcHHoT7QXbIjOvjRsAJd4d+WHgA9OwBtWxV3IqqMH7g/lsG310NlR3ZhYySh5EDyXY/rtRw0PAYYlHU+vv6KGPNHKo3e2jmR//s76rPh+fIHy2xhdhB7Bx2EruAHcHqAQM7jjVgLdhRBR7aXU8Hdtegt/iBeHIhj+gf/rgqn4pKylxqXLpcPivnCgRTCxQ3HnuSZJpUlC0sYLDg20HA4Ih5ziMYri6u7gAo3jXKx9fbuIF3CKLf8k0373cA/I739/cf/qaLOA7Afi94+zd+09kxAdBWB+B8I08uLVTqcMWBAJ8SmvBOMwSmwBLYwXxcgSfwBYEgBESAGJAIUsEEWGUh3OdSMAXMAHNBCSgDy8BqsA5sAlvBTrAHHAD14Ag4Cc6CS+AKuAHuwd3TAV6CHvAO9CEIQkJoCB0xRMwQa8QRcUWYiD8SgkQh8UgqkoFkI2JEjsxA5iFlyApkHbIFqUb2I43ISeQC0obcQR4hXcgb5BOKoVRUFzVBbdCRKBNloZFoIjoezUYno0XofHQJWoFWobvROvQkegm9gbajL9FeDGDqmD5mjjlhTIyNxWBpWBYmxWZhpVg5VoXVYk3wOl/D2rFu7CNOxOk4A3eCOzgcT8J5+GR8Fr4YX4fvxOvw0/g1/BHeg38l0AjGBEeCD4FDGEvIJkwhlBDKCdsJhwhn4L3UQXhHJBL1ibZEL3gvphJziNOJi4kbiHuJJ4htxCfEXhKJZEhyJPmRYkhcUgGphLSWtJt0nHSV1EH6oKauZqbmqhaqlqYmVitWK1fbpXZM7arac7U+shbZmuxDjiHzydPIS8nbyE3ky+QOch9Fm2JL8aMkUnIocykVlFrKGcp9ylt1dXULdW/1OHWR+hz1CvV96ufVH6l/pOpQHahsajpVTl1C3UE9Qb1DfUuj0WxogbQ0WgFtCa2ador2kPZBg67hrMHR4GvM1qjUqNO4qvFKk6xprcnSnKBZpFmueVDzsma3FlnLRoutxdWapVWp1ah1S6tXm649SjtGO197sfYu7QvanTokHRudEB2+znydrTqndJ7QMbolnU3n0efRt9HP0Dt0ibq2uhzdHN0y3T26rbo9ejp67nrJelP1KvWO6rXrY/o2+hz9PP2l+gf0b+p/GmYyjDVMMGzRsNphV4e9NxhuEGggMCg12Gtww+CTIcMwxDDXcLlhveEDI9zIwSjOaIrRRqMzRt3DdYf7DucNLx1+YPhdY9TYwTjeeLrxVuMW414TU5MwE4nJWpNTJt2m+qaBpjmmq0yPmXaZ0c38zURmq8yOm71g6DFYjDxGBeM0o8fc2DzcXG6+xbzVvM/C1iLJothir8UDS4ol0zLLcpVls2WPlZnVGKsZVjVWd63J1kxrofUa63PW721sbVJsFtjU23TaGthybItsa2zv29HsAuwm21XZXbcn2jPtc+032F9xQB08HIQOlQ6XHVFHT0eR4wbHthGEEd4jxCOqRtxyojqxnAqdapweOes7RzkXO9c7vxppNTJt5PKR50Z+dfFwyXPZ5nJvlM6oiFHFo5pGvXF1cOW5Vrped6O5hbrNdmtwe+3u6C5w3+h+24PuMcZjgUezxxdPL0+pZ61nl5eVV4bXeq9bTF1mLHMx87w3wTvIe7b3Ee+PPp4+BT4HfP70dfLN9d3l2znadrRg9LbRT/ws/Lh+W/za/Rn+Gf6b/dsDzAO4AVUBjwMtA/mB2wOfs+xZOazdrFdBLkHSoENB79k+7JnsE8FYcFhwaXBriE5IUsi6kIehFqHZoTWhPWEeYdPDToQTwiPDl4ff4phweJxqTk+EV8TMiNOR1MiEyHWRj6McoqRRTWPQMRFjVo65H20dLY6ujwExnJiVMQ9ibWMnxx6OI8bFxlXGPYsfFT8j/lwCPWFiwq6Ed4lBiUsT7yXZJcmTmpM1k9OTq5PfpwSnrEhpHzty7Myxl1KNUkWpDWmktOS07Wm940LGrR7Xke6RXpJ+c7zt+KnjL0wwmpA34ehEzYnciQczCBkpGbsyPnNjuFXc3kxO5vrMHh6bt4b3kh/IX8XvEvgJVgieZ/llrcjqzPbLXpndJQwQlgu7RWzROtHrnPCcTTnvc2Nyd+T256Xk7c1Xy8/IbxTriHPFpyeZTpo6qU3iKCmRtE/2mbx6co80UrpdhsjGyxoKdOFHfYvcTv6T/FGhf2Fl4YcpyVMOTtWeKp7aMs1h2qJpz4tCi36Zjk/nTW+eYT5j7oxHM1kzt8xCZmXOap5tOXv+7I45YXN2zqXMzZ37W7FL8Yriv+alzGuabzJ/zvwnP4X9VFOiUSItubXAd8GmhfhC0cLWRW6L1i76WsovvVjmUlZe9nkxb/HFn0f9XPFz/5KsJa1LPZduXEZcJl52c3nA8p0rtFcUrXiycszKulWMVaWr/lo9cfWFcvfyTWsoa+Rr2iuiKhrWWq1dtvbzOuG6G5VBlXvXG69ftP79Bv6GqxsDN9ZuMtlUtunTZtHm21vCttRV2VSVbyVuLdz6bFvytnO/MH+p3m60vWz7lx3iHe0743eervaqrt5lvGtpDVojr+nanb77yp7gPQ21TrVb9urvLdsH9sn3vdifsf/mgcgDzQeZB2t/tf51/SH6odI6pG5aXU+9sL69IbWhrTGisbnJt+nQYefDO46YH6k8qnd06THKsfnH+o8XHe89ITnRfTL75JPmic33To09df103OnWM5Fnzp8NPXvqHOvc8fN+549c8LnQeJF5sf6S56W6Fo+WQ795/Hao1bO17rLX5YYr3lea2ka3HbsacPXkteBrZ69zrl+6EX2j7WbSzdu30m+13+bf7ryTd+f13cK7fffm3CfcL32g9aD8ofHDqt/tf9/b7tl+9FHwo5bHCY/vPeE9eflU9vRzx/xntGflz82eV3e6dh7pCu268mLci46Xkpd93SV/aP+x/pXdq1//DPyzpWdsT8dr6ev+N4vfGr7d8Zf7X829sb0P3+W/63tf+sHww86PzI/nPqV8et435TPpc8UX+y9NXyO/3u/P7++XcKXcgU8BDA40KwuANzsAoKUCQId9G2WcshccEETZvw4g8J+wsl8cEE8AauH3e1w3/Lq5BcC+bbD9gvyasFeNpQGQ6A1QN7ehoRJZlpurkosK+xTCw/7+t7BnI60E4Muy/v6+qv7+L1thsLB3PCFW9qAKIcKeYTPnS2Z+Jvg3ouxPv8vxxzNQROAOfjz/C41LkLZpO+0AAAAAOGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAACoAIABAAAAAEAAACSoAMABAAAAAEAAACSAAAAALIL6xUAABQ+SURBVHgB7V0LmBTVlf5rGBAMCvEFGo2PDxVdRVR8gVEeakRhmG7CI4DBDVlNiCZqDLKsROKigiYhDzXE6KoQgooyA5qEAPJSQXRdiGjQQJQYExENiqKgMHP3P9203TN091R33VNV3V3n+6rrde85557797mn7qPKQaXSYNMVjTgZhlsVTqIZOnFr99lm9hw72C9hIoMPud8Bh5vs09vb5LGO19dhN7f5zquJ9BX241REeWtNd5bzfFb2GdxO5nE35XKvIbhe5LaGcpaj3lmrLC9w9mUIJOMgRqAY9Kan6U0Ln8ftgIAtvZXyV1CnpfSCSzEPLwGOCVgnq+LLAEgEzmCcyArqTW/Tm9Y5n9vBVq1kn9k7ZLmc29IEuOqc9fZF+MuxdIHU3+yDfdCfXmcIK2MgQZSMZfy1n3dpydhrPhnNwU4swB+cT7wz9Z9DaQGpXMCTq55LGFSlA6SYGUCvM5510CtXPZTVdYOn6WlvZaD+h1IoV7iBNMS04iP1cBryhj1PW6VgU9s6vsj4bwpa4xHMcRpsM7fFL5xAkiasHcawkNdzO9pWYUucz2v0UHfgPTyAZc7OsJUlfECKmz402IP0QEeEzVgh0WcD7fNt1DmLQqJPQo3wAGmI6cxm7CcE0FfDZKAQ6/Jb6nY95jpvhUHHquCVMFWIm7FowCsRiAqqjRFMvR615lsA+9ICpmAViJkTWP7fEECnBWyH0hZv8BQLMJbNHXvMg6HggBQzg1jk+wmizwdT9DKTahiGA/9OMM0LomT+A+l00xpH4mcsLF1yRNYtYHAX3sC1eMHZZZ13Hob+AmmwOYZ9Io/QC52eR6follcLGLzAoaOheMx5zSsrt/n9C7ZjZiQfW/8Ugcht1XhIJ39UsXUyfPDAyH1Wf4AUM9Iz/Ruq1d69alFKjxZoT5vXE0z/5ZGPq+z6QIqZ21igKa60iRLZt4CDyexemWSfcVOOujFS3NxNcVFQ3dTmQZ1NZuflRC3hekCKQKRVZ1743kkwXe2FQa68OkCKGelkHJlLaFivH8l5lUcdAnT8HLBfO25tk/u2bYDtnO6/nUOlsn3I420fA69vAf7+blhLk0Mvgxnsaxqd427Rl+0DKWamEEQ3FK2RDxk/z5D/nOOAHl2Af+PQ8PGHAcdxa0fAFEo7PgU2cLTrL//keMWbwEquIXnqz8BHYZ7naDCVYBpfaFnzpbcLpLi5hsKm5RMYxL199wGG9gQu4lqSs44Fjumkr4UAasm65LY0sIGLvOW8ls3cT/OmKOCmPSDFzHB6olmUrf8k6LKA5xwPfL0vMKxXsolymc16Mmn+Zi4H7l2cbA6tCyiOYSP7mr5GzyR15pnsAClmZOXGYgKp2rNGHhlIbDOmH/AfFwAnhnBG0yp6qukLgRnLPBbURnbDiTsOLqJnWuqVnXcg1ZgeaIUlVCjQVRxnssn65kVJ7yNNWdhJ4qqb5wCzOW7f0BigtrLgwEE/gul5L1p4A1LM8BmHK0qdxHJnL3oUnVeetH55BdC/RCeiSJA+6WEC6umiTWAj42b6pu5cbv52scw8AImTqeJ4koL7FCvcS742bETH1QITBhf3tOVFtkbeF/7KeO4u/iv/psHdBU/DuqxzGBAUR8UDKWbG0xPdVpxYb7nOO5ETma7y5+nLm6aF5/4V46cJDH+3bi88r4UcRT/JFQckiYuqsZKKt7agvGsWEkjf8TXgSsZC5UwCojH0TvXP+V5K9orh3GLipcKBNMR0YHu6lt7oKD+LeeEpwIPs3D+0guZT/uRxLuibCexu8NHSBpvoJLpzDd22QqQW3uezO7FUyDcQOYT61MuAhT+oLBBJJV43EHjmFuAwP9+lIg6igVOgC6TCPFKtqWV3Y12BMopOLo/xs68Fas4omkVZZHz3A2DArcDqDT4Wx/AFHXXOArcS3QNpiGnDJm0jm7Qj3DL3kk6aMPFCJ33RC5fyybuT0UvsdmDBGt/K9Ar7B09hEydxU4vkvmlrwAQ/QbSaU+EiEKXrT2Yg/G4CMOJL6WvKR13ZxFGiO3LnkeLmcI7LiDdiY6NLB7J/fCXduIzGR5TdAuMYgN9Rn/2e1asGn7DOu/Ap7s2W+LrzSAZ3+gGi9pz/8+SkCEQtVdrtfPjwpQtEHIfUvQtqGUgSYDsY5IKX5yQLJgKnHOWZTUUwmH4lV0P29aGoUvcxc3FLkloGUhUY4unTo9fzDVpd9eWUk4R7vwXEz/ahRA7+uyUp+YEk3gjguLouTRoGDD5HV0Y5cq9i7c2+xpfpMj34sgrBQk7KD6SqxKv2cma2cUP+UTcNtcGpMnm04SBV/TgfBq5bwEJuINWa3qyaszSr59hDgVnf1ZRQGbyP5RPu3Veol/UseqXeuaTkBpKDSbky2bjeipLn8p8k/SMRebfA5X2Sk/q8c8rDIY9Xyg6kuDmbT2oyfVaNbhkRdTjaNu6vGXxLP5waGU7LrTVZXwCSHUgG31RThozPPYGj2jFNCZXJW6bZ/Gi0YtkduhcHnIOxN+3dsz3Q7MtZRluYlMsEdWjdtMgb6Vg2ybUXBzZkOZQKyRzv9/htl2XO7kz+e3ukatQwgRqIZKwoGkPLrAL7x/eN5ZqwvWvWjiBZ5NERA5ozyyZuePNENs8nMzaKSNcCXQ8HvtFPUYaDy5tzbwqkgeYgtoGXNE9k6/xqcj5a1p1EpG6B/4wD8mSsQoKR5Aqiz9g3FdUao3hHZR62FOrGr3wmNzpQtoC8DENxyolghFBNU1MgIfHdj/Rdi0cjGRsd0sEiw4hVixZQ/uM2CYHSQLrUcE4iP9WpRNdJCB+RrxaQOV0xrbEJB1/CEPPZbPI0kFonOiDT5xaL3O/kaHqIRXMWxOqKCwtKXkjiKuxKfOY1kScNnORnPAth5Drt2BZns7hmFSUs0AIXn6oYUmRgJg0koHeBOrpKLrMeB/ZwlTRKpGQBxaC7d0rlJJAkPkp+xjx13dp+EKOu1lynH1FwFrhMa9RUMLMnTkoCSTE+GsqXXEUUrAVOO4azEzllR4GquETtTOGbBFJGW2dTmDRrlb640aY9vfD6cncvufPkdZCY7JsCUtc8SYu+JW8NiSgcFrigm5Iehu8JICWBBKgAKZrMr1R5RbCVLhh5j4ICJbBDIPELjgCH+exTBCT7Ni2WY3vOVTqzS7G58+STBZTEUBUG4zgma5UnadG3ztBQvGhtoow9VdodYocYquL6bhX2px4NlMJLQSsJXsfpPLnxbaroWsX+IxUgRdNFwgdRtfcpVOEoiY9UgHTEQeEzZKVrpAYkYkg8UmcNAx9+oAbXiKcXC0idyNuArZNB5yq+baKtdcZkGAFJw6reear0cDtoW02PpAKk2+YCv1rkveDlwEFmhy6+KRwlOWh/FT06VtMjdSSYrFNgLx63XhLvDKslEg0JHchPjFknYkiK2NE644hhaC2gshKXrZoE2ypNW2gtWeGKHaDjkQgkpWC7wuurSfF3NzY5DfSkg87S10TTFmjBKkF4mGKkT5sstLZnfYmR3rfHLuIUdgvIh50V6H2JkXYqMI5YhtQCKkAihiRGioAU0krXUEsFSMSQdEiqNG0Pfy/5ZWsNY0Q8i7fABxpNGzGkFiO9/nbxhY1y6llg0xYV3gSSUtP2WgQklRrzwrShAVj/Dy8ccuZNBNubc972cCPySB6Mp5T1dXqjRo0+LYPN0rS9oqH3RhV4amhaOTyVvBFXFWBTFRr56UkFEvQH9IFfhdKUB8v1byqVw+CVKk7dVvFIovKzf1FSPGJblAVW6b2glEB6DFLdDMPs00o1iNrXtdw5GgMsfUmllA2oxxuMkRwJv1ScntorelXsUd5M124Ctn2sUEb5ICQxJMG2kIrv8PVjvslyRL85LKDkjURaAjtJIDFYyiHf0+WPPwHmPeeJRZTZkgWWrLPEaG82m+RSCkjL5ESDHl2lwTXiWYgFPtoJ/HFtITkKSGsYIZGSQGqNFTzW6KpCPT3Sp7sKUCxKat0Cs1i7uzUep+Tjya2xUhROAmmOs5VDJSrObzv/DQu0/g3WTV6eDGcsVyvXs5jjfCrck0BKylmW3Nn/fWCpfZ4RR3cWkKGqZ1QiYMp3sCylRRpIJn0xddPWvm41+xf+ZYtbxKcQC9yv+SduTGMmDSTFOEkK/ssFhRQ/SmvDAts59+jnv7PBKQuPjPhI7qaBlIyTnsqSxcql6QuVAj4r2pUnk7v/qNQJKeaSZm1PfCSnaSAlbz4gOw2SAdwZyzQ4RzxzWeDH83PdsXL9oUwuTYHUCo/yptrD+o2zgU/UuGcWKzr+xe+BLdvU7LAL2zEnk3tTIM1xtrMbgCro0FvvAVPrdHhHXNMW2PYRcNPD6XPrR4KRhQ6lpKkpkJLXm7isdFI7R1MIpH9utcMr4pLdAlffB7zHUEKNDB5ozntvIFXjCXqlD5sntHW+g91X359hi1vEp7kFFr8IzNTrgBRx27nu6InmcvcGkjRvAN9upEe/5bNhNJhr3747OEg++hf2+TbhaDiDrdkXtuX+3kCSqw6my06TLr8TkJgpInsWuOpe5bDBsK2qws+yaZwdSHOdZ5lF1UG+z1Dtq9OyqRRdK8YCjzwD/M+SYnIWkMfBQjzmrMmWIzuQkimnZMtg89ryl4EfzbPJsTJ5/ZUrdr5+lw9lb0ROTOR/6V/cPE/1emiqKN/HWHYzEH0Apzgr7+JranqMA3x41eJqzHXOzqVlPo8kM5RuyZXR1nWZlF47Vbltt6VsCPmM+KkvIBIs5PRGYpb8QKp36hkrySoTVZI+jwG3sktd6SVQqsoHyHzCLMCnGagbIFjIQ/mBJBkNbsiT39qtNa8Dg++IBnbdGvS+JwF5BbUv1Ag2nvkpf4yUyhs3Mgnky6lTzb18cXLeeE0Jpc9b+uAkHPCFDOahzqltSVbLHkk47MZ36ZnY3aVP8xne19wWzfPOZWmZfx2n5/aFpM4dXOVGljsgzXdeJcO8wZYbYW7TPP6/jJkIpo98ga5brYJPN5lzM0axO1DljSLZiid1PtdxtXjWXdMmQoaYNvRMGwmoI7LJ1Lh2/BeART8AKv1LS/JkO+Zu4H7tDsfMSjR4FdXoljl5LfN282N3HklyyWw4g+80Z6B5/uo/gO7fA57nouBKpXc4p+jCH/oMoqSxr3ELIknu3iOlajJm6plrUOrUr/3PxwBXX+KXtHDIkdUfQ38cQB+bywA700ruPVIqVzVG0zNtSp36tf8O59hcyu7Rdz/wS2JwcqQpk6Gj8ycGAqJNbNJGF1r6wj2SSIgbPqTjWW6FA1Hye6BDOgAPXQf0OckDkxBnffkNjpsxHnpuQyBK7mIc3BPzHT7uFEbFAUlkxM0k/t4kh36TjM8N78UOuVHAkQf7LV1HniyOmDgbmM6VH430SAHRtXxK46BL4VQ8kGAcxLCI8VK/wsXayzGOXWU3fgXYr509nn5ykhmjv14E/PCRwF+VuJQg6lts2T0AiSJrTCe2p2t51LlYBWzkk2+QXTcQuKo/sP++Njjq85BJfdOeAO7hej+VF2AVUgSDt5m8G3uwtxSSLTOtNyAJJ4mXDJ6kZ2J1Bkv77gOMvRi4vgbo1DFYXXJJX/Fn4N7F6vOqc4nf+7rMz29A32Liokxm3oEk3OKmD8G0kGCqzmQe5PEwxlCy9T8NaNs6SE2AN94FZJD1waXA394JVpcm0g1Da+ACeqLlTa4XcWIHSCI4ZkYSSDN45PuTXL5yi5e69HRO6z2XHXunAO3b5ktt796ylzlh7yX2zP8JCOm7NBv55x9JED1ko9T2gCTaxM01/J1mQzEtHj2P51+QgLqwG3DuCXakbH4f+L/Xko/sT60ncNiRuHOXHd6KXIp+Qsumk10giYSYmULP5MscpmwFKvTaFw8CDjsA+AI32R+8P9CBAbt4LnkSlH3bNlzMtROQT1Sl9v/iyj+Z3irDN4pLowstjrv0BlPpica7S+wulX0gidyYmUkwjXKnQpTKVwsYzCaIRtiWqRPP1DmXUVF28EcUKgsYdiArgEjKqOORUtaLm28woLuHUnTlpORF++wWkIWNnIlCEN2fPYH3q/oVHDfDWIwHCSU+P0XkuwWSsxxHsdea0+L0SB9Ionut6U0g1XELaTehnoED5szZTKghiFZo6+EPkKQUNaYLuyt/z6NjtQsV8U9YYAO7Gy9hjzWfK/VJJ9jOprcUqBXYz5x4K1y2FNE1exZ4NGFrn0AkavvnkTKNFDfjeMolkSxuRDYt0MB49EYG1VNsMnXDKxggiWZxcx5/H+YW6MwBUaVMaDPLMcyPeCibvYIDkmgj01BaYT794pnZlIuuubSAwXMcwa9hPCTTQQKhYIGUKDInyMUTveC38zTyToXAIDmPaByfh2cySgluXiV1DgGQ9liuv9kf7RKLMK/kFf8eAgqpuPCklZH7e+iFxtELcdQveAoPkFK2GGxOpZHu5GnP1KVo38QCq/n3v4JvTnuxydWAT8IHpJRBYmYADydG8dMeg0gc1IjJmOc8njJRmPbhBVLKSoPNBfRQMgAsT3mVSCtY/sl8pOcSgfBS+IGUsl3McI5jwkNdlLpU1nvDFTrAzQTQ06VQztIBUsqaNaYHuwxuYZNXroB6nEMbN3udjJ8yl1/70gNSyjI1Zj8CKk5AyQS6vtxK9Umvkbov4TYr8aGYZt/44PWSoNIFUqZ5h5jOfBQezlhiFIHFqf4lQAYvUMtZHMiezbd+SK90SVN5ACmzCgRUu9CLgJLug3O4ncbjoOdC7SDIBTirqMsqetJV5QCeTLOXH5AyS5c6jhkB1NncTuTWhZXZhfvDuWnQmwSNTN2Qjcsh+bKNOmeVhqAw8awMIOWy+CBzMr1DF1a8gKsT91xHsmdzuJdzB4cmshu8xWP5rP1Wnic3OecnVXhtIyO0jewk5Gq2yqT/B7txfCObfUxYAAAAAElFTkSuQmCC"
        />
      </defs>
    </svg>
  );
};

export const CWMetaMask = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#E2761B"
        stroke="#E2761B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M29.007 3.493L18.08 11.608l2.02-4.788 8.906-3.327z"
      ></path>
      <path
        fill="#E4761B"
        stroke="#E4761B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.792 3.493l10.838 8.192-1.922-4.865-8.916-3.327zM25.077 22.304l-2.91 4.458 6.226 1.713 1.79-6.073-5.106-.098zM2.636 22.402l1.779 6.073 6.225-1.713-2.91-4.458-5.094.099z"
      ></path>
      <path
        fill="#E4761B"
        stroke="#E4761B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.293 14.769l-1.735 2.624 6.182.275-.22-6.644-4.227 3.745zM22.514 14.771l-4.282-3.82-.143 6.72 6.17-.275-1.745-2.625zM10.644 26.76l3.71-1.812-3.205-2.504-.505 4.316zM18.448 24.948l3.723 1.812-.517-4.316-3.206 2.504z"
      ></path>
      <path
        fill="#D7C1B3"
        stroke="#D7C1B3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22.163 26.764l-3.723-1.812.297 2.427-.033 1.021 3.459-1.636zM10.636 26.764l3.459 1.636-.022-1.021.274-2.427-3.711 1.812z"
      ></path>
      <path
        fill="#342E37"
        stroke="#342E37"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.154 20.841l-3.096-.911 2.185-1 .911 1.911zM18.644 20.841l.91-1.91 2.197.999-3.107.911z"
      ></path>
      <path
        fill="#CD6116"
        stroke="#CD6116"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.64 26.758l.526-4.458-3.437.099 2.91 4.359zM21.644 22.302l.527 4.458 2.91-4.36-3.437-.098zM24.252 17.394l-6.17.274.57 3.173.911-1.91 2.197.999 2.492-2.536zM11.053 19.93l2.196-1 .9 1.911.583-3.173-6.182-.274 2.503 2.536z"
      ></path>
      <path
        fill="#E4751F"
        stroke="#E4751F"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.55 17.395l2.591 5.052-.088-2.515-2.503-2.537zM21.761 19.93l-.11 2.515 2.603-5.051-2.493 2.536zM14.733 17.667l-.582 3.173.725 3.745.165-4.93-.308-1.988zM18.08 17.667l-.296 1.976.132 4.942.736-3.745-.571-3.173z"
      ></path>
      <path
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.653 20.842l-.736 3.744.527.363 3.206-2.504.11-2.514-3.107.911zM11.058 19.93l.088 2.515 3.206 2.504.527-.363-.725-3.744-3.096-.911z"
      ></path>
      <path
        fill="#C0AD9E"
        stroke="#C0AD9E"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.706 28.395l.033-1.021-.274-.242h-4.14l-.252.242.022 1.02-3.46-1.635 1.209.988 2.448 1.702h4.206l2.46-1.702 1.207-.988-3.459 1.636z"
      ></path>
      <path
        fill="#161616"
        stroke="#161616"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.443 24.95l-.527-.363h-3.041l-.527.362-.275 2.427.253-.242h4.14l.274.242-.297-2.427z"
      ></path>
      <path
        fill="#763D16"
        stroke="#763D16"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M29.465 12.135l.933-4.48-1.394-4.162-10.564 7.84 4.063 3.437 5.743 1.68 1.274-1.482-.55-.396.88-.801-.682-.527.879-.67-.582-.44zM2.401 7.655l.934 4.48-.593.439.878.67-.67.527.879.801-.55.396 1.264 1.482 5.742-1.68 4.063-3.437-10.563-7.84L2.4 7.655z"
      ></path>
      <path
        fill="#F6851B"
        stroke="#F6851B"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M28.25 16.45l-5.742-1.68 1.746 2.625-2.603 5.05 3.426-.043h5.106l-1.932-5.951zM10.281 14.77L4.54 16.45l-1.911 5.952h5.095l3.415.044-2.592-5.051 1.735-2.624zM18.079 17.67l.362-6.336 1.669-4.513h-7.412l1.647 4.513.385 6.336.131 1.998.011 4.92h3.042l.022-4.92.143-1.998z"
      ></path>
    </svg>
  );
};

export const CWNearWallet = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#000"
        d="M24.937 3.853l-5.842 8.67c-.404.59.373 1.305.932.808l5.75-5.003c.155-.124.372-.031.372.186v15.632c0 .217-.28.31-.404.155L8.342 3.48c-.559-.684-1.367-1.057-2.268-1.057h-.622C3.836 2.423 2.5 3.76 2.5 5.407v22.002a2.984 2.984 0 005.532 1.554l5.842-8.67c.404-.591-.373-1.306-.932-.809l-5.75 4.973c-.155.124-.372.03-.372-.187V8.67c0-.218.28-.311.404-.156l17.402 20.822a2.921 2.921 0 002.27 1.056h.62A2.984 2.984 0 0030.5 27.41V5.407c-.031-1.647-1.367-2.984-3.014-2.984a2.996 2.996 0 00-2.549 1.43z"
      ></path>
    </svg>
  );
};

export const CWPhantom = (props: CustomIconProps) => {
  const { componentType, ...customIconStyleAttrs } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>(
        { ...customIconStyleAttrs },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
    >
      <g clipPath="url(#clip0_249_13967)">
        <path
          fill="url(#paint0_linear_249_13967)"
          d="M16 30.507c7.732 0 14-6.268 14-14s-6.268-14-14-14-14 6.268-14 14 6.268 14 14 14z"
        ></path>
        <path
          fill="url(#paint1_linear_249_13967)"
          d="M26.19 16.707h-2.503c0-5.064-4.15-9.169-9.268-9.169-5.056 0-9.166 4.005-9.266 8.982-.105 5.144 4.775 9.612 9.976 9.612h.654c4.586 0 10.732-3.551 11.692-7.878.178-.798-.46-1.547-1.285-1.547zm-15.49.225c0 .678-.56 1.231-1.245 1.231a1.241 1.241 0 01-1.244-1.23V14.94c0-.677.56-1.231 1.244-1.231.684 0 1.244.554 1.244 1.23v1.992zm4.32 0c0 .678-.56 1.231-1.244 1.231a1.241 1.241 0 01-1.244-1.23V14.94c0-.677.56-1.231 1.244-1.231.685 0 1.245.554 1.245 1.23v1.992z"
        ></path>
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_249_13967"
          x1="16"
          x2="16"
          y1="2.507"
          y2="30.507"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#534BB1"></stop>
          <stop offset="1" stopColor="#551BF9"></stop>
        </linearGradient>
        <linearGradient
          id="paint1_linear_249_13967"
          x1="16.328"
          x2="16.328"
          y1="7.538"
          y2="26.132"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff"></stop>
          <stop offset="1" stopColor="#fff" stopOpacity="0.82"></stop>
        </linearGradient>
        <clipPath id="clip0_249_13967">
          <path
            fill="#fff"
            d="M0 0H28V28H0z"
            transform="translate(2 2.507)"
          ></path>
        </clipPath>
      </defs>
    </svg>
  );
};

export const CWPolkadot = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#D32D79"
        d="M16 30c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16s6.268 14 14 14z"
      ></path>
      <path
        fill="#fff"
        d="M16 5.94c-4.16 0-7.56 3.38-7.56 7.56 0 .84.14 1.66.4 2.46.18.54.78.84 1.34.66.54-.18.84-.78.66-1.34-.22-.62-.32-1.28-.3-1.94.08-2.82 2.36-5.14 5.18-5.28a5.455 5.455 0 015.74 5.44c0 2.9-2.28 5.28-5.14 5.44 0 0-1.06.06-1.58.14-.26.04-.46.08-.6.1-.06.02-.12-.04-.1-.1l.18-.88.98-4.52c.12-.56-.24-1.12-.8-1.24-.56-.12-1.12.24-1.24.8 0 0-2.36 11-2.38 11.12-.12.56.24 1.12.8 1.24.56.12 1.12-.24 1.24-.8.02-.12.34-1.58.34-1.58a2.657 2.657 0 012.24-2.08c.24-.04 1.18-.1 1.18-.1 3.9-.3 6.98-3.56 6.98-7.54 0-4.18-3.4-7.56-7.56-7.56zm.54 17.4c-.68-.14-1.36.28-1.5.98-.14.68.28 1.36.98 1.5.68.14 1.36-.28 1.5-.98.14-.7-.28-1.36-.98-1.5z"
      ></path>
    </svg>
  );
};

export const CWCoinbase = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 4.800781 16 C 4.800781 22.1875 9.8125 27.199219 16 27.199219 C 22.1875 27.199219 27.199219 22.1875 27.199219 16 C 27.199219 9.8125 22.1875 4.800781 16 4.800781 C 9.8125 4.800781 4.800781 9.8125 4.800781 16 Z M 13.136719 12.390625 C 12.726562 12.390625 12.390625 12.726562 12.390625 13.136719 L 12.390625 18.863281 C 12.390625 19.273438 12.726562 19.609375 13.136719 19.609375 L 18.863281 19.609375 C 19.273438 19.609375 19.609375 19.273438 19.609375 18.863281 L 19.609375 13.136719 C 19.609375 12.726562 19.273438 12.390625 18.863281 12.390625 Z M 13.136719 12.390625 "
      />
    </svg>
  );
};

export const CWTerraStation = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#0E3CA5"
        fillRule="evenodd"
        d="M14.371 24.214c.743 2.834 3.41 4.997 4.756 4.908.047-.003 5.108-.976 7.878-5.747 2.156-3.713 1.422-7.297-1.51-7.375-1.056.079-12.54 2.814-11.124 8.214zm2.547-21.339c-1.91 0-3.722.41-5.362 1.141a7.83 7.83 0 00-.837.411c-.185.1-.371.198-.55.304l.042.014A6.033 6.033 0 008.817 6.07c-3.793 5.021 8.919 8.671 15.714 8.684 3.128 2.249 4.006-6.335.95-8.717a13.108 13.108 0 00-8.563-3.161z"
        clipRule="evenodd"
      ></path>
      <path
        fill="#5493F7"
        fillRule="evenodd"
        d="M12.141 5.819c-1.718 2.524-7.444 4.304-8.386 4.026l-.004-.01.117-.228A13.574 13.574 0 017.95 4.951c.353-.253.718-.489 1.095-.709.8-.454 1.621-.481 1.891-.492 2.55.047 1.218 2.048 1.204 2.069"
        clipRule="evenodd"
      ></path>
      <mask
        id="mask0_238_29603"
        style={{ maskType: 'alpha' }}
        width="9"
        height="19"
        x="2"
        y="11"
        maskUnits="userSpaceOnUse"
      >
        <path fill="#fff" d="M2 11.624h8.75v17.5H2v-17.5z"></path>
      </mask>
      <g mask="url(#mask0_238_29603)">
        <path
          fill="#5493F7"
          fillRule="evenodd"
          d="M10.699 24.737c.128.83-.003 4.108-.176 4.385-.148.008-.457.027-1.35-.468a14.23 14.23 0 01-4.432-3.903A13.792 13.792 0 012 16.474a13.78 13.78 0 01.873-4.85h.002c1.025 1.345 2.21 2.56 3.217 3.918.96 1.292 2.279 3.398 2.547 3.848 1.667 2.794 1.933 4.518 2.06 5.347z"
          clipRule="evenodd"
        ></path>
      </g>
      <path
        fill="#5493F7"
        fillRule="evenodd"
        d="M30 16.63c0 1.792-.341 3.505-.96 5.076-1.622 1.751-12.566-2.557-12.674-2.604-1.496-.658-6.052-2.66-6.463-5.805C9.31 8.773 18.462 5.62 22.483 5.5c.482.005 1.95.022 2.804.72A13.81 13.81 0 0130 16.629v.002zm-9.57 11.19c.655-2.317 6.376-4.69 7.64-4.819.155-.016.221.094.153.22-1.317 2.396-3.268 4.368-5.628 5.647-1.193.579-2.506.157-2.165-1.048z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const CWTerraStation2 = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      transform="scale(0.5)"
      viewBox="0 0 64 64"
      {...otherProps}
    >
      <path fill="#FFF" d="M0 0h64v64H0z" opacity="0" />
      <linearGradient
        id="a"
        x1="43.755"
        x2="43.755"
        y1="605.123"
        y2="575.012"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#4366c2" />
        <stop offset=".15" stopColor="#3458b8" />
        <stop offset=".4" stopColor="#2348ac" />
        <stop offset=".67" stopColor="#193fa5" />
        <stop offset="1" stopColor="#163ca3" />
      </linearGradient>
      <path
        fill="url(#a)"
        d="M27.5 50.9c1.8 6.5 8 11.5 11.2 11.3.1 0 12-2.2 18.6-13.2 5.1-8.5 3.4-16.7-3.6-16.9-2.4.1-29.5 6.4-26.2 18.8"
      />
      <linearGradient
        id="b"
        x1="35.363"
        x2="35.363"
        y1="572.988"
        y2="544.859"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#4366c2" />
        <stop offset=".15" stopColor="#3458b8" />
        <stop offset=".4" stopColor="#2348ac" />
        <stop offset=".67" stopColor="#193fa5" />
        <stop offset="1" stopColor="#163ca3" />
      </linearGradient>
      <path
        fill="url(#b)"
        d="M53.1 9.1c-8.9-7.6-21.3-9.4-32-4.6-.7.3-1.3.6-1.9.9-.4.2-.8.5-1.2.7h.1c-1.3.9-2.4 1.9-3.3 3.1-8.6 11.5 20.5 19.9 36.1 19.9 7.2 5.2 9.2-14.5 2.2-20z"
      />
      <linearGradient
        id="c"
        x1="3.311"
        x2="23.727"
        y1="554.677"
        y2="554.677"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#58c66b" />
        <stop offset="1" stopColor="#5491f6" />
      </linearGradient>
      <path
        fill="url(#c)"
        d="M22.9 9.3c-4 6-17.4 10.3-19.6 9.6l.3-.6c.7-1.5 1.6-2.9 2.6-4.3 2-2.6 4.3-5 7-6.9.8-.6 1.7-1.2 2.5-1.7 1.3-.8 2.9-1.2 4.4-1.2 6 .1 2.8 4.9 2.8 4.9"
      />
      <linearGradient
        id="d"
        x1="0"
        x2="19.717"
        y1="585.099"
        y2="585.099"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#58c66b" />
        <stop offset="1" stopColor="#5491f6" />
      </linearGradient>
      <path
        fill="url(#d)"
        d="M19.6 52c.3 1.9 0 9.4-.4 10-.3 0-1 .1-3-1.1-1.1-.6-2.1-1.3-3.1-2-1.3-1-2.5-2-3.7-3.2-1.2-1.1-2.2-2.4-3.2-3.7-2-2.7-3.5-5.6-4.5-8.8-.5-1.6-1-3.3-1.2-4.9-.6-3.4-.6-7 0-10.4.3-1.7.7-3.3 1.2-4.9.1-.3.2-.6.3-1 2.3 3.1 4.9 5.9 7.2 9s5.1 7.8 5.7 8.8c3.8 6.5 4.4 10.4 4.7 12.2"
      />
      <linearGradient
        id="e"
        x1="17.27"
        x2="64"
        y1="569.606"
        y2="569.606"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#58c66b" />
        <stop offset="1" stopColor="#5491f6" />
      </linearGradient>
      <path
        fill="url(#e)"
        d="M64 33.1c0 4-.8 8-2.2 11.8-3.8 4-29.2-5.9-29.4-6-3.5-1.5-14.1-6.2-15-13.5C16 14.9 37.2 7.6 46.5 7.3c1.1 0 4.5 0 6.5 1.7 7 6.1 11 14.9 11 24.1"
      />
      <linearGradient
        id="f"
        x1="41.637"
        x2="59.921"
        y1="598.293"
        y2="598.293"
        gradientTransform="translate(0 -543)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#58c66b" />
        <stop offset="1" stopColor="#5491f6" />
      </linearGradient>
      <path
        fill="url(#f)"
        d="M46.8 61.6c-2.8 1.3-5.8.4-5-2.4 1.5-5.2 14.8-10.5 17.7-10.8.4 0 .5.2.4.5-3.1 5.4-7.7 9.8-13.1 12.7"
      />
    </svg>
  );
};

export const CWUnreads = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#342E37"
        fillRule="evenodd"
        d="M17.675 5.653a2.247 2.247 0 10-3.55-.057c-4.416.763-7.775 4.59-7.775 9.194v6.417a.585.585 0 01-.587.583H4.588a.585.585 0 00-.588.584v1.166c0 .322.263.584.588.584H13.281a3.456 3.456 0 104.936 0h8.694a.585.585 0 00.588-.584v-1.166a.585.585 0 00-.587-.584h-1.175a.585.585 0 01-.588-.583V14.79c0-4.5-3.207-8.255-7.474-9.137z"
        clipRule="evenodd"
      ></path>
      <circle cx="23.75" cy="9" r="4" fill="#EC79DE"></circle>
    </svg>
  );
};

export const CWWalletConnect = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
      {...otherProps}
    >
      <path
        fill="#3B99FC"
        d="M8.133 10.883c4.567-4.377 11.97-4.377 16.537 0l.755.724a.273.273 0 010 .397l-2.086 2a.3.3 0 01-.413 0l-.756-.726c-3.186-3.053-8.351-3.053-11.537 0l-.81.777a.3.3 0 01-.413 0l-2.086-2a.273.273 0 010-.396l.809-.777zm20.218 3.527l1.879 1.8a.546.546 0 010 .795v.001l-7.544 7.23a.602.602 0 01-.826 0l-5.355-5.133a.15.15 0 00-.207 0l-5.355 5.133a.602.602 0 01-.826 0l-7.544-7.23a.546.546 0 01-.001-.794l.001-.001 1.879-1.8a.3.3 0 01.413 0l5.562 5.33a.15.15 0 00.206 0l5.356-5.133a.601.601 0 01.825 0l5.356 5.133a.15.15 0 00.206 0l5.562-5.33a.3.3 0 01.413 0z"
      ></path>
    </svg>
  );
};

export const CWEmail = (props: CustomIconProps) => {
  const { componentType, iconSize, ...otherProps } = props;
  return (
    <svg
      width="26"
      height="21"
      viewBox="0 0 26 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={getClasses<CustomIconStyleProps>({ iconSize }, componentType)}
      {...otherProps}
    >
      <path
        d="M25 0.549316H1C0.734784 0.549316 0.48043 0.654673 0.292893 0.84221C0.105357 1.02975 0 1.2841 0 1.54932V18.5493C0 19.0798 0.210714 19.5885 0.585786 19.9635C0.960859 20.3386 1.46957 20.5493 2 20.5493H24C24.5304 20.5493 25.0391 20.3386 25.4142 19.9635C25.7893 19.5885 26 19.0798 26 18.5493V1.54932C26 1.2841 25.8946 1.02975 25.7071 0.84221C25.5196 0.654673 25.2652 0.549316 25 0.549316ZM24 18.5493H2V3.82307L12.3237 13.2868C12.5082 13.4562 12.7496 13.5501 13 13.5501C13.2504 13.5501 13.4918 13.4562 13.6763 13.2868L24 3.82307V18.5493Z"
        fill="#141315"
      />
    </svg>
  );
};

export const CWEth = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: CustomIconProps) => {
  return (
    <svg
      {...otherProps}
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M7.99835 0.672501L3.50085 8.13583L7.99835 6.09167V0.672501Z"
        fill="#656167"
      />
      <path
        d="M7.99835 6.09167L3.50085 8.13584L7.99835 10.795V6.09167Z"
        fill="#656167"
      />
      <path
        d="M12.4966 8.13583L7.99829 0.672501V6.09167L12.4966 8.13583Z"
        fill="#656167"
      />
      <path
        d="M7.99829 10.795L12.4966 8.13584L7.99829 6.09167V10.795Z"
        fill="#656167"
      />
      <path
        d="M3.50085 8.98917L7.99835 15.3275V11.6467L3.50085 8.98917Z"
        fill="#656167"
      />
      <path
        d="M7.99829 11.6467V15.3275L12.4991 8.98917L7.99829 11.6467Z"
        fill="#656167"
      />
    </svg>
  );
};

export const CWCosmos = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: CustomIconProps) => {
  return (
    <svg
      {...otherProps}
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.12542 1.38109C8.06198 1.32271 8.02925 1.32161 8.02375 1.32161C8.01825 1.32161 7.98552 1.32271 7.92209 1.38109C7.85698 1.441 7.77916 1.54439 7.6953 1.70391C7.52791 2.0223 7.36772 2.50355 7.22963 3.12452C7.07436 3.82283 6.95167 4.67636 6.87427 5.63181C7.24813 5.81272 7.63258 6.00937 8.02366 6.22055C8.4148 6.00934 8.79931 5.81266 9.17323 5.63172C9.09583 4.67631 8.97314 3.82281 8.81788 3.12452C8.6798 2.50355 8.51959 2.0223 8.35222 1.70391C8.26836 1.54439 8.19053 1.441 8.12542 1.38109ZM7.69645 6.39978C7.40925 6.24717 7.1263 6.10281 6.84925 5.96719C6.82825 6.27478 6.81189 6.59184 6.80053 6.91672C6.94706 6.82897 7.09573 6.74156 7.24641 6.65462C7.39708 6.56769 7.54716 6.48272 7.69645 6.39978ZM6.57264 5.4882C6.79702 2.86819 7.36211 1.00911 8.02375 1.00911C8.68539 1.00911 9.25048 2.86814 9.47486 5.48812C11.8574 4.37236 13.7509 3.93195 14.0817 4.50459C14.4125 5.07723 13.0841 6.49583 10.9259 8C13.0841 9.50417 14.4125 10.9228 14.0817 11.4954C13.7509 12.068 11.8574 11.6276 9.47486 10.5119C9.25048 13.1319 8.68539 14.9909 8.02375 14.9909C7.36211 14.9909 6.79702 13.1318 6.57264 10.5118C4.19003 11.6276 2.29644 12.0681 1.96561 11.4954C1.63478 10.9228 2.9632 9.50417 5.12139 8C2.9632 6.49583 1.63478 5.07725 1.96561 4.50459C2.29644 3.93194 4.19003 4.37239 6.57264 5.4882ZM5.39677 7.81069C4.60744 7.26592 3.92908 6.73292 3.40155 6.24934C2.93245 5.81934 2.59552 5.44005 2.40328 5.13598C2.30698 4.98364 2.25633 4.86459 2.23697 4.77833C2.21811 4.69431 2.23352 4.66555 2.2362 4.66092C2.23889 4.65625 2.25619 4.62847 2.33851 4.60275C2.42303 4.57634 2.55158 4.56067 2.73178 4.56784C3.09144 4.58217 3.58862 4.68416 4.1958 4.87514C4.87859 5.08992 5.67959 5.4105 6.54627 5.82123C6.51611 6.23519 6.49431 6.6662 6.48177 7.11019C6.10317 7.34311 5.7405 7.57753 5.39677 7.81069ZM5.39677 8.18931C4.60744 8.73408 3.92908 9.26708 3.40155 9.75066C2.93245 10.1807 2.59552 10.56 2.40328 10.864C2.30698 11.0164 2.25633 11.1354 2.23697 11.2217C2.21811 11.3057 2.23352 11.3345 2.2362 11.3391C2.23887 11.3437 2.25616 11.3715 2.33851 11.3973C2.42303 11.4237 2.55158 11.4393 2.73178 11.4322C3.09144 11.4178 3.58862 11.3158 4.1958 11.1248C4.87859 10.9101 5.67959 10.5895 6.54627 10.1788C6.51611 9.7648 6.49431 9.3338 6.48177 8.8898C6.10317 8.65689 5.7405 8.42247 5.39677 8.18931ZM6.47348 8.51702C6.19758 8.34472 5.93097 8.172 5.67486 8C5.93097 7.828 6.19758 7.65528 6.47348 7.48298C6.4707 7.6537 6.4693 7.82611 6.4693 8C6.4693 8.17389 6.4707 8.3463 6.47348 8.51702ZM6.78983 8.71187C6.78452 8.47798 6.7818 8.2405 6.7818 8C6.7818 7.7595 6.78452 7.52202 6.78983 7.28813C6.98983 7.16659 7.19422 7.04552 7.40258 6.9253C7.61105 6.80502 7.81827 6.68861 8.02366 6.57623C8.22905 6.68861 8.43627 6.80502 8.64472 6.9253C8.85316 7.04556 9.05763 7.16669 9.25767 7.28825C9.26299 7.52209 9.26572 7.75955 9.26572 8C9.26572 8.24045 9.26299 8.47791 9.25767 8.71175C9.05763 8.83331 8.85316 8.95444 8.64472 9.0747C8.43627 9.19498 8.22905 9.31139 8.02366 9.42377C7.81827 9.31139 7.61105 9.19498 7.40259 9.0747C7.19422 8.95448 6.98983 8.83341 6.78983 8.71187ZM6.80053 9.08328C6.81189 9.40816 6.82825 9.72522 6.84925 10.0328C7.1263 9.89719 7.40925 9.75281 7.69645 9.60022C7.54716 9.51728 7.39708 9.43231 7.24641 9.34538C7.09573 9.25844 6.94706 9.17103 6.80053 9.08328ZM8.02366 9.77945C7.63258 9.99063 7.24813 10.1873 6.87427 10.3682C6.95167 11.3236 7.07436 12.1772 7.22963 12.8755C7.36772 13.4965 7.52791 13.9777 7.6953 14.2961C7.77916 14.4556 7.85698 14.559 7.92209 14.6189C7.98552 14.6773 8.01825 14.6784 8.02375 14.6784C8.02925 14.6784 8.06198 14.6773 8.12542 14.6189C8.19053 14.559 8.26836 14.4556 8.35222 14.2961C8.51959 13.9777 8.6798 13.4965 8.81788 12.8755C8.97314 12.1772 9.09583 11.3237 9.17323 10.3683C8.79931 10.1873 8.4148 9.99066 8.02366 9.77945ZM9.50123 10.1789C10.3678 10.5895 11.1688 10.9101 11.8515 11.1248C12.4587 11.3158 12.9559 11.4178 13.3155 11.4322C13.4957 11.4393 13.6243 11.4237 13.7088 11.3973C13.7912 11.3715 13.8084 11.3437 13.8111 11.3391C13.8138 11.3345 13.8292 11.3057 13.8103 11.2217C13.791 11.1354 13.7403 11.0164 13.644 10.864C13.4518 10.56 13.1149 10.1807 12.6458 9.75066C12.1182 9.26708 11.4399 8.73408 10.6505 8.18931C10.3069 8.42242 9.94425 8.65681 9.56575 8.88967C9.5532 9.33375 9.53141 9.76483 9.50123 10.1789ZM10.6505 7.81069C11.4399 7.26592 12.1182 6.73292 12.6458 6.24934C13.1149 5.81934 13.4518 5.44005 13.644 5.13598C13.7403 4.98364 13.791 4.86459 13.8103 4.77833C13.8292 4.69428 13.8138 4.66553 13.8111 4.66092C13.8084 4.65627 13.7912 4.62848 13.7088 4.60275C13.6243 4.57634 13.4957 4.56067 13.3155 4.56784C12.9559 4.58217 12.4587 4.68416 11.8515 4.87514C11.1688 5.08991 10.3678 5.41045 9.50123 5.82114C9.53141 6.23517 9.5532 6.66625 9.56575 7.11031C9.94425 7.34319 10.3069 7.57758 10.6505 7.81069ZM9.57403 7.48311C9.84986 7.65536 10.1164 7.82805 10.3724 8C10.1164 8.17195 9.84986 8.34464 9.57403 8.51689C9.5768 8.34622 9.57822 8.17384 9.57822 8C9.57822 7.82616 9.5768 7.65378 9.57403 7.48311ZM9.24698 6.91684C9.23563 6.59189 9.21925 6.27477 9.19825 5.96709C8.92114 6.10275 8.63813 6.24714 8.35086 6.39978C8.50016 6.48272 8.65024 6.56769 8.80089 6.65462C8.95164 6.74159 9.10039 6.82905 9.24698 6.91684ZM9.19825 10.0329C8.92114 9.89725 8.63813 9.75286 8.35086 9.60022C8.50016 9.51728 8.65024 9.43231 8.80089 9.34538C8.95164 9.25841 9.10039 9.17095 9.24698 9.08316C9.23563 9.40811 9.21925 9.72523 9.19825 10.0329Z"
        fill="#656167"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.55544 6.04224C3.82695 6.04224 4.04705 6.26244 4.04705 6.53406C4.04705 6.8057 3.82695 7.02591 3.55544 7.02591C3.28394 7.02591 3.06384 6.8057 3.06384 6.53406C3.06384 6.26244 3.28394 6.04224 3.55544 6.04224Z"
        fill="#656167"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.3686 4.35797C11.6402 4.35797 11.8604 4.57817 11.8604 4.84981C11.8604 5.12145 11.6402 5.34166 11.3686 5.34166C11.0969 5.34166 10.8767 5.12145 10.8767 4.84981C10.8767 4.57817 11.0969 4.35797 11.3686 4.35797Z"
        fill="#656167"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.0331 12.0777C7.30474 12.0777 7.52495 12.2978 7.52495 12.5693C7.52495 12.8408 7.30474 13.0609 7.0331 13.0609C6.76146 13.0609 6.54126 12.8408 6.54126 12.5693C6.54126 12.2978 6.76146 12.0777 7.0331 12.0777Z"
        fill="#656167"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.99635 7.16364C8.45624 7.16364 8.82906 7.53647 8.82906 7.99636C8.82906 8.45625 8.45624 8.82906 7.99635 8.82906C7.53646 8.82906 7.16364 8.45625 7.16364 7.99636C7.16364 7.53647 7.53646 7.16364 7.99635 7.16364Z"
        fill="#656167"
      />
    </svg>
  );
};

export const CWNearIcon = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: CustomIconProps) => {
  return (
    <svg
      {...otherProps}
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
    >
      <g clipPath="url(#clip0_2008_2776)">
        <path
          d="M10.6745 0.0469208C10.2301 0.0469208 9.81746 0.277342 9.58465 0.656135L7.07634 4.38013C6.99463 4.50286 7.0278 4.66833 7.15053 4.75004C7.25001 4.81636 7.38163 4.80816 7.47223 4.73021L9.94122 2.58873C9.98224 2.55181 10.0455 2.55557 10.0824 2.59659C10.0992 2.6154 10.108 2.63967 10.108 2.66463V9.3694C10.108 9.42478 10.0633 9.46922 10.0079 9.46922C9.97814 9.46922 9.9501 9.45623 9.9313 9.43333L2.46793 0.499558C2.22485 0.212728 1.86794 0.0472626 1.49223 0.0469208H1.23138C0.525416 0.0469208 -0.046875 0.619213 -0.046875 1.32518V10.7683C-0.046875 11.4743 0.525416 12.0466 1.23138 12.0466C1.67581 12.0466 2.08845 11.8162 2.32126 11.4374L4.82957 7.71337C4.91127 7.59064 4.87811 7.42518 4.75538 7.34347C4.6559 7.27715 4.52428 7.28535 4.43368 7.3633L1.96469 9.50478C1.92367 9.5417 1.86042 9.53794 1.8235 9.49691C1.80675 9.47811 1.79786 9.45384 1.7982 9.42888V2.7224C1.7982 2.66702 1.84299 2.62258 1.89837 2.62258C1.92777 2.62258 1.95614 2.63557 1.97495 2.65847L9.4373 11.594C9.68037 11.8808 10.0373 12.0462 10.413 12.0466H10.6738C11.3798 12.0469 11.9524 11.475 11.9531 10.769V1.32518C11.9531 0.619213 11.3808 0.0469208 10.6749 0.0469208H10.6745Z"
          fill="#656167"
        />
      </g>
      <defs>
        <clipPath id="clip0_2008_2776">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const CWDiscord = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: CustomIconProps) => {
  return (
    <svg
      {...otherProps}
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.4562 10.6125L13.3312 3.5375C13.2904 3.3944 13.2173 3.26256 13.1177 3.15206C13.018 3.04156 12.8944 2.95533 12.7562 2.9H12.7187L12.7562 2.8875C12.059 2.60812 11.3371 2.39469 10.6 2.25C10.5355 2.23726 10.4692 2.23735 10.4048 2.25024C10.3404 2.26314 10.2792 2.2886 10.2247 2.32516C10.1701 2.36173 10.1233 2.40869 10.0869 2.46335C10.0505 2.51801 10.0252 2.57931 10.0125 2.64375C9.99881 2.70781 9.99802 2.77394 10.0102 2.83831C10.0223 2.90267 10.0471 2.96398 10.0832 3.01865C10.1193 3.07333 10.1658 3.12029 10.2202 3.15679C10.2746 3.19328 10.3357 3.2186 10.4 3.23125C10.6812 3.2875 10.9562 3.35625 11.225 3.43125C11.324 3.48263 11.4029 3.56563 11.4493 3.66705C11.4957 3.76847 11.5069 3.8825 11.481 3.99098C11.4551 4.09947 11.3937 4.1962 11.3066 4.26578C11.2194 4.33536 11.1115 4.37381 11 4.375H10.95C9.98683 4.12382 8.99534 3.99778 7.99998 4C7.02801 3.9971 6.05969 4.11893 5.11873 4.3625C4.99899 4.39409 4.87179 4.38013 4.76176 4.32331C4.65173 4.26649 4.5667 4.17087 4.52313 4.05495C4.47957 3.93903 4.48057 3.81107 4.52594 3.69585C4.57131 3.58063 4.65783 3.48634 4.76873 3.43125H4.77498C5.04373 3.35625 5.31873 3.2875 5.59998 3.23125C5.66442 3.21854 5.72572 3.19326 5.78038 3.15685C5.83504 3.12045 5.882 3.07363 5.91856 3.01907C5.95513 2.96451 5.98059 2.90329 5.99348 2.83889C6.00638 2.77449 6.00646 2.70818 5.99373 2.64375C5.96657 2.51442 5.88991 2.40084 5.78014 2.32727C5.67036 2.2537 5.53617 2.22597 5.40623 2.25C4.6665 2.39792 3.94243 2.61556 3.24373 2.9C3.10559 2.95533 2.98196 3.04156 2.88229 3.15206C2.78262 3.26256 2.70957 3.3944 2.66873 3.5375L0.54373 10.6125C0.488603 10.7975 0.488185 10.9944 0.542527 11.1797C0.596869 11.3649 0.703649 11.5304 0.84998 11.6562C0.907475 11.7116 0.967984 11.7638 1.03123 11.8125H1.03748C2.04998 12.6375 3.38123 13.2687 4.88123 13.6312C4.91962 13.6435 4.95967 13.6499 4.99998 13.65C5.1236 13.652 5.24356 13.608 5.33671 13.5267C5.42985 13.4454 5.48957 13.3325 5.50433 13.2098C5.51909 13.087 5.48785 12.9631 5.41663 12.8621C5.34542 12.761 5.23929 12.6899 5.11873 12.6625C4.44439 12.4996 3.78879 12.2671 3.16248 11.9687C3.07676 11.8884 3.02206 11.7805 3.00797 11.6639C2.99388 11.5472 3.0213 11.4294 3.08542 11.331C3.14955 11.2325 3.24628 11.1598 3.35866 11.1256C3.47103 11.0914 3.59187 11.0978 3.69998 11.1437C4.88748 11.6687 6.38123 12 7.99998 12C9.61873 12 11.1125 11.6687 12.3 11.1437C12.4081 11.0978 12.5289 11.0914 12.6413 11.1256C12.7537 11.1598 12.8504 11.2325 12.9145 11.331C12.9787 11.4294 13.0061 11.5472 12.992 11.6639C12.9779 11.7805 12.9232 11.8884 12.8375 11.9687C12.2112 12.2671 11.5556 12.4996 10.8812 12.6625C10.7607 12.6899 10.6545 12.761 10.5833 12.8621C10.5121 12.9631 10.4809 13.087 10.4956 13.2098C10.5104 13.3325 10.5701 13.4454 10.6633 13.5267C10.7564 13.608 10.8764 13.652 11 13.65C11.0403 13.6499 11.0803 13.6435 11.1187 13.6312C12.6187 13.2687 13.95 12.6375 14.9625 11.8125H14.9687C15.032 11.7638 15.0925 11.7116 15.15 11.6562C15.2963 11.5304 15.4031 11.3649 15.4574 11.1797C15.5118 10.9944 15.5114 10.7975 15.4562 10.6125ZM5.99998 9.75C5.85164 9.75 5.70664 9.70601 5.5833 9.6236C5.45997 9.54119 5.36384 9.42406 5.30707 9.28701C5.2503 9.14997 5.23545 8.99917 5.26439 8.85368C5.29333 8.7082 5.36476 8.57456 5.46965 8.46967C5.57454 8.36478 5.70818 8.29335 5.85366 8.26441C5.99915 8.23547 6.14995 8.25032 6.28699 8.30709C6.42404 8.36385 6.54117 8.45998 6.62358 8.58332C6.70599 8.70666 6.74998 8.85166 6.74998 9C6.74998 9.19891 6.67096 9.38968 6.53031 9.53033C6.38966 9.67098 6.19889 9.75 5.99998 9.75ZM9.99998 9.75C9.85164 9.75 9.70664 9.70601 9.5833 9.6236C9.45997 9.54119 9.36384 9.42406 9.30707 9.28701C9.25031 9.14997 9.23545 8.99917 9.26439 8.85368C9.29333 8.7082 9.36476 8.57456 9.46965 8.46967C9.57454 8.36478 9.70818 8.29335 9.85366 8.26441C9.99915 8.23547 10.1499 8.25032 10.287 8.30709C10.424 8.36385 10.5412 8.45998 10.6236 8.58332C10.706 8.70666 10.75 8.85166 10.75 9C10.75 9.19891 10.671 9.38968 10.5303 9.53033C10.3897 9.67098 10.1989 9.75 9.99998 9.75Z"
        fill="#656167"
      />
    </svg>
  );
};

export const CWGithub = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: CustomIconProps) => {
  return (
    <svg
      {...otherProps}
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 14C14 14.1326 13.9473 14.2598 13.8536 14.3536C13.7598 14.4473 13.6326 14.5 13.5 14.5C12.9701 14.4984 12.4623 14.2871 12.0876 13.9124C11.7129 13.5377 11.5016 13.0299 11.5 12.5V12C11.5 11.7348 11.3946 11.4804 11.2071 11.2929C11.0196 11.1054 10.7652 11 10.5 11H9.75V13.5C9.75 13.7652 9.85536 14.0196 10.0429 14.2071C10.2304 14.3946 10.4848 14.5 10.75 14.5C10.8826 14.5 11.0098 14.5527 11.1036 14.6464C11.1973 14.7402 11.25 14.8674 11.25 15C11.25 15.1326 11.1973 15.2598 11.1036 15.3536C11.0098 15.4473 10.8826 15.5 10.75 15.5C10.2201 15.4984 9.71232 15.2871 9.33761 14.9124C8.96289 14.5377 8.75165 14.0299 8.75 13.5V11H7.25V13.5C7.24835 14.0299 7.03711 14.5377 6.66239 14.9124C6.28768 15.2871 5.77993 15.4984 5.25 15.5C5.11739 15.5 4.99021 15.4473 4.89645 15.3536C4.80268 15.2598 4.75 15.1326 4.75 15C4.75 14.8674 4.80268 14.7402 4.89645 14.6464C4.99021 14.5527 5.11739 14.5 5.25 14.5C5.51522 14.5 5.76957 14.3946 5.95711 14.2071C6.14464 14.0196 6.25 13.7652 6.25 13.5V11H5.5C5.23478 11 4.98043 11.1054 4.79289 11.2929C4.60536 11.4804 4.5 11.7348 4.5 12V12.5C4.49835 13.0299 4.28711 13.5377 3.91239 13.9124C3.53768 14.2871 3.02993 14.4984 2.5 14.5C2.36739 14.5 2.24021 14.4473 2.14645 14.3536C2.05268 14.2598 2 14.1326 2 14C2 13.8674 2.05268 13.7402 2.14645 13.6464C2.24021 13.5527 2.36739 13.5 2.5 13.5C2.76522 13.5 3.01957 13.3946 3.20711 13.2071C3.39464 13.0196 3.5 12.7652 3.5 12.5V12C3.50041 11.6637 3.58533 11.333 3.74697 11.0381C3.9086 10.7432 4.14175 10.4937 4.425 10.3125C3.98329 9.98855 3.6241 9.56511 3.37653 9.07648C3.12895 8.58785 2.99996 8.04777 3 7.5V7C3.00624 6.37892 3.17195 5.76987 3.48125 5.23125C3.32888 4.73791 3.28021 4.21839 3.33829 3.70534C3.39637 3.19228 3.55995 2.69679 3.81875 2.25C3.86149 2.17338 3.92411 2.10971 4.00001 2.06571C4.07591 2.02171 4.16227 1.99901 4.25 2C4.83243 1.99854 5.40711 2.13344 5.92805 2.39391C6.44899 2.65438 6.90172 3.03318 7.25 3.5H8.75C9.09828 3.03318 9.55101 2.65438 10.072 2.39391C10.5929 2.13344 11.1676 1.99854 11.75 2C11.8377 1.99901 11.9241 2.02171 12 2.06571C12.0759 2.10971 12.1385 2.17338 12.1812 2.25C12.44 2.69679 12.6036 3.19228 12.6617 3.70534C12.7198 4.21839 12.6711 4.73791 12.5188 5.23125C12.828 5.76987 12.9938 6.37892 13 7V7.5C13 8.04777 12.871 8.58785 12.6235 9.07648C12.3759 9.56511 12.0167 9.98855 11.575 10.3125C11.8582 10.4937 12.0914 10.7432 12.253 11.0381C12.4147 11.333 12.4996 11.6637 12.5 12V12.5C12.5 12.7652 12.6054 13.0196 12.7929 13.2071C12.9804 13.3946 13.2348 13.5 13.5 13.5C13.6326 13.5 13.7598 13.5527 13.8536 13.6464C13.9473 13.7402 14 13.8674 14 14Z"
        fill="#656167"
      />
    </svg>
  );
};

export const CWTwitter = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: CustomIconProps) => {
  return (
    <svg
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        d="M15.3563 4.85625L13.4688 6.7375C13.0938 11.1062 9.40629 14.5 5.00004 14.5C4.09379 14.5 3.34379 14.3562 2.77504 14.075C2.31879 13.8437 2.13129 13.6 2.08129 13.525C2.03993 13.4622 2.01327 13.3908 2.00331 13.3162C1.99335 13.2417 2.00035 13.1658 2.02377 13.0943C2.0472 13.0228 2.08646 12.9576 2.13862 12.9034C2.19079 12.8491 2.25451 12.8074 2.32504 12.7812C2.33754 12.775 3.81254 12.2125 4.76879 11.1312C4.17576 10.709 3.65451 10.1941 3.22504 9.60625C2.36879 8.44375 1.46254 6.425 2.00629 3.4125C2.02339 3.32294 2.06435 3.23966 2.12486 3.17145C2.18536 3.10325 2.26316 3.05265 2.35004 3.025C2.4372 2.99646 2.53053 2.99244 2.61982 3.01339C2.70911 3.03433 2.79092 3.07943 2.85629 3.14375C2.87504 3.16875 4.95629 5.21875 7.50004 5.88125V5.5C7.5025 5.10357 7.58301 4.7115 7.73699 4.34619C7.89097 3.98088 8.1154 3.64947 8.39746 3.37089C8.67952 3.09232 9.01369 2.87202 9.38088 2.7226C9.74808 2.57317 10.1411 2.49753 10.5375 2.5C11.0578 2.50742 11.5674 2.64949 12.0164 2.91236C12.4655 3.17523 12.8388 3.54995 13.1 4H15C15.0988 3.99969 15.1954 4.02861 15.2777 4.08311C15.36 4.1376 15.4243 4.21525 15.4625 4.30625C15.4986 4.3986 15.5077 4.49927 15.4889 4.5966C15.4701 4.69393 15.4241 4.78395 15.3563 4.85625Z"
        fill="#656167"
      />
    </svg>
  );
};

export const CWEnvelop = ({
  componentType,
  iconSize,
  className,
  ...otherProps
}: CustomIconProps) => {
  return (
    <svg
      className={getClasses<CustomIconStyleProps>(
        { iconSize, className },
        componentType
      )}
      {...otherProps}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 3.5H14V12C14 12.1326 13.9473 12.2598 13.8536 12.3536C13.7598 12.4473 13.6326 12.5 13.5 12.5H2.5C2.36739 12.5 2.24021 12.4473 2.14645 12.3536C2.05268 12.2598 2 12.1326 2 12V3.5Z"
        stroke="#656167"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 3.5L8 9L2 3.5"
        stroke="#656167"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
