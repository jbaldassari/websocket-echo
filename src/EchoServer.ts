import {readFileSync, statSync} from 'fs';
import {Server as HttpServer, RequestListener} from 'http';
import {Server as HttpsServer} from 'https';
import {AddressInfo} from 'net';
import path from 'path';
import {WebSocketServer} from 'ws';

const DefaultAddress = 'localhost';
const AddressEnvironmentVariable = 'ADDRESS';

const PublicDirectory = 'public';
const PublicPathPrefix = path.join('/', PublicDirectory);
const IndexFile = 'index.html';

const ContentTypeHeader = 'Content-Type';

interface File {
  content: Buffer;
  length: number;
  type: string;
}

export interface EchoServerOptions {
  address?: string;
  port?: number;
}

export abstract class EchoServer<Server extends HttpServer | HttpsServer> {
  protected readonly port: number;
  protected readonly address: string;
  private readonly server: Server;
  private readonly wsServer: WebSocketServer;
  private readonly cache: Map<string, File> = new Map();

  constructor(createServer: (requestListener: RequestListener) => Server, options?: EchoServerOptions) {
    this.port = options?.port ?? 0;
    this.address = options?.address ?? process.env[AddressEnvironmentVariable] ?? DefaultAddress;
    const requestListener = this.createRequestListener();
    this.server = createServer(requestListener);
    this.wsServer = this.createWebSocketServer(this.server);
  }

  boundAddress(): string | undefined {
    return EchoServer.addressToString(this.server.address());
  }

  abstract name(): string;

  async start(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.server.listen(this.port, this.address).once('listening', resolve).once('error', reject);
    });
    // eslint-disable-next-line no-console
    EchoServer.log(`${this.name()} is listening on ${this.boundAddress()}`);
  }

  async stop(): Promise<void> {
    this.cache.clear();
    await new Promise<void>((resolve, reject) =>
      this.server.close((error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      }),
    );
    await new Promise<void>((resolve, reject) =>
      this.wsServer.close((error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      }),
    );
    // eslint-disable-next-line no-console
    EchoServer.log('HTTP Server stopped');
  }

  private createRequestListener(): RequestListener {
    return (request, response) => {
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
    };
  }

  protected createWebSocketServer(server: HttpServer | HttpsServer): WebSocketServer {
    const webSocketServer = new WebSocketServer({server});
    webSocketServer.on('connection', (ws) => {
      EchoServer.log('[WebSocket connection opened]');

      ws.on('close', () => {
        EchoServer.log('[WebSocket connection closed]');
      });

      // eslint-disable-next-line no-console
      ws.on('error', console.error);

      ws.on('message', (data) => {
        const message = data.toString();
        EchoServer.log(`=> "${message}"`);
        ws.send(data.toString());
        EchoServer.log(`<= "${message}"`);
      });
    });
    return webSocketServer;
  }

  private static addressToString(maybeAddressInfo?: string | AddressInfo | null): string | undefined {
    if (!maybeAddressInfo) {
      return;
    }
    const addressInfo = maybeAddressInfo as AddressInfo;
    return `${addressInfo.address}:${addressInfo.port}`;
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

  protected static log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`${new Date().toUTCString()}: ${message}`);
  }
}
