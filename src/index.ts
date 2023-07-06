import {HttpEchoServer} from './HttpEchoServer';
import {HttpsEchoServer} from './HttpsEchoServer';

const httpServer = new HttpEchoServer();
const httpsServer = new HttpsEchoServer();
httpServer.start();
httpsServer.start();
