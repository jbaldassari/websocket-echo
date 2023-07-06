import {readFileSync, statSync} from 'fs';
import {Server as HttpServer, createServer} from 'http';
import {AddressInfo} from 'net';
import path from 'path';
import {WebSocketServer} from 'ws';

const DefaultAddress = 'localhost';
const AddressEnvironmentVariable = 'ADDRESS';
const DefaultPort = 8080;
const PortEnvironmentVariable = 'PORT';

const PublicDirectory = 'public';
const PublicPathPrefix = path.join('/', PublicDirectory);
const IndexFile = 'index.html';

const ContentTypeHeader = 'Content-Type';

interface File {
  content: Buffer;
  length: number;
  type: string;
}

export class Server {
  private readonly httpServer: HttpServer;
  private readonly webSocketServer: WebSocketServer;
  private readonly cache: Map<string, File> = new Map();

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

      const file = request.url
        ? this.maybeGetPublicFile(new URL(request.url, `http://${request.headers.host}`).pathname)
        : undefined;
      if (file) {
        const {content, length, type} = file;
        response.writeHead(200, {'Content-Length': length, [ContentTypeHeader]: type});
        response.write(content);
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
    this.cache.clear();
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

  private maybeGetPublicFile(unnormalizedPath: string): File | undefined {
    const normalizedPath = this.normalizePath(unnormalizedPath);
    if (normalizedPath.startsWith(PublicPathPrefix)) {
      const maybeCached = this.cache.get(normalizedPath);
      if (maybeCached) {
        return maybeCached;
      }
      const filePath = path.normalize(path.join(__dirname, normalizedPath));
      const fileStat = statSync(filePath, {throwIfNoEntry: false});
      if (fileStat?.isFile()) {
        const content = readFileSync(filePath);
        const file: File = {content, length: fileStat.size, type: this.contentType(filePath)};
        this.cache.set(normalizedPath, file);
        return file;
      }
    }
  }

  private normalizePath(unnormalizedPath: string): string {
    const normalizedPath = path.normalize(path.join('/', unnormalizedPath));
    if (normalizedPath === '/') {
      return path.join(PublicPathPrefix, IndexFile);
    }
    return normalizedPath;
  }

  private contentType(filename: string): string {
    const normalized = filename.toLowerCase();
    if (normalized.endsWith('.js')) {
      return 'application/javascript';
    }
    if (normalized.endsWith('.html')) {
      return 'text/html';
    }
    return 'text/plain';
  }

  private static log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`${new Date().toUTCString()}: ${message}`);
  }
}
