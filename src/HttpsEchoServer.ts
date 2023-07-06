import {mkdirSync, readFileSync, statSync, writeFileSync} from 'fs';
import {Server as HttpsServer, ServerOptions as HttpsServerOptions, createServer as createHttpsServer} from 'https';
import {pki} from 'node-forge';
import path from 'path';
import {EchoServer, EchoServerOptions} from './EchoServer';

const DefaultHttpsPort = 8443;
const HttpsPortEnvironmentVariable = 'HTTPS_PORT';

const DefaultTlsDirectory = path.join(__dirname, 'tls');
const DefaultCertificatePath = path.join(DefaultTlsDirectory, 'cert.pem');
const DefaultKeyPath = path.join(DefaultTlsDirectory, 'key.pem');
const CertificatePathEnvironmentVariable = 'CERTIFICATE_PATH';
const KeyPathEnvironmentVariable = 'KEY_PATH';

export interface TlsOptions {
  certificatePath: string;
  keyPath: string;
}

export interface HttpsEchoServerOptions extends EchoServerOptions {
  tls?: TlsOptions;
}

type TlsConfiguration = Required<Pick<HttpsServerOptions, 'cert'> & Pick<HttpsServerOptions, 'key'>>;

export class HttpsEchoServer extends EchoServer<HttpsServer> {
  constructor(options?: HttpsEchoServerOptions) {
    super(
      (requestListener) =>
        createHttpsServer(
          {...HttpsEchoServer.initializeTls(HttpsEchoServer.materializeTlsOptions(options))},
          requestListener,
        ),
      {port: options?.port ?? Number.parseInt(process.env[HttpsPortEnvironmentVariable] ?? `${DefaultHttpsPort}`)},
    );
  }

  name(): string {
    return 'HTTPS Server';
  }

  private static materializeTlsOptions(options?: HttpsEchoServerOptions): TlsOptions {
    return {
      certificatePath:
        options?.tls?.certificatePath ?? process.env[CertificatePathEnvironmentVariable] ?? DefaultCertificatePath,
      keyPath: options?.tls?.keyPath ?? process.env[KeyPathEnvironmentVariable] ?? DefaultKeyPath,
    };
  }

  private static initializeTls(tlsOptions: TlsOptions): TlsConfiguration {
    return HttpsEchoServer.tryReadCertificate(tlsOptions) ?? HttpsEchoServer.generateCertificate(tlsOptions);
  }

  private static tryReadCertificate(tlsOptions: TlsOptions): TlsConfiguration | undefined {
    const keyFile = statSync(tlsOptions.keyPath, {throwIfNoEntry: false});
    const certFile = statSync(tlsOptions.certificatePath, {throwIfNoEntry: false});
    if (keyFile?.isFile() && certFile?.isFile() && keyFile.size && certFile.size) {
      EchoServer.log(`Reading certificate from: ${tlsOptions.certificatePath}`);
      const cert = readFileSync(tlsOptions.certificatePath);
      EchoServer.log(`Reading key from: ${tlsOptions.keyPath}`);
      const key = readFileSync(tlsOptions.keyPath);
      return {cert, key};
    }
  }

  private static generateCertificate(tlsOptions: TlsOptions): TlsConfiguration {
    EchoServer.log('Beginning generation of self-signed certificate');

    const keys = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    const attrs = [
      {
        name: 'commonName',
        value: 'example.org',
      },
      {
        name: 'countryName',
        value: 'US',
      },
      {
        name: 'localityName',
        value: 'Test',
      },
      {
        name: 'organizationName',
        value: 'Test',
      },
      {
        shortName: 'OU',
        value: 'Test',
      },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      {
        cA: true,
        name: 'basicConstraints',
      },
      {
        dataEncipherment: true,
        digitalSignature: true,
        keyCertSign: true,
        keyEncipherment: true,
        name: 'keyUsage',
        nonRepudiation: true,
      },
      {
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        name: 'extKeyUsage',
        serverAuth: true,
        timeStamping: true,
      },
      {
        client: true,
        email: true,
        emailCA: true,
        name: 'nsCertType',
        objCA: true,
        objsign: true,
        server: true,
        sslCA: true,
      },
      {
        altNames: [
          {
            type: 6, // URI
            value: 'http://example.org/webid#me',
          },
          {
            ip: '127.0.0.1',
            type: 7, // IP
          },
        ],
        name: 'subjectAltName',
      },
      {
        name: 'subjectKeyIdentifier',
      },
    ]);

    // Self-sign certificate
    cert.sign(keys.privateKey);

    // Serialize to PEM:
    const keyPem = pki.privateKeyToPem(keys.privateKey);
    const certificatePem = pki.certificateToPem(cert);

    // Save the key and certificate to avoid regenerating the next time:
    const keyDirectory = path.dirname(tlsOptions.keyPath);
    const certificateDirectory = path.dirname(tlsOptions.certificatePath);
    const keyPath = path.join(keyDirectory, 'key.pem');
    const certificatePath = path.join(certificateDirectory, 'cert.pem');

    EchoServer.log(`Writing key to: ${keyPath}`);
    mkdirSync(keyDirectory, {recursive: true});
    writeFileSync(keyPath, keyPem);

    EchoServer.log(`Writing certificate to: ${certificatePath}`);
    mkdirSync(certificateDirectory, {recursive: true});
    writeFileSync(certificatePath, certificatePem);

    return {cert: certificatePem, key: keyPem};
  }
}
