# CIDME-CLI

Node-based CLI for CIDME (ALPHA!  INCOMPLETE!).  Uses the [CIDME-JS](http://github.com/cidme/CIDME-JS) package.

## **Install:**
* Download current package and unpack.
* Change directory into the unpackaged directory.
* Use NPM to install:
  ```sh
  npm install
  ```
* The CLI is composed of the *dist/cidme-cli.js* script.  To make this script executable, execute the following:
  ```sh
  chmod a+x dist/cidme-cli.js
  ```
* **TODO**: Add NPM link functionality to make script available for general CLI use.


## **Basic Usage:**

Get help:
```sh
cidme-cli.js
```

Create a new CIDME Entity with one Entity Context:
```sh
cidme-cli.js createEntityAndEntityContext
```

Create a new CIDME Entity with three Entity Contexts:
```sh
cidme-cli.js createEntityAndEntityContext 3
```

**_NOTE!_** - [jq is your friend!!!](https://github.com/stedolan/jq/)  Make it pretty:

```sh
cidme-cli.js createEntityAndEntityContext | jq
```

Save a new CIDME Entity/Entity Context to a file:

```sh
cidme-cli.js createEntityAndEntityContext -o test.json
```

View a formatted summary of the contents of the file:

```sh
cidme-cli.js viewFile -i test.json
```

In the above formatted output, find the CIDME Resource URI of the Entity Context.  It will be in the ```CONTEXTS:``` section, to the right of ```- Entity Context:```, will be in parenthesis, and will take the form of:  
```
cidme://local/EntityContext/8982874a-b43e-49ce-baa2-d1a1770bf94d
```
Yours will have a different ID (UUID).  Copy this CIDME Resource URI.

Now let's add an Entity Context Data Group to our Entity Context.  In order to do so, we need to specify the parent Resource Id, which is what we just copied above.

```sh
cidme-cli.js createResource EntityContextDataGroup -p cidme://local/EntityContext/8982874a-b43e-49ce-baa2-d1a1770bf94d -i test.json -o test2.json
```

View the formatted summary of the new file:

```sh
cidme-cli.js viewFile -i test2.json
```

There should now be a ```- EntityContextDataGroup:``` section under our _Entity Context_.


**TO BE CONTINUED...**
