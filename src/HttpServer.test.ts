import {HttpEchoServer} from './HttpEchoServer';

describe('HttpEchoServer', () => {
  it('starts and stops', async () => {
    const server = new HttpEchoServer({port: 0});
    try {
      await server.start();
    } finally {
      await server.stop();
    }
  });
});
