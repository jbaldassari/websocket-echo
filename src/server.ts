import {readFileSync, statSync} from 'fs';
import {Server as HttpServer, createServer} from 'http';
import {AddressInfo} from 'net';
import path from 'path';
import {WebSocketServer} from 'ws';

const DefaultAddress = 'localhost';
const AddressEnvironmentVariable = 'ADDRESS';
const DefaultPort = 8080;
const PortEnvironmentVariable = 'PORT';

const StaticDirectory = 'static';
const StaticFile = 'index.html';

const ContentTypeHeader = 'Content-Type';

export class Server {
  private readonly httpServer: HttpServer;
  private readonly webSocketServer: WebSocketServer;

  constructor(
    readonly port: number = Number.parseInt(process.env[PortEnvironmentVariable] ?? `${DefaultPort}`),
    readonly address: string = process.env[AddressEnvironmentVariable] ?? DefaultAddress,
  ) {
    this.httpServer = createServer((request, response) => {
      if (request.method !== 'GET') {
        response.writeHead(405, {[ContentTypeHeader]: 'text/plain'});
        response.end('Try GET /');
        return;
      }

      const filePath = path.join(__dirname, StaticDirectory, StaticFile);
      const fileStat = statSync(filePath, {throwIfNoEntry: false});
      if (fileStat?.isFile()) {
        response.writeHead(200, {'Content-Length': fileStat.size, [ContentTypeHeader]: 'text/html'});
        const file = readFileSync(filePath);
        response.write(file);
      } else {
        response.writeHead(404);
      }
      response.end();
    });

    this.webSocketServer = new WebSocketServer({server: this.httpServer});
    this.webSocketServer.on('connection', (ws) => {
      Server.log('[WebSocket connection opened]');

      ws.on('close', () => {
        Server.log('[WebSocket connection closed]');
      });

      // eslint-disable-next-line no-console
      ws.on('error', console.error);

      ws.on('message', (data) => {
        const message = data.toString();
        Server.log(`=> "${message}"`);
        ws.send(data.toString());
        Server.log(`<= "${message}"`);
      });
    });
  }

  async start(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.httpServer.listen(this.port, this.address).once('listening', resolve).once('error', reject);
    });
    // eslint-disable-next-line no-console
    console.log(`Server is listening on ${this.boundAddress()}`);
  }

  boundAddress(): string | undefined {
    const maybeAddressInfo = this.httpServer.address();
    if (!maybeAddressInfo) {
      return;
    }
    const addressInfo = maybeAddressInfo as AddressInfo;
    return `${addressInfo.address}:${addressInfo.port}`;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) =>
      this.httpServer.close((error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      }),
    );
    // eslint-disable-next-line no-console
    console.log('Server stopped');
  }

  private static log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`${new Date().toUTCString()}: ${message}`);
  }
}
