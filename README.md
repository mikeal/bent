# bent

Functional HTTP client for Node.js w/ async/await.

*Incredibly small browser version built on fetch w/ no external dependencies or polyfills.*

## Usage

```javascript
const bent = require('bent')

const getJSON = bent('json')
const getBuffer = bent('buffer')

let obj = await getJSON('http://site.com/json.api')
let buffer = await getBuffer('http://site.com/image.png')
```

As you can see, bent is a function that returns an async function.

Bent takes options which constrain what is accepted by the client.
Any response that falls outside the constraints will generate an error.

You can provide these options in any order, and Bent will figure out which option is which by inspecting the option's type and content.
```javascript
const post = bent('http://localhost:3000/', 'POST', 'json', 200);
const response = await post('cars/new', {name: 'bmw', wheels: 4});
```

If you don't set a response encoding (`'json'`, `'string'` or `'buffer'`)
then the response object will be returned after the statusCode check.

```javascript
const bent = require('bent')

const getStream = bent('http://site.com')

let stream = await getStream('/json.api')
```

The following options are available.

* **HTTP Method**: `'GET'`, `'PUT'`, or any other ALLCAPS string will be
  used to set the HTTP method. Defaults to `'GET'`.
* **Response Format**: Available formats are `'string'`, `'buffer'`, and
  `'json'`. By default, the response object/stream will be returned instead
  of a decoded response. *Browser returns `ArrayBuffer` instead of `Buffer`.*
* **Status Codes**: Any number will be considered an acceptable status code.
  By default, `200` is the only acceptable status code. When any status codes
  are provided, `200` must be included explicitly in order to be acceptable.
* **Headers**: An object can be passed to set request headers.
* **Base URL**: Any string that begins with 'https:' or 'http:' is
  considered the Base URL. Subsequent queries need only pass the remaining
  URL string.

The returned async function is used for subsequent requests.

When working with Binary this library uses different types in the browser and Node.js. In Node.js all binary must be done
the `Buffer` type. In the browser you can use ArrayBuffer or any ArrayBuffer view type (UInt8Array, etc).

### `async request(url[, body=null])`

* **url**: Fully qualified URL to the remote resource, or in the case that a
  base URL is passed the remaining URL string.
* **body**: Request body. Can be a string, a stream (node.js), a buffer (node.js),
  an ArrayBuffer (browse), or a JSON object.

```javascript
const bent = require('bent')

const put = bent('PUT', 201)
await put('http://site.com/upload', Buffer.from('test'))
```
