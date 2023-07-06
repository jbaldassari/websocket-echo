import {Server} from './server';

describe('server', () => {
  it('starts and stops', async () => {
    const server = new Server(0);
    await server.start();
    await server.stop();
  });
});
