[History of Signum](https://signum.community/signum-development/)

```
2020-04-06 v3.0.0
- Proof of Commitment (PoC+) implemented - CIP27
- Support for extended addresses (no more *activation* for new addresses) - CIP26
- Mininum block reward limit - CIP29
- Increase max steps for smart contracts (ATs) - CIP28
- Phoenix wallet included
- Classic wallet updated
- Suggested fees based on unconfirmed transactions and not transaction history
- Improved GUI with new theme and buttons
- API documentation under `/api-doc` and not `/test`
- Difficulty given by network capacity + amount committed
- Fixed bugs with the donwload cache
- Fixed bugs preventing to reconnect after network outage
- Fix bug with AT on mining nodes (making them occasionaly inconsistent)
- New transaction types for commitment add/remove
- Improved popoff functions
- Faster and better DB consistency checks
- Better DB performance with new indices added to some tables
- Peers below v3.0 automatically disconnected after Signum fork block
- Several debug messages added for diagnose possible future problems
- Assets renamed to Tokens
- Unused features were removed from the classic wallet (still available by API)
- Peers now share their base targets so any inconsistency will be detected immediately
- Fixed pagination for multi-out transactions
- More AT bugs fixed with the commands SET_IDX and IDX_DAT
- A working *reftx* implementation
- Several libraries were updated (including jetty and other DB related)
- More stats available on the `getState` API

2020-01-07 v2.5.4
- Faster and more precise database check based on the balance of all accounts, total burnt, and total BURST ever mined
- Extended API to register bigger ATs (smart contracts)
- New buttons to pop-off blocks on the GUI (when the debug flag is enabled)

2020-10-06 v2.5.3
- Nodes that experienced an unclean kill, power outage, or crash can have the database in an inconsistent state. This version contains an additional database check based on the balance of all accounts and total BURST ever mined.

2020-08-29 v2.5.2
- Fixes an issue which caused excessive CPU load when validating transactions with very high fees

2020-05-31 v2.5.1
- Docker build
- Windows executable now refuse to run on 32 bit Java and a download link is shown to the user
- Limit the amount of blocks sent to peers by total length and not number of blocks
- Improved command line arguments, including one for setting the conf folder
- Other minor improvements

2020-05-10 v2.5.0 (Backport of fixes from v3.0.0 and many other improvements)
- More powerful and cheaper running smart contracts (CIP20)
- Deeplink Generator API (CIP22)
- Enforce slot fees (CIP23)
- New deadline computation formula aiming at more stable block times (CIP24)
- Can run on recent Java versions (previously limited to Java 8)
- A new GUI implementation
- Improved CORS support
- Fixed Escrow ID in Escrow Result Attachment Protobuf is always 2
- Fixed Get Peer Handler in gRPC API is never initialized
- Fixed GetOrdersHandler always returns ask orders
- Fixed Bugs in AT API Implementation

2019-08-13 v2.4.2
- Fixed HTTP API Encoding being reported to the client incorrectly, leading to the client incorrectly parsing special characters
- Limit maximum number of items returned by HTTP API
- Fixed NPE in ProtoBuilder when fetching an account

2019-07-15 v2.4.1
- Default to submit nonce whitelist off
- Revert removal of rejection of surplus parameters
- Add option to bind V2 API to specific interface
- MariaDB Settings tweaks 
- Various bug fixes and improvements

2019-07-01 v2.4.0
- Massive DB optimization, much much faster sync speed (Benchmarked at 7 hours to sync to block 600k on a 4C/8T 16GB RAM system, under MariaDB 10.3)
- Implemented CIP19 - View incoming & outgoing multi-out transactions in the UI
- Added new feature to sign arbitrary messages using UI
- Fixed gRPC error descriptions
- Comprehensive V2 API with all functionality of V1 implemented
- Auto pop-off on block push fail with slow back-off, should prevent nodes from getting stuck forever
- UTStore should produce waaaay less spam
- CORS on by default
- Minimum previous version is now v2.3.0
- Enforce fee structure (Inactive)
- Improved algorithm for transaction candidate selection
- Check in gRPC generated files (simplifies build)
- Tighter timings for sync threads
- Burstkit4j integration
- Rewrite support for UI (Apps that utilize deep linking such as phoenix can now be hosted by BRS)
- Add a method to not submit passphrase when solo mining by configuring passphrase in config and only submitting account ID, and an option to disallow others from mining on your node
- AT debug option
- Improvements to AT implementation
- Web UI: Display AT messages as both string and hex
- Fix UT Store failed removal
- Re-add `getGuaranteedBalance` HTTP API call as lots of clients depended on it
- Test endpoint support for QR code generator
- Implemented CIP20 (Inactive)

2018-04-04 v2.3.0
           Fix of major security vulnerability where passphrase was sent to node upon login
           gRPC-based V2 API. Currently only contains calls needed for mining, will be expanded in future if well received.
           Migrate to GSON as JSON library
           Significantly improve sync speed, as well as other minor performance improvements
           New Semver-based versioning system
           Fix bug where reward recipient assignments would not go into unconfirmed transactions
           Lightweight Desktop GUI, with tray icon (For windows and mac, can be disabled with "--headless" command line argument)
           Automatically add conf/ directory to classpath
           Configurable TestNet UI/API port
           New getAccountsWithName API call
           UI: Fix 24h timestamp display option
           Allow development versions of wallet to run on TestNet only
           Fixed bug where string validation could fail in certain locales
           Use FlywayDB for database migration management

2018-05-30 2.2.0
           "Pre-Dymaxion" HF1 release (Burst hard fork/upgrade)
           @500k: 4x bigger blocks, multi-out transactions, dynamic fees
           @502k: PoC2

2018-03-15 2.0.0
           BRS - Burst Reference Software:
           Burst namespace, some NXT legacy is in API data sent P2P
           streamlined configuration namespace, more logical and intuitive
           migrated to JOOQ, supports many  DB backends; only H2 and mariaDB
           in-code to prevent bloat, all others via DB-manager
           UPnP functionality to help with router configuration for public nodes
           removed lots of unused code, updated many UI libraries
           significant improvements in P2P handling: re-sync speed, fork-handling
           peer acquisition
           Squashed many bugs and vulnerabilities, using subresource integrity
           test coverage went from 0% to over 20%

2017-10-28 1.3.6cg
           multi-DB support: added Firebird, re-added H2; support for quick
           binary dump and load

2017-09-04 1.3.4cg
           improved database deployment; bugfix: utf8 encoding

2017-08-11 1.3.2cg
           1st official PoCC release: MariaDB backend based on 1.2.9
```

[Versions up to 2.2.7](https://github.com/poc-consortium/burstcoin/releases)

[Versions up to 1.2.9](https://github.com/burst-team/burstcoin/releases)
