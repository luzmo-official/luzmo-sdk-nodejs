export default cumulio;

type UUID = string;

declare namespace cumulio {
  /**
   * Described the Options object
   * @attr api_key
   * @attr api_token
   * @attr app (Optional)
   * @attr host (Optional)
   * @attr port (Optional)
   */
  export interface Options {
    api_key: UUID;
    api_token: string;
    app?: string;
    host?: string;
    port?: string;
  }

  export type Resource =
    | "authorization"
    | "user"
    | "group"
    | "securable"
    | "column"
    | "hierarchy"
    | "hierarchylevel"
    | "account"
    | "plugin"
    | "locale"
    | "schedule"
    | "country"
    | "share"
    | "tag"
    | "theme"
    | "integration"
    | "data"
    | "dataprovider"
    | "export";

  export type Role =
    | "Accounts"
    | "Aggregations"
    | "AppLocale"
    | "Assets"
    | "Authorizations"
    | "Columns"
    | "Currencies"
    | "Countries"
    | "Dashboards"
    | "DefaultAppLocale"
    | "DefaultLocale"
    | "DefaultTheme"
    | "Groups"
    | "Grouproles"
    | "Hierarchylevels"
    | "Integrations"
    | "Joins"
    | "Locales"
    | "Modifier"
    | "OrganizationBackground"
    | "Organizations"
    | "Owner"
    | "Plans"
    | "Plugins"
    | "Schedules"
    | "Securables"
    | "SecurableVersions"
    | "SharedUser"
    | "Shares"
    | "Tags"
    | "Tasks"
    | "Themes"
    | "Thumbnails"
    | "Timezones"
    | "TwoFactorAuthentications"
    | "User"
    | "UserBackground"
    | "Users";

  /**
   * Describes Association interface
   * @attr role
   * @attr id
   */
  export interface Association {
    role: Role;
    id: UUID;
  }

  /**
   * Describes Authorization interface
   * @attr id
   * @attr token
   */
  export interface Authorization {
    id: UUID;
    token: string;
  }

  /**
   * Describes Query interface
   * @attr dimensions
   * @attr measures
   * @attr where (Optional)
   * @attr order (Optional)
   * @attr limit (Optional)
   */
  export interface Query {
    dimensions: any[];
    measures: any[];
    where?: any[];
    order?: any[];
    limit?: { by: number };
  }
}

declare class cumulio {
  /**
   * Create a new API client instance.
   * @param options Cumulio.Options interface, options to set
   * @example Contents of Options
   *
   * {
   *    api_key        UUID (Required), your personal API key
   *    api_token      String (Required), your secret API token
   *    api_version    String (Optional), semantic versioned API version to use (default: 0.1.0)
   *    host           String (Optional), host of the API (default: https://api.cumul.io)
   *    port           String (Optional), port of the API (default: 443)
   *}
   *
   */
  constructor(options: cumulio.Options);

  /**
   * Associate two entities.
   * @param resource Resource, the type of resource to create. Eg. Resource.User.
   * @param id UUID, the unique identifier of the 1st resource to associate.
   * @param association Association, 2nd resource to associate: {role: String, id: UUID}
   * @param properties Object with attributes to be updated (e.g. flagUse).
   *
   * @returns a promise resolving with the updated resource, rejecting in case of error.
   */
  associate(
    resource: cumulio.Resource,
    id: UUID,
    association: cumulio.Association,
    properties: any
  ): Promise<any>;

  /**
   * Close the connection to the API.
   */
  close(): void;

  /**
   * Create a new entity.
   *
   * @param resource The type of resource to create. Eg. Resource.User.
   * @param properties Object, properties of the new resource.
   * @param associations Association Array (Optional): associations to set on the newly created resource: [{role: String, id: UUID}]
   *
   * @returns a promise resolving in case of completion, rejecting in case of error.
   */
  create(
    resource: cumulio.Resource,
    properties: any,
    associations?: cumulio.Association[]
  ): Promise<any>;

  /**
   * Mark an entity as deleted.
   *
   * @param resource The type of resource to create. Eg. Resource.User.
   * @param id UUID, the unique identifier of the resource to delete.
   * @param properties Object, additional properties needed to delete
   *                  (optional, see API reference for resources to use this with)
   *
   * @returns a promise resolving in case of completion, rejecting in case of error.
   */
  delete(resource: cumulio.Resource, id: UUID, properties: any): Promise<any>;

  /**
   * Dissociate two entities.
   *
   * @param resource The type of resource to create. Eg. Resource.User.
   * @param id UUID, the unique identifier of the 1st resource to dissociate.
   * @param association Object, 2nd resource to dissociate: {role: String, id: UUID}
   *
   * @returns a promise resolving with the updated resource, rejecting in case of error.
   */
  dissociate(
    resource: cumulio.Resource,
    id: UUID,
    association: cumulio.Association
  ): Promise<any>;

  /**
   * Retrieve one or more entities.
   *
   * @param resource The type of resource to create. Eg. Resource.User.
   * @param filter Object, filtering / limiting / paging options.
   *                  Reference: http://docs.sequelizejs.com/en/1.7.0/docs/models/#findall-search-for-multiple-elements-in-the-database
   *
   * @returns a promise resolving with the resources retrieved, rejecting in case of error.
   */
  get(resource: cumulio.Resource, filter: any): Promise<any>;

  /**
   * iframe integration
   */
  iframe(dashboardId: UUID, authorization: cumulio.Authorization): any;

  /**
   * Do a data query.
   *
   * @param filter Query, object consisting of dimensions & measures
   *
   * @returns a promise that either:
   * - In case of unsynchronized querying, resolves with the results of a query and rejects in case of error.
   *   on the server and rejects in case of error.
   */
  query(filter: cumulio.Query): Promise<any>;

  /**
   * Update properties of an entity.
   *
   * @param resource The type of resource to create. Eg. Resource.User.
   * @param id UUID, the unique identifier of the resource to update.
   * @param properties Object, properties to modify.
   *
   * @returns a promise resolving with the updated resource, rejecting in case of error.
   */
  update(resource: cumulio.Resource, id: UUID, properties: any): Promise<any>;

  /**
   * Validate data.
   *
   * @param resource The type of resource to create. Eg. Resource.User.
   * @param properties Object with attributes to validate.
   *
   * @returns a promise resolving with the boolean validation result, rejecting in case of error.
   */
  validate(resource: cumulio.Resource, properties: any): Promise<any>;

  static API_VERSION: string;

  static APP: string;

  static HOST: string;

  static HTTP_METHOD: {
    associate: string;
    create: string;
    delete: string;
    dissociate: string;
    get: string;
    update: string;
    validate: string;
  };

  static PORT: string;
}
