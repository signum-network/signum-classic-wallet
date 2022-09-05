# API Documentation

To document the API the world-wide standard [Open API Spec Version 3.x](https://www.openapis.org/) (OAS) is being used. The 
The Signum API is described in a [formal specification](../html/api-doc/signum-api.json). A running node provides a visual and interactive 
interface to inspect and even try the API without the need of coding. 

This UI is accessible under 
- http://localhost:8125/api-doc for Main Net 
- http://localhost:6876/api-doc for Test Net 


## Legacy Documentation

The legacy interactive interface was substituted by the far more sophisticated modern OAS-based documentation system.
To re-activate the legacy interface please set the property `API.DocMode = legacy` in the `./conf/node.properties` file


## Editing the API Spec

> This requires a certain familiarity with OAS/Swagger documentation.

A documentation is a living document and has to be improved and updated along the software life cycle.

The documentation is split in many json files, which need to be bundled into the final spec document.
The directory structure is almost self-explaining. Each API method is a single file hosted in the `./paths` folder.
Adding or changing new endpoints would require the creation or adjustment of a file according to its method name, e.g.
`getAccount` become `./paths/getAccount.json`. Please refer to the OAS to learn how to describe an API Endpoint

```
├── parameters ---> recurring parameter types
├── paths ---> the files per endpoint (your entry point to start off)
├── responses ---> recurring response objects, i.e. error, transaction
├── schemas ---> recurring object schemas, i.e. transaction, address, etc 
```

To contribute simply fork this repo and start editing the json spec. Open a PR and wait for review. 
Thanks in advance for improving our docs.

### Before you edit

> Requires NodeJS 12+ installed

Run `npm i` within the `openapi` folder to install all necessary build dependencies

The best way for editing is to launch the node (best in Testnet mode), before editing the documentation.
Open "http://localhost:6876/api-doc" in the browser.

#### Edit and Build Flow

In the `openapi` folder run `npm run dev`, which starts a file watcher and bundles the spec every time you saved a spec file.
As no hot reload is supported you'll need to hit Ctrl-F5 in the browser

Now edit the files accordingly.

Once ready, run `npm run dist` to create the final optimized spec file.

## Difference to OAS Spec

The anatomy of Signum API (as a legacy from the past) comes with a peculiarity, which breaks a bit with the OAS compatibility. 
In favor of clear separation and better readability the API parameter `requestType` is included in the path item of the OAS spec, 
which can cause problems with (interactive) documentation generators.

> The Signum API is following more the RPC concept than the REST-like approach

__Anatomy__

As it is in Signum

```
http://<hosturl>/api?requestType=<methodName>&arg1=...&arg2=...
<------- path ------><----------- query string ---------------->
```

As we treat in OAS

```
http://<hosturl>/api?requestType=<methodName>&arg1=...&arg2=...
<------------------- path -------------------><----------- query string 
```


It would be correct to declare `requestType` as query parameter within the spec, but this would cause an extremely convoluted documentation.
We use an [adapted version](https://github.com/signum-network/RapiDoc) of [RapiDoc](https://rapidocweb.com/), which allows us to consider `requestType` as part of the path.
Keep that in mind, when updating the docs. The visual editors will structure the docs in a different way than the adapted RapiDoc UI.
