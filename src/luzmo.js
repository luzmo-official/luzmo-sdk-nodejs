/**
 * Luzmo API SDK
 * API : REST, language : Node.js
 *
 * Need some help? Contact us at support@luzmo.com
 */

"use strict";

/**
 * Create a new API client instance.
 *
 * options          Object, options to set.
 *   api_key        String, your personal API key (required)
 *   api_token      String, your secret API token (required)
 *   api_version    String, semantic versioned API version to use (default: 0.1.0)
 *   host           String, host of the API (default: https://api.luzmo.com)
 *   port           String, port of the API (default: 443)
 */
function Luzmo(options) {
  var t = this;
  if (t._isEmpty(options))
    throw new Error(
      "You must provide a valid API key and token. Contact the Luzmo-team if in doubt!"
    );
  if (t._isEmpty(options.api_key) || !t._isString(options.api_key))
    throw new Error(
      "You must provide a valid API key. Contact the Luzmo-team if in doubt!"
    );
  if (t._isEmpty(options.api_token) || !t._isString(options.api_token))
    throw new Error(
      "You must provide a valid API token. Contact the Luzmo-team if in doubt!"
    );

  t.host = t._isEmpty(options.host) ? Luzmo.HOST : options.host;
  t.port = t._isEmpty(options.port) ? Luzmo.PORT : options.port;
  t.api_version = t._isEmpty(options.api_version)
    ? Luzmo.API_VERSION
    : options.api_version;
  t.api_key = options.api_key;
  t.api_token = options.api_token;
}

Luzmo.HOST = "https://api.luzmo.com";
Luzmo.PORT = "443";
Luzmo.API_VERSION = "0.1.0";

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
Luzmo.prototype.create = function (resource, properties, associations) {
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
Luzmo.prototype.get = function (resource, filter) {
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
Luzmo.prototype.delete = function (resource, id, properties) {
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
Luzmo.prototype.update = function (resource, id, properties) {
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
Luzmo.prototype.associate = function (resource, id, association, properties) {
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
Luzmo.prototype.dissociate = function (resource, id, association) {
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
Luzmo.prototype.validate = function (resource, properties) {
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
Luzmo.prototype.query = function (filter) {
  var t = this;
  return t._emit("data", {
    action: "get",
    find: filter,
  });
};

/**
 * Close the connection to the API.
 */
Luzmo.prototype.close = function () {
  var t = this;
};

/* Helpers */

/**
 * Set up connection -- no persistent connection needed
 */
Luzmo.prototype._connect = function () {
  var t = this;
};

/**
 * Buffer connections
 */
Luzmo.prototype._onConnect = function () {
  var t = this;
};

Luzmo.HTTP_METHOD = {
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
Luzmo.prototype._emit = function (event, data) {
  var t = this;

  data.key = t.api_key;
  data.token = t.api_token;
  data.version = t.api_version;

  return requestp({
    uri: t.host + ":" + t.port + "/" + t.api_version + "/" + event,
    json: true,
    body: data,
    encoding: null,
    method: Luzmo.HTTP_METHOD[data.action],
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

Luzmo.prototype._isInt = function (value) {
  return !isNaN(value) && parseInt(Number(value).toString(), 10) === value;
};

Luzmo.prototype._isNumeric = function (value) {
  return !isNaN(value) && isFinite(value);
};

Luzmo.prototype._isEmpty = function (value) {
  return value === null || typeof value === "undefined";
};

Luzmo.prototype._isObject = function (value) {
  return (
    !(value === null) && typeof value === "object" && !Array.isArray(value)
  );
};

Luzmo.prototype._isArray = function (value) {
  return Array.isArray(value);
};

Luzmo.prototype._isFunction = function (value) {
  return value && {}.toString.call(value) === "[object Function]";
};

Luzmo.prototype._isString = function (value) {
  return typeof value === "string" || value instanceof String;
};

Luzmo.prototype._isBoolean = function (value) {
  return value === true || value === false;
};

/**
 * Decompress a received payload.
 */
Luzmo.prototype._decompress = function (payload) {
  return payload;
};

/**
 * Compress a payload before sending.
 */
Luzmo.prototype._compress = function (payload) {
  return payload;
};

/* Dependencies */
var Promise = require("bluebird");
var requestp = require("request-promise");
var request = require("request");

module.exports = Luzmo;
