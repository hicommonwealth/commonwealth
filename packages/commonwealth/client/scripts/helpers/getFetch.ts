export default async function getFetch(
  url: string,
  queryParams?: { [key: string]: any }
) {
  let queryUrl;
  if (queryParams) queryUrl = url + '?' + new URLSearchParams(queryParams);
  try {
    const response = await fetch(queryUrl || url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const { result } = await response.json();
      return result;
    } else {
      console.error(`Fetch to ${queryUrl} failed, `, response);
    }
  } catch (e) {
    console.error(e);
  }
}
