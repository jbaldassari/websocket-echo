import {HttpsEchoServer} from './HttpsEchoServer';

describe('HttpsEchoServer', () => {
  it('starts and stops', async () => {
    const server = new HttpsEchoServer({port: 0});
    try {
      await server.start();
    } finally {
      await server.stop();
    }
  });
});
