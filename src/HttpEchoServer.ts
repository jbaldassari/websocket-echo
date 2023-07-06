import {Server as HttpServer, createServer as createHttpServer} from 'http';
import {EchoServer, EchoServerOptions} from './EchoServer';

const DefaultHttpPort = 8080;
const HttpPortEnvironmentVariable = 'HTTP_PORT';

export class HttpEchoServer extends EchoServer<HttpServer> {
  constructor(options?: EchoServerOptions) {
    super(createHttpServer, {
      port: options?.port ?? Number.parseInt(process.env[HttpPortEnvironmentVariable] ?? `${DefaultHttpPort}`),
    });
  }

  name(): string {
    return 'HTTP Server';
  }
}
