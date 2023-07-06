# websocket-echo

A web server that responds to both HTTP and WebSocket requests. When a normal `GET` request is received, the server
responds with an HTML page that can be used to interact with the WebSocket server. When a WebSocket `Upgrade` request is
received, the server responds to any WebSocket messages by echoing them back to the client.

The server binds to two ports on startup: one for HTTP (defaults to 8080) and one for HTTPS (defaults to 8443).

## Requirements

Node/npm are required. See [.nvmrc](.nvmrc) for recommended node version. It is recommended to use
[Node Version Manager](https://github.com/nvm-sh/nvm) with
[shell integration](https://github.com/nvm-sh/nvm#deeper-shell-integration) if possible.

## Usage

1. Clone this repo locally
1. Run `npm ci` to install dependencies
1. Run `npm test` and verify that tests pass
1. Run `npm run build` to build the server
1. Run `node build/index.js` to start the server

### Configuration

By default the server will bind to `localhost` port `8080` (HTTP) and `8443` (HTTPS). These settings can be changed by
setting the following environment variables:

`ADDRESS`

Change the bind address, e.g. `ADDRESS="192.168.1.1" node build/index.js`.

`HTTP_PORT`

Change the port on which the server listens for HTTP requests, e.g. `HTTP_PORT=8888 node build/index.js`. Use
`HTTP_PORT=0` to choose a random available port.

`HTTPS_PORT`

Change the port on which the server listens for HTTPS requests, e.g. `HTTPS_PORT=4438 node build/index.js`. Use
`HTTPS_PORT=0` to choose a random available port.

`CERTIFICATE_PATH`

Path to a custom SSL certificate that the HTTPS server should use.

`KEY_PATH`

Path to a custom private key that the HTTPS server should use.
