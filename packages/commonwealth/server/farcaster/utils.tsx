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

export const circleXIcon =
  // eslint-disable-next-line max-len
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iI2ZmNTIxZCIgdmlld0JveD0iMCAwIDI1NiAyNTYiPjxwYXRoIGQ9Ik0xMjgsMjRBMTA0LDEwNCwwLDEsMCwyMzIsMTI4LDEwNC4xMSwxMDQuMTEsMCwwLDAsMTI4LDI0Wm0zNy42NiwxMzAuMzRhOCw4LDAsMCwxLTExLjMyLDExLjMyTDEyOCwxMzkuMzFsLTI2LjM0LDI2LjM1YTgsOCwwLDAsMS0xMS4zMi0xMS4zMkwxMTYuNjksMTI4LDkwLjM0LDEwMS42NmE4LDgsMCwwLDEsMTEuMzItMTEuMzJMMTI4LDExNi42OWwyNi4zNC0yNi4zNWE4LDgsMCwwLDEsMTEuMzIsMTEuMzJMMTM5LjMxLDEyOFoiPjwvcGF0aD48L3N2Zz4=';

export const circleCheckIcon =
  // eslint-disable-next-line max-len
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iIzliYzU0ZiIgdmlld0JveD0iMCAwIDI1NiAyNTYiPjxwYXRoIGQ9Ik0xMjgsMjRBMTA0LDEwNCwwLDEsMCwyMzIsMTI4LDEwNC4xMSwxMDQuMTEsMCwwLDAsMTI4LDI0Wm00NS42Niw4NS42Ni01Niw1NmE4LDgsMCwwLDEtMTEuMzIsMGwtMjQtMjRhOCw4LDAsMCwxLDExLjMyLTExLjMyTDExMiwxNDguNjlsNTAuMzQtNTAuMzVhOCw4LDAsMCwxLDExLjMyLDExLjMyWiI+PC9wYXRoPjwvc3ZnPg==';

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
