![CIDME project banner logo - dual](logos/cidme-banner_logo-dual-750x150.png "CIDME project banner logo - dual")
![CIDME CLI Implementation QR code - cidme://public/EntityContext/dcb2c99b-2fd2-4bb4-925d-32ff534705f3](logos/cidme-cli_implementation-qr_code-350x350.png "CIDME CLI Implementation QR code - cidme://public/EntityContext/dcb2c99b-2fd2-4bb4-925d-32ff534705f3")

CIDME-CLI Implementation CIDME ID/URL: _cidme://public/EntityContext/dcb2c99b-2fd2-4bb4-925d-32ff534705f3_


# CIDME-CLI

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Node-based CLI for CIDME (ALPHA!  INCOMPLETE!).  Uses the [CIDME-JS](http://github.com/cidme/CIDME-JS) package.

## **Install:**
* Use NPM to install:
  ```sh
  npm install cidme-cli
  ```
* If you wish to install the CLI for use globally do this (_as root or sudo_):
  ```sh
  npm link cidme-cli
  ```
  * **NOTE:** If you do not link the CLI globally you will have to manually install and/or use the ```dist/cidme-cli.js``` script directly.


## **Basic Usage:**


**NOTE:** If you did not link the CLI globally you will have to adjust the commands below to use the ```cidme-cli.js``` script itself.


Get help:
```sh
cidme-cli
```

Create a new CIDME Entity with one Entity Context:
```sh
cidme-cli createEntityAndEntityContext
```

Create a new CIDME Entity with three Entity Contexts:
```sh
cidme-cli createEntityAndEntityContext 3
```

**_NOTE!_** - [jq is your friend!!!](https://github.com/stedolan/jq/)  Make it pretty:

```sh
cidme-cli createEntityAndEntityContext | jq
```

Save a new CIDME Entity/Entity Context to a file:

```sh
cidme-cli createEntityAndEntityContext -o test.json
```

View a formatted summary of the contents of the file:

```sh
cidme-cli viewFile -i test.json
```

In the above formatted output, find the CIDME Resource URI of the Entity Context.  It will be in the ```CONTEXTS:``` section, to the right of ```- Entity Context:```, will be in parenthesis, and will take the form of:  
```
cidme://local/EntityContext/8982874a-b43e-49ce-baa2-d1a1770bf94d
```
Yours will have a different ID (UUID).  Copy this CIDME Resource URI.

Now let's add an Entity Context Data Group to our Entity Context.  In order to do so, we need to specify the parent Resource Id, which is what we just copied above.

```sh
cidme-cli createResource EntityContextDataGroup -p cidme://local/EntityContext/8982874a-b43e-49ce-baa2-d1a1770bf94d -i test.json -o test2.json
```

View the formatted summary of the new file:

```sh
cidme-cli viewFile -i test2.json
```

There should now be a ```- EntityContextDataGroup:``` section under our _Entity Context_.


**TO BE CONTINUED...**
