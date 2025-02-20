export function useDarkMode(): boolean {
  return localStorage.getItem('user-dark-mode-state') === 'on';
}
