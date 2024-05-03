export const setDarkMode = (state: boolean) => {
  const stateStr = state ? 'on' : 'off';
  localStorage.setItem('dark-mode-state', stateStr);
  state
    ? document.getElementsByTagName('html')[0].classList.add('invert')
    : document.getElementsByTagName('html')[0].classList.remove('invert');

  const event = new StorageEvent('storage');
  window.dispatchEvent(event);
};
