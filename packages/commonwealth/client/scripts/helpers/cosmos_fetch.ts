export default function cosmosFetch(url: string, options: any = {}) {
  options.method = 'GET';
  const { headers = {}, ...rest } = options;
  return fetch(url, {
    ...rest,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}
