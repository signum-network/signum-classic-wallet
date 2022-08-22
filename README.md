# Signum Classic Wallet
[![Get Support at https://discord.gg/ms6eagX](https://img.shields.io/badge/join-discord-blue.svg)](https://discord.gg/ms6eagX)

The Classic wallet is hard to maintain.
The new Phoenix wallet is much more modern and shall be prefered to be used by new users.
If you still prefer this old fashion, fell free to use.

## Project scope

- Just keep it working, no new features.
- Personal project: this is like a puzzle for me, no pressure.

## Known issues

This project depends on YOU opening issues to tell me what it is not working.

## How to use

* Use at [deleterium.info](https://deleterium.info/signum-classic-wallet)

OR
1) Clone this repository to your machine
2) Install node dependencies: `npm ci`
3) Run server for classic wallet: `npm start`
4) Point your browser to `http://localhost:1221`

## Security advice
- Transactions are signed on browser, no passphrase transmitted to servers.
- The passphrase will be saved on browser localStorage without encryption if "Remeber passphrase" is checked. This mean, your passphrase can be stolen if a hacker have physical access to the computer or if the browser profile data copied.
