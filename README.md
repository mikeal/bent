# bent

Functional HTTP client for Node.js w/ async/await.

<p>
  <a href="https://www.patreon.com/bePatron?u=880479">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" height="40px" />
  </a>
</p>

## Usage

```javascript
const bent = require('bent')

const getJSON = bent('json')
const getBuffer = bent('buffer')

let obj = await getJSON('http://site.com/json.api')
let buffer = await getBuffer('http//site.com/image.png')
```

As you can see, bent is a function that returns an async function.

Bent takes options which constrain what is accepted by the client.
Any response that falls outside the constraints will generate an error.

The following options are available.

* **HTTP Method**: `'GET'`, `'PUT'`, and any ALLCAPS string will be
  used to set the HTTP method. Defaults to `'GET'`
* **Response Encoding**: Available options are `'string'`, `'buffer'`, and
  `'json'`. If no encoding is set, which is the default, the response
  object/stream will be returned instead of a decoded response.
* **Status Codes**: Any number will be considered an acceptable status code.   If none are provided `200` will be the only acceptable status code, but
  if status codes are provided `200` must be added explicitely.
* **Headers**: An object can be passed to set request headers.
* **Base URL**: Any string that begins with 'https:' or 'http:' is
  consider the Base URL. Subsequent queries need only pass the remaining
  URL string.

The returned async function is used for subsequent requests.

### `async request(url[, body=null])`

* **url**: Fully qualified URL to the remote resource, or in the case that a
  base URL is passed the remaining URL string.
* **body**: Request body. Can be stream, buffer or JSON object.

```javascript
const bent = require('bent')

const put = bent('PUT', 201)
await put('http://site.com/upload', Buffer.from('test'))
```
