import React from 'react';

// This might not be needed in the future but for now reduces the amount of boilerplate
export const CardWithText = ({
  text,
  color,
  element,
}: {
  text?: string;
  color?: string;
  element?: React.ReactNode;
}) => {
  return (
    <div
      style={{
        alignItems: 'center',
        background: color || 'black',
        backgroundSize: '100% 100%',
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        height: '100%',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 60,
          fontStyle: 'normal',
          letterSpacing: '-0.025em',
          lineHeight: 1.4,
          marginTop: 30,
          padding: '0 120px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {element || text}
      </div>
    </div>
  );
};

export const circleCheckIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100"
    height="100"
    fill="#9ac54f"
    viewBox="0 0 256 256"
  >
    {/* eslint-disable-next-line max-len */}
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path>
  </svg>
);

export const circleXIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100"
    height="100"
    fill="#ff521d"
    viewBox="0 0 256 256"
  >
    {/* eslint-disable-next-line max-len */}
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
  </svg>
);

export const fakeApiCall = async ({
  result,
  error,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!error) {
        return resolve(result);
      }

      if (Math.random() > 0.5) {
        return resolve(result);
      } else {
        return reject(error);
      }
    }, 1000);
  });
};

export const getLeaderboard = () => {
  const sortedList = Array.from({ length: 10 }, (_, index) => ({
    nickname: `Author${index + 1}`,
    text: `This is entry text ${index + 1}`,
    likes: Math.floor(Math.random() * 100),
  }))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  return fakeApiCall({ result: sortedList });
};

export const getRandomColor = () =>
  Math.floor(Math.random() * 16777215).toString(16);

export const getInvertedColor = (randomColor: string) =>
  (parseInt(randomColor, 16) ^ 16777215).toString(16);
