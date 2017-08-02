var Cumulio = require('./cumulio');
var http = require('http');

// Connect to Cumul.io API
var client = new Cumulio({
  api_key: '< Your API key >',
  api_token: '< Your API token >'
});

// Run a web server
var server = http.createServer(function(request, response) {

  if (request.url !== '/') {
    response.statusCode = 404;
    return response.end('Not Found');
  }

  // Create a temporary token
  var dashboardId = '1d5db81a-3f88-4c17-bb4c-d796b2093dac';
  client.create('authorization', {
    type: 'temporary',
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
  })
    .then(function(authorization) {
      // In reality, you might want to use a templating engine for this :-)
      response.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Cumul.io embedding example</title>
          </head>
          <body style="margin-left: 100px;">
            <div style="width: 650px;">
              <h1 style="font-weight: 200;">Cumul.io embedding example</h1>
              <p>This page contains an example of an embedded dashboard of Cumul.io. The dashboard data is securely filtered server-side, so clients can only access data to which your application explicitly grants access (in this case, the "Damflex" product).</p>
              <p>Try to resize your page to see the dashboard adapting to different screen modes.</p>
            </div>

            <div id="myDashboard"></div>
            <script type="text/javascript">
              (function(d, a, s, h, b, oa, rd) { 
                if (!d[b]) {oa = a.createElement(s), oa.async = 1; oa.src = h; rd = a.getElementsByTagName(s)[0]; rd.parentNode.insertBefore(oa, rd);}
                d[b] = d[b] || {}; d[b].addDashboard = d[b].addDashboard || function(v) { (d[b].list = d[b].list || []).push(v) };
              })(window, document, 'script', 'https://cdn-a.cumul.io/js/embed.min.js', 'Cumulio');
              Cumulio.addDashboard({
                dashboardId: '${dashboardId}'
                , container: '#myDashboard'
                , key: '${authorization.id}'
                , token: '${authorization.token}'
              });
            </script>

          </body>
        </html>
      `);
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
