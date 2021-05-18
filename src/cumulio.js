/**
 * Cumul.io API SDK
 * API : REST, language : Node.js
 *
 * Need some help? Contact us at support@cumul.io
 */

"use strict";

/**
 * Create a new API client instance.
 *
 * options          Object, options to set.
 *   api_key        String, your personal API key (required)
 *   api_token      String, your secret API token (required)
 *   api_version    String, semantic versioned API version to use (default: 0.1.0)
 *   host           String, host of the API (default: https://api.cumul.io)
 *   port           String, port of the API (default: 443)
 */
function Cumulio(options) {
  var t = this;
  if (t._isEmpty(options))
    throw new Error(
      "You must provide a valid API key and token. Contact the Cumul.io-team if in doubt!"
    );
  if (t._isEmpty(options.api_key) || !t._isString(options.api_key))
    throw new Error(
      "You must provide a valid API key. Contact the Cumul.io-team if in doubt!"
    );
  if (t._isEmpty(options.api_token) || !t._isString(options.api_token))
    throw new Error(
      "You must provide a valid API token. Contact the Cumul.io-team if in doubt!"
    );

  t.app = t._isEmpty(options.app) ? Cumulio.APP : options.app;
  t.host = t._isEmpty(options.host) ? Cumulio.HOST : options.host;
  t.port = t._isEmpty(options.port) ? Cumulio.PORT : options.port;
  t.api_version = t._isEmpty(options.api_version)
    ? Cumulio.API_VERSION
    : options.api_version;
  t.api_key = options.api_key;
  t.api_token = options.api_token;
}

Cumulio.APP = "https://app.cumul.io";
Cumulio.HOST = "https://api.cumul.io";
Cumulio.PORT = "443";
Cumulio.API_VERSION = "0.1.0";

/**
 * Create a new entity.
 *
 * resource         String, the type of resource to create. Eg. 'user'.
 * properties       Object, properties of the new resource.
 * associations     Array, associations to set on the newly created resource. Optional.
 *                  Each association should be of the format { role: ..., id: ... }
 *
 * Returns a promise resolving in case of completion, rejecting in case of error.
 */
Cumulio.prototype.create = function (resource, properties, associations) {
  var t = this;
  return t
    ._emit(resource, {
      action: "create",
      properties: properties,
    })
    .then(function (instance) {
      // Set associations on the newly created resource
      if (t._isEmpty(associations) || associations.length === 0)
        return instance;
      var promises = associations.map(function (association) {
        return t.associate(resource, instance.id, association);
      });
      return Promise.all(promises).then(function () {
        return instance;
      });
    });
};

/**
 * Retrieve one or more entities.
 *
 * resource         String, the type of resource to retrieve. Eg. 'user'.
 * find             Object, filtering / limiting / paging options.
 *                  Reference: http://docs.sequelizejs.com/en/1.7.0/docs/models/#findall-search-for-multiple-elements-in-the-database
 *
 * Returns a promise resolving with the resources retrieved, rejecting in case of error.
 */
Cumulio.prototype.get = function (resource, filter) {
  var t = this;
  var query = {
    action: "get",
    find: filter,
  };
  return t._emit(resource, query);
};

/**
 * Mark an entity as deleted.
 *
 * resource         String, the type of resource to delete. Eg. 'user'.
 * id               UUID, the unique identifier of the resource to delete.
 * properties       Object, additional properties needed to delete
 *                  (optional, see API reference for resources to use this with)
 *
 * Returns a promise resolving in case of completion, rejecting in case of error.
 */
Cumulio.prototype.delete = function (resource, id, properties) {
  var t = this;
  return t._emit(resource, {
    action: "delete",
    id: id,
    properties: properties,
  });
};

/**
 * Update properties of an entity.
 *
 * resource         String, the type of resource to update. Eg. 'user'.
 * id               UUID, the unique identifier of the resource to update.
 * properties       Object, properties to modify.
 *
 * Returns a promise resolving with the updated resource, rejecting in case of error.
 */
Cumulio.prototype.update = function (resource, id, properties) {
  var t = this;
  return t._emit(resource, {
    action: "update",
    id: id,
    properties: properties,
  });
};

/**
 * Associate two entities.
 *
 * resource         String, the type of the 1st resource to associate. Eg. 'user'.
 * id               UUID, the unique identifier of the 1st resource to associate.
 * association      Object, 2nd resource to associate.
 * - role           String, the role the 2nd resource will take.
 * - id             UUID, the unique identifier of the 2nd resource.
 * properties       Object with attributes to be updated (e.g. flagUse).
 *
 * Returns a promise resolving with the updated resource, rejecting in case of error.
 */
