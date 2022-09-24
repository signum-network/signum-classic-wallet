# Signum Classic Wallet
[![Get Support at https://discord.gg/ms6eagX](https://img.shields.io/badge/join-discord-blue.svg)](https://discord.gg/ms6eagX)

The Classic wallet is hard to maintain.
The new Phoenix wallet is much more modern and shall be prefered to be used by new users.
If you still prefer this old fashion, fell free to use.

## Project scope

- Just keep it working, no new features.
- This is code is like a puzzle, please no pressure.

## Known issues

* Loading can take a while. The project has a lot of files to be downloaded during page load.
* Please open issues to tell what it is not working/buggy.

## How to use

* Use at [deleterium.info](https://deleterium.info/signum-classic-wallet)

OR
1) Clone this repository to your machine
2) Install node dependencies: `npm ci`
3) Run server for classic wallet: `npm start`
4) Point your browser to `http://localhost:1221`

## Security advice
- Transactions are signed on browser, no passphrase transmitted to servers.
- Use a password manager integrated with your browser to speed up login. Classic does not store the passphrase on disc, just in memory and if selected "Remember passphrase on this session".
