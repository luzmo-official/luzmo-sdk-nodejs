var Cumulio = require('./cumulio');
var http = require('http');

// Connect to Cumul.io API
var client = new Cumulio({
  api_key: '< Your API key >',
  api_token: '< Your API token >'
});

// Run a web server
var server = http.createServer(function(request, response) {

  // Create a temporary token
  var dashboard = '1d5db81a-3f88-4c17-bb4c-d796b2093dac';
  client.create('authorization', {
    type: 'temporary',
    // Exhaustive list of datasets and dashboards to which to grant access
    securables: ['4db23218-1bd5-44f9-bd2a-7e6051d69166', 'f335be80-b571-40a1-9eff-f642a135b826', dashboard],
    // List of data filters to apply, so clients can only access their own data
    filters: [
      {
        clause: 'where',
        origin: 'global',
        securable_id: '4db23218-1bd5-44f9-bd2a-7e6051d69166',   // Demo data - United Widgets - Sales
        column_id: '3e2b2a5d-9221-4a70-bf26-dfb85be868b8',      // Product
        expression: '? = ?',
        value: 'Damflex'
      }
    ],
    // Expire the token after 5 minutes
    expiry: new Date(new Date().getTime() + 300*1000),
    // Force the screen mode to desktop (regardless of the iframe size) & language to English
    screenmode: 'desktop',
    locale_id: 'en'
  })
    .then(function(authorization) {
      // Generate the embedding url
      return client.iframe(dashboard, authorization);
    })
    .then(function(iframe) {
      // In reality, you might want to use a templating engine for this :-)
      response.end(
        '<!DOCTYPE html>' +
        '<html>' +
        '  <head>' +
        '    <meta charset="UTF-8">' +
        '    <title>Cumul.io embedding example</title>' +
        '  </head>' +
        '  <body>' +
        '    <div style="margin-left: 28px; width: 650px;">' +
        '      <h1 style="font-weight: 200;">Cumul.io embedding example</h1>' +
        '      <p>This page contains an example of an embedded dashboard of Cumul.io. The dashboard data is securely filtered server-side, so clients can only access data to which your application explicitly grants access (in this case, the "Damflex" product).</p>' +
        '    </div>' +
        '    <iframe src="' + iframe + '" style="border: 0; width: 1024px; height: 650px;"></iframe>' +
        '  </body>' +
        '</html>'
      );
    })
    .catch(function(error) {
      console.error(error);
      response.statusCode = 500;
      response.end('Oops, something went wrong!');
    });

});

server.listen(5000, function() {
  console.log('Server listening on port 5000');
});