Cumulio.prototype.associate = function (resource, id, association, properties) {
  var t = this;
  return t._emit(resource, {
    action: "associate",
    id: id,
    resource: association,
    properties: properties,
  });
};

/**
 * Dissociate two entities.
 *
 * resource         String, the type of the 1st resource to dissociate. Eg. 'user'.
 * id               UUID, the unique identifier of the 1st resource to dissociate.
 * association      Object, 2nd resource to dissociate.
 * - role           String, the role the 2nd resource has.
 * - id             UUID, the unique identifier of the 2nd resource.
 *
 * Returns a promise resolving with the updated resource, rejecting in case of error.
 */
Cumulio.prototype.dissociate = function (resource, id, association) {
  var t = this;
  return t._emit(resource, {
    action: "dissociate",
    id: id,
    resource: association,
  });
};

/**
 * Validate data.
 *
 * resource         String, the type of the resource to validate an attribute of. Eg. 'user'.
 * properties       Object with attributes to validate.
 *
 * Returns a promise resolving with the boolean validation result, rejecting in case of error.
 */
Cumulio.prototype.validate = function (resource, properties) {
  var t = this;
  return t._emit(resource, {
    action: "validate",
    resource: properties,
    properties: properties,
  });
};

/**
 * Do a data query.
 *
 * filter       Query, object consisting of dimensions & measures
 *
 * Returns a promise that either:
 * - In case of unsynchronized querying, resolves with the results of a query and rejects in case of error.
 *   on the server and rejects in case of error.
 */
Cumulio.prototype.query = function (filter) {
  var t = this;
  return t._emit("data", {
    action: "get",
    find: filter,
  });
};

/**
 * Close the connection to the API.
 */
Cumulio.prototype.close = function () {
  var t = this;
};

/* Embedding */

/**
 * iframe integration
 */
Cumulio.prototype.iframe = function (dashboardId, authorization) {
  var t = this;
  return (
    t.app +
    "/s/" +
    dashboardId +
    "?key=" +
    authorization.id +
    "&token=" +
    authorization.token
  );
};

/* Helpers */

/**
 * Set up connection -- no persistent connection needed
 */
Cumulio.prototype._connect = function () {
  var t = this;
};

/**
 * Buffer connections
 */
Cumulio.prototype._onConnect = function () {
  var t = this;
};

Cumulio.HTTP_METHOD = {
  get: "SEARCH",
  create: "POST",
  update: "PATCH",
  delete: "DELETE",
  associate: "LINK",
  dissociate: "UNLINK",
  validate: "POST",
};

/**
 * Push out message over socket
 */
Cumulio.prototype._emit = function (event, data) {
  var t = this;

  data.key = t.api_key;
  data.token = t.api_token;
  data.version = t.api_version;

  return requestp({
    uri: t.host + ":" + t.port + "/" + t.api_version + "/" + event,
    json: true,
    body: data,
    encoding: null,
    method: Cumulio.HTTP_METHOD[data.action],
  })
    .then((body) => {
      return body;
    })
    .catch((error) => {
      if (!t._isEmpty(error.error)) throw error.error;
      throw error;
    });
};

/**
 * Type checks
 */

Cumulio.prototype._isInt = function (value) {
  return !isNaN(value) && parseInt(Number(value).toString(), 10) === value;
};

Cumulio.prototype._isNumeric = function (value) {
  return !isNaN(value) && isFinite(value);
};

Cumulio.prototype._isEmpty = function (value) {
  return value === null || typeof value === "undefined";
};

Cumulio.prototype._isObject = function (value) {
  return (
    !(value === null) && typeof value === "object" && !Array.isArray(value)
  );
};

Cumulio.prototype._isArray = function (value) {
  return Array.isArray(value);
};

Cumulio.prototype._isFunction = function (value) {
  return value && {}.toString.call(value) === "[object Function]";
};

Cumulio.prototype._isString = function (value) {
  return typeof value === "string" || value instanceof String;
};

Cumulio.prototype._isBoolean = function (value) {
  return value === true || value === false;
};

/**
 * Decompress a received payload.
 */
Cumulio.prototype._decompress = function (payload) {
  return payload;
};

/**
 * Compress a payload before sending.
 */
Cumulio.prototype._compress = function (payload) {
  return payload;
};

/* Dependencies */
var Promise = require("bluebird");
var requestp = require("request-promise");
var request = require("request");

module.exports = Cumulio;
