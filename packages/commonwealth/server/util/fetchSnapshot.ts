export default async function fetchSnapshotProposal(id: string) {
  const res = await fetch(`https://hub.snapshot.org/api/${id}`);
  const data = await res.json();
  return data;
}
