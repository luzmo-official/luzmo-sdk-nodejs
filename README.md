# Cumul.io API

You can use this Node.js module to interact with the [Cumul.io](https://cumul.io) API in order to create, modify or delete datasets, dashboards or push new data into the platform in a programmatic way.

## Installation

`npm install cumulio`

## Usage

Include the `cumulio` npm package in your project. For example, to push data into the platform (triggering real-time dashboard updates):

```
var Cumulio = require('cumulio');

// Connect
var client = new Cumulio({
  api_key: '< your API key >',
  api_token: '< your API token >'
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

## TS Types

The types are defined in `types/cumulio.d.ts` and will be expanded as properties are added. However, right now (at time of writing: 25/03/2021) the IDE will prompt the user as to what type to use, but some such as `properties` are still `any` so you should check the documentation to see what to include based on the `resource` you are using. We will continue to add properties to the project.

## Documentation

The API documentation (available services and methods) can be found [here](http://developer.cumul.io).
