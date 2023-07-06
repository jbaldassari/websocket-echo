# websocket-echo

A web server that responds to both HTTP and WebSocket requests. When a normal `GET` request is received, the server
responds with an HTML page that can be used to interact with the WebSocket server. When a WebSocket `Upgrade` request is
received, the server responds to any WebSocket messages by echoing them back to the client.

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

By default the server will bind to `localhost` port `8080`. These settings can be changed by setting the following
environment variables:

`ADDRESS`

Change the bind address, e.g. `ADDRESS="192.168.1.1" node build/index.js`.

`PORT`

Change the bind port, e.g. `PORT=8888 node build/index.js`. Use `PORT=0` to choose a random available port.
