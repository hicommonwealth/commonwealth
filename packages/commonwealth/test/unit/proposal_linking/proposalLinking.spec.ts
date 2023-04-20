import ThreadsController from "client/scripts/controllers/server/threads";
import { assert, expect } from 'chai';
import { linkSource, link } from "server/models/thread";

const thread = ThreadsController.Instance;
//Do some setup to create a thread
describe('Proposal Linking ThreadsController', () => {
    it('Should add links', async () => {
      const newLinks = [
        {source: linkSource.Snapshot, identifier: '0x123'},
        {source: linkSource.Proposal, identifier: '1'}
    ]
    const response = await thread.addLinks({threadId: 2, links: newLinks})
    assert.equal(response.links as link[], newLinks)
    });

    it('Should delete links', async () => {
        const linkToRemove = [{source: linkSource.Snapshot, identifier: '0x123'}]
        const response = await thread.deleteLinks({threadId: 2, links: linkToRemove})
        const filteredLinks = response.links.filter((item) => {
            return item.source == linkToRemove[0].source && item.source == linkToRemove[0].identifier
        })
        assert.equal(filteredLinks.length, 0);
    })

    it('should getLinks For Thread', async () => {
        const response = thread.getLinksForThread({threadId: 2, linkType: linkSource.Proposal})
        assert.equal(response[0], 'proposal/1')
    })

    it('should get ThreadsForLink', async () => {
        const threadInst = thread.getById(2)
        const threadsLinked = await thread.getThreadsForLink({link: {source: linkSource.Proposal, identifier: '1'}})
        assert.equal(threadsLinked[0], threadInst)
    })
    
  });