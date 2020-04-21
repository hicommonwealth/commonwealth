(global as any).window = {};
(global as any).document = undefined;
(global as any).requestAnimationFrame = undefined;

const setGlobals = () => {
  console.dir('setting global');
};

export default setGlobals;
