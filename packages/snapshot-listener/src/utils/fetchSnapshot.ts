import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export default async function fetchNewSnapshotProposal(id: string) {
  try {
    const environment = process.env.NODE_ENV || "development";

    if (environment === "development") {
      console.log("development");
      const dummyProposal = {
        data: {
          proposal: {
            id: "proposal/0x1234",
            title: "Dummy Proposal",
            body: "This is a dummy proposal",
            choices: ["Yes", "No"],
            space: "dummy-space.eth",
            start: "2021-01-01T00:00:00.000Z", // TODO: is this the format we get back?
            end: "2021-01-01T00:00:00.000Z",
          },
        },
      };

      return dummyProposal;
    }

    const response = await fetch("https://hub.snapshot.org/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `
         query($id: String!) {
            proposal(id: $id) {
            id
            title
            body
            start
            end
            space {
              name
              id
            }
          }
        }`,
        variables: { id },
      }),
    });

    const proposal = await response.json();
    proposal.expire = proposal.end;

    return proposal;
  } catch (err) {
    console.log(err);
    return err;
  }
}
