# Signum Classic Wallet
[![Get Support at https://discord.gg/ms6eagX](https://img.shields.io/badge/join-discord-blue.svg)](https://discord.gg/ms6eagX)

The Classic wallet is hard to maintain.
The new Phoenix wallet is much more modern and shall be prefered to be used by new users.
If you still prefer this old fashion, fell free to use.

## Project scope

- Just keep it working, no new features.
- Personal project: this is like a puzzle for me, no pressure.

## Known issues

This project depends on YOU opening issues to tell me what it is working or not.

## How to use

1) You will need to install "Git", "nodejs", and "signum-node" by yourself
2) A running and updated localhost signum-node is needed and not included
3) Clone this repository to your machine
4) Install node dependencies: `npm ci`
5) Run server for classic wallet: `npm start`
6) Point your browser to `http://localhost:1221`

## Configuration

### Testnet
Manual tweak is needed to run the wallet for testnet. Edit the file `src/js/brs.js` and change line 29 `BRS.server = "http://127.0.0.1:6876";`
To revert to mainnet, let the default `BRS.server = "http://127.0.0.1:8125";`
After changing, restart server.

### Using 3rd-party node
On same brs.js file, change to a signum-node that you trust (example `BRS.server = "https://europe.signum.network";`) and with secure http connection. Keep in mind:
- Your passphrase is sent to that server.
- If the connection is not secure (I mean, if you use a http: instead of https:), anyone in the middle can read your passphrase.
