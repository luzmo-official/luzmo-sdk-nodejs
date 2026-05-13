# Luzmo API

You can use this Node.js module to interact with the [Luzmo](https://luzmo.com) API in order to create, modify or delete datasets, dashboards or push new data into the platform in a programmatic way.

## Installation

`npm install @luzmo/nodejs-sdk`

## Usage

Include the `@luzmo/nodejs-sdk` npm package in your project. For example, to push data into the platform (triggering real-time dashboard updates):

```js
const Luzmo = require('@luzmo/nodejs-sdk');

// Connect
const client = new Luzmo({
  api_key: '< your API key >',
  api_token: '< your API token >',
  host: '< https://api.luzmo.com or https://api.us.luzmo.com or your VPC-specific address>'
});

client.create(
  'data',
  {
    securable_id: '< dataset identifier >',
    data: [
      ['plaice', 2014, 2.1234, 751],
      ['plaice', 2015, 1.8765, 573]
    ]
  })
  .then(function() {
    console.log('Success!');
  })
  .catch(function(error) {
    console.error('API error:', error);
  })
  .finally(function() {
    client.close();
  });
```

See `example-embedding.js` for an example of how to use the API to securely embed dashboards in a web page (with serverside pre-filtering of the data that the end-user can query).

## Streaming Responses

Streaming-compatible responses keep the existing SDK method signatures. When the API responds with `application/x-ndjson`, `application/ndjson`, or `text/event-stream`, the SDK resolves with an async-iterable stream object instead of buffering the full response body. The iterator yields raw UTF-8 text chunks, so callers can parse NDJSON rows or SSE events themselves.

```js
const stream = await client.create('aiprompt', payload);

const conversationId = stream.headers.get('x-conversation-id');

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

The returned stream object exposes:

- `headers`: response headers (for example `x-conversation-id`)
- `format`: either `ndjson` or `sse`
- `cancel()`: aborts the unread response body

If the response is regular JSON, the SDK keeps the existing behavior and resolves with the parsed JSON value.

## TS Types

The types are defined in `types/luzmo.d.ts` and will be expanded as properties are added. However, right now (at time of writing: 25/03/2021) the IDE will prompt the user as to what type to use, but some such as `properties` are still `any` so you should check the documentation to see what to include based on the `resource` you are using. We will continue to add properties to the project.

## Documentation

The API documentation (available services and methods) can be found in the [Luzmo developer documentation](http://developer.luzmo.com).
