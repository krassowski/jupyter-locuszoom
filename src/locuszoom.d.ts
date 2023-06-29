declare module 'locuszoom' {
  type IBaseAdapterArgs = [string, Object];
  namespace Adapters {
    function get(name: 'AssociationLZ'): Adapters.AssociationLZ;
    function add(name: string, adaper: Adapters.BaseAdapter);
  };
  interface ILayout {
    
  }
  class DataSources {
    add(namespace: string, item: IBaseAdapterArgs, override=false): DataSources;
  };
  namespace Layouts {
    function add(type: string, name: string, override: boolean=false): Object;
    function get(type: string, name: string, overrides: Object): ILayout;
  };
  function populate(selector: string, dataSources: DataSources, layout: Object);
};

namespace Adapters {
  /**
   * Replaced with the BaseLZAdapter class.
   * @public
   * @deprecated
   */
  export class BaseAdapter {
  }
  /**
   * Removed class for LocusZoom data adapters that receive their data over the web. Adds default config parameters
   *  (and potentially other behavior) that are relevant to URL-based requests.
   * @extends module:LocusZoom_Adapters~BaseAdapter
   * @deprecated
   * @param {string} config.url The URL for the remote dataset. By default, most adapters perform a GET request.
   * @inheritDoc
   */
  export class BaseApiAdapter {
  }
  /**
   * @extends module:undercomplicate.BaseUrlAdapter
   * @inheritDoc
   */
  export class BaseLZAdapter {
      /**
       * @param [config.cache_enabled=true]
       * @param [config.cache_size=3]
       * @param [config.url]
       * @param [config.prefix_namespace=true] Whether to modify the API response by prepending namespace to each field name.
       *   Most adapters will do this by default, so that each field is unambiguously defined based on where it comes from. (this helps to disambiguate two providers that return similar field names, like assoc:variant and catalog:variant)
       *   Typically, this is only disabled if the response payload is very unusual
       * @param {String[]} [config.limit_fields=null] If an API returns far more data than is needed, this can be used to simplify
       *   the payload by excluding unused fields. This can help to reduce memory usage for really big server responses like LD.
       */
      constructor(config?: {});
      _prefix_namespace: any;
      _limit_fields: boolean | Set<any>;
      /**
       * Determine how a particular request will be identified in cache. Most LZ requests are region based,
       *   so the default is a string concatenation of `chr_start_end`. This adapter is "region aware"- if the user
       *   zooms in, it won't trigger a network request because we alread have the data needed.
       * @param options Receives plot.state plus any other request options defined by this source
       * @returns {string}
       * @public
       */
      public _getCacheKey(options: any): string;
      /**
       * Add the "local namespace" as a prefix for every field returned for this request. Eg if the association api
       *   returns a field called variant, and the source is referred to as "assoc" within a particular data layer, then
       *   the returned records will have a field called "assoc:variant"
       *
       * @param records
       * @param options
       * @returns {*}
       * @public
       */
      public _postProcessResponse(records: any, options: any): any;
      /**
       * Convenience method, manually called in LZ sources that deal with dependent data.
       *
       * In the last step of fetching data, LZ adds a prefix to each field name.
       * This means that operations like "build query based on prior data" can't just ask for "log_pvalue" because
       *  they are receiving "assoc:log_pvalue" or some such unknown prefix.
       *
       * This helper lets us use dependent data more easily. Not every adapter needs to use this method.
       *
       * @param {Object} a_record One record (often the first one in a set of records)
       * @param {String} fieldname The desired fieldname, eg "log_pvalue"
       */
      _findPrefixedKey(a_record: any, fieldname: string): string;
  }
  /**
   * The base adapter for the UMich Portaldev API server. This adds a few custom behaviors that handle idiosyncrasies
   *   of one particular web server.
   * @extends module:LocusZoom_Adapters~BaseLZAdapter
   * @inheritDoc
   */
  export class BaseUMAdapter {
      /**
       * @param {Object} config
       * @param {String} [config.build] The genome build to be used by all requests for this adapter. (UMich APIs are all genome build aware). "GRCh37" or "GRCh38"
       */
      constructor(config?: {
          build?: string;
      });
      _genome_build: any;
      _validateBuildSource(build: any, source: any): void;
      /**
       * Some endpoints in the UM portaldev API returns columns of data, rather than rows. Convert the response to record objects, each row of a table being represented as an object of {field:value} pairs.
       * @param response_text
       * @param options
       * @returns {Object[]}
       * @public
       */
      public _normalizeResponse(response_text: any, options: any, ...args: any[]): any[];
  }
  /**
   * Retrieve Association Data from the LocusZoom/ Portaldev API (or compatible). Defines how to make a request
   *  to a specific REST API.
   * @public
   * @see module:LocusZoom_Adapters~BaseUMAdapter
   * @inheritDoc
   *
   * @param {Number} config.source The source ID for the dataset of interest, used to construct the request URL
   */
  export class AssociationLZ extends BaseUMAdapter {
      constructor(config?: {});
      _source_id: any;
      _getURL(request_options: any): string;
  }
  /**
   * Retrieve Gene Constraint Data, as fetched from the gnomAD server (or compatible graphQL api endpoint)
   *
   * This is intended to be the second request in a chain, with special logic that connects it to Genes data
   *  already fetched. It assumes that the genes data is returned from the UM API, and thus the logic involves
   *  matching on specific assumptions about `gene_name` format.
   *
   * @public
   * @see module:LocusZoom_Adapters~BaseUMAdapter
   */
  export class GeneConstraintLZ extends BaseLZAdapter {
      _buildRequestOptions(state: any, genes_data: any): any;
      _performRequest(options: any): Promise<any[] | Response>;
      /**
       * The gnomAD API has a very complex internal data format. Bypass any record parsing or transform steps.
       */
      _normalizeResponse(response_text: any): any;
  }
  /**
   * Retrieve Gene Data, as fetched from the LocusZoom/Portaldev API server (or compatible format)
   * @public
   * @see module:LocusZoom_Adapters~BaseUMAdapter
   * @param {string} config.url The base URL for the remote data
   * @param [config.build] The genome build to use
   *  May be overridden by a global parameter `plot.state.genome_build` so that all datasets can be fetched for the appropriate build in a consistent way.
   * @param {Number} [config.source] The ID of the chosen gene dataset. Most usages should omit this parameter and
   *  let LocusZoom choose the newest available dataset to use based on the genome build: defaults to recent GENCODE data, GRCh37.
   */
  export class GeneLZ extends BaseUMAdapter {
      constructor(config?: {});
      _prefix_namespace: boolean;
      /**
       * Add query parameters to the URL to construct a query for the specified region
       */
      _getURL(request_options: any): string;
  }
  /**
   * Fetch GWAS catalog data for a list of known variants, and align the data with previously fetched association data.
   * There can be more than one claim per variant; this adapter is written to support a visualization in which each
   * association variant is labeled with the single most significant hit in the GWAS catalog. (and enough information to link to the external catalog for more information)
   *
   * Sometimes the GWAS catalog uses rsIDs that could refer to more than one variant (eg multiple alt alleles are
   *  possible for the same rsID). To avoid missing possible hits due to ambiguous meaning, we connect the assoc
   *  and catalog data via the position field, not the full variant specifier. This source will auto-detect the matching
   *  field in association data by looking for the field name `position` or `pos`.
   *
   * @public
   * @see module:LocusZoom_Adapters~BaseUMAdapter
   */
  export class GwasCatalogLZ extends BaseUMAdapter {
      /**
       * @param {string} config.url The base URL for the remote data.
       * @param [config.build] The genome build to use when requesting the specific genomic region.
       *  May be overridden by a global parameter `plot.state.genome_build` so that all datasets can be fetched for the appropriate build in a consistent way.
       * @param {Number} [config.source] The ID of the chosen catalog. Most usages should omit this parameter and
       *  let LocusZoom choose the newest available dataset to use based on the genome build: defaults to recent EBI GWAS catalog, GRCh37.
       */
      constructor(config: any);
      /**
       * Add query parameters to the URL to construct a query for the specified region
       */
      _getURL(request_options: any): string;
  }
  /**
   * Fetch linkage disequilibrium information from a UMich LDServer-compatible API, relative to a reference variant.
   *  If no `plot.state.ldrefvar` is explicitly provided, this source will attempt to find the most significant GWAS
   *  variant and yse that as the LD reference variant.
   *
   * THIS ADAPTER EXPECTS TO RECEIVE ASSOCIATION DATA WITH FIELDS `variant` and `log_pvalue`. It may not work correctly
   *   if this information is not provided.
   *
   * This source is designed to connect its results to association data, and therefore depends on association data having
   *  been loaded by a previous request. For custom association APIs, some additional options might
   *  need to be be specified in order to locate the most significant SNP. Variant IDs of the form `chrom:pos_ref/alt`
   *  are preferred, but this source will attempt to harmonize other common data formats into something that the LD
   *  server can understand.
   *
   * @public
   * @see module:LocusZoom_Adapters~BaseUMAdapter
   */
  export class LDServer extends BaseUMAdapter {
      /**
       * @param {string} config.url The base URL for the remote data.
       * @param [config.build='GRCh37'] The genome build to use when calculating LD relative to a specified reference variant.
       *  May be overridden by a global parameter `plot.state.genome_build` so that all datasets can be fetched for the appropriate build in a consistent way.
       * @param [config.source='1000G'] The name of the reference panel to use, as specified in the LD server instance.
       *  May be overridden by a global parameter `plot.state.ld_source` to implement widgets that alter LD display.
       * @param [config.population='ALL'] The sample population used to calculate LD for a specified source;
       *  population names vary depending on the reference panel and how the server was populated wth data.
       *  May be overridden by a global parameter `plot.state.ld_pop` to implement widgets that alter LD display.
       * @param [config.method='rsquare'] The metric used to calculate LD
       */
      constructor(config: any);
      __find_ld_refvar(state: any, assoc_data: any): any;
      _buildRequestOptions(state: any, assoc_data: any, ...args: any[]): any;
      _getURL(request_options: any): string;
      _getCacheKey(options: any): string;
      _performRequest(options: any): any;
  }
  /**
   * Retrieve PheWAS data retrieved from a LocusZoom/PortalDev compatible API
   * @public
   * @see module:LocusZoom_Adapters~BaseUMAdapter
   * @param {string} config.url The base URL for the remote data
   * @param {String[]} config.build This datasource expects to be provided the name of the genome build that will
   *   be used to provide PheWAS results for this position. Note positions may not translate between builds.
   */
  export class PheWASLZ extends BaseUMAdapter {
      _getURL(request_options: any): string;
      _getCacheKey(options: any): string;
  }
  /**
   * Retrieve Recombination Rate Data, as fetched from the LocusZoom API server (or compatible)
   * @public
   * @see module:LocusZoom_Adapters~BaseUMAdapter
   * @param {string} config.url The base URL for the remote data
   * @param [config.build] The genome build to use
   *  May be overridden by a global parameter `plot.state.genome_build` so that all datasets can be fetched for the appropriate build in a consistent way.
   * @param {Number} [config.source] The ID of the chosen dataset. Most usages should omit this parameter and
   *  let LocusZoom choose the newest available dataset to use based on the genome build: defaults to recent HAPMAP recombination rate, GRCh37.
   */
  export class RecombLZ extends BaseUMAdapter {
      constructor(config: any);
      /**
       * Add query parameters to the URL to construct a query for the specified region
       */
      _getURL(request_options: any): string;
  }
  /**
   * Retrieve static blobs of data as raw JS objects. This does not perform additional parsing, which is required
   *  for some sources (eg it does not know how to join together LD and association data).
   *
   * Therefore it is the responsibility of the user to pass information in a format that can be read and
   * understood by the chosen plot- a StaticJSON source is rarely a drop-in replacement for existing layouts.
   *
   * This source is largely here for legacy reasons. More often, a convenient way to serve static data is as separate
   *  JSON files to an existing source (with the JSON url in place of an API).
   *
   *  Note: The name is a bit misleading. It receives JS objects, not strings serialized as "json".
   * @public
   * @see module:LocusZoom_Adapters~BaseLZAdapter
   * @param {object} config.data The data to be returned by this source (subject to namespacing rules)
   */
  export class StaticSource extends BaseLZAdapter {
      constructor(config?: {}, ...args: any[]);
      _data: any;
      _performRequest(options: any): Promise<any>;
  }

}