import type { JSONType } from '@ezcounter/dto';

/**
 * Definition of an OQO filter operator
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type OQOOperator = 'is' | '>' | '>=' | '<' | '<=' | 'has' | 'in collection';

/**
 * Definition of an OQO filter value
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type OQOValue = string | number | boolean;

/**
 * Definition of an OQO filter leaf
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type OQOLeafFilter = {
  column_id: string;
  is_negated?: boolean;
  operator?: OQOOperator;
  value: OQOValue;
};

/**
 * Definition of an OQO branch operator
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type OQOJoin = 'and' | 'or';

/**
 * Definition of an OQO filter branch
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type OQOBranchFilter = {
  filters: OQOFilter[];
  join: OQOJoin;
  is_negated?: boolean;
};

/**
 * Definition of an OQO filter (can be a branch with other filters or a leaf)
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type OQOFilter = OQOBranchFilter | OQOLeafFilter;

/**
 * Definition of an OpenAlex entity
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type QOQEntityType =
  | 'authors'
  | 'awards'
  | 'concepts'
  | 'continents'
  | 'countries'
  | 'domains'
  | 'fields'
  | 'funders'
  | 'institution-types'
  | 'institutions'
  | 'keywords'
  | 'languages'
  | 'licenses'
  | 'locations'
  | 'oa-statuses'
  | 'publishers'
  | 'sdgs'
  | 'source-types'
  | 'sources'
  | 'subfields'
  | 'topics'
  | 'types'
  | 'works';

/**
 * Definition of an OpenAlex corpus
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type OQOCorpus = 'all' | 'core' | 'expansion';

/**
 * Definition of an OQO query
 *
 * @see https://api.openalex.org/query/spec/oqo
 */
type OQOQuery = {
  corpus?: OQOCorpus;
  filter_rows: OQOFilter[];
  get_rows: QOQEntityType;
  group_by: { column_id: string }[];
  sample?: number;
  seed?: string | number;
};

/**
 * Utility to create a OQO query
 */
type QueryBuilder = {
  /**
   * Which works corpus (only applied on works)
   *
   * @param corpus - The corpus
   *
   * @returns The query builder
   */
  corpus: (corpus: OQOCorpus) => QueryBuilder;
  /**
   * Group results into buckets. Can be applied multiple times.
   *
   * @param column - The column to group results
   *
   * @returns The query builder
   */
  groupBy: (column: string) => QueryBuilder;
  /**
   * Random sample of `n` results. Must be between 1 and 10000
   *
   * @param count - The number of results
   * @param seed - Seed that makes a `sample` reproducible
   *
   * @returns The query builder
   */
  sample: (count: number, seed?: string | number) => QueryBuilder;
  /**
   * Prepare serialization of the builder
   *
   * @returns The OQO query
   */
  toJSON: () => JSONType;
  /**
   * The filters, entries are AND-end. Can be applied multiple times (will be an AND with others)
   *
   * @param filters - The filters, you can use others `oqo` utilities
   *
   * @returns The query builder
   */
  where: (...filters: OQOFilter[]) => QueryBuilder;
};

/**
 * Utility function to create a filter branch
 *
 * @param leafs - The combination of filters
 *
 * @returns The branch
 */
type BranchBuilder = (...leafs: OQOFilter[]) => OQOBranchFilter;

/**
 * Utility function to create a filter leaf
 *
 * @param column - Filter field identifier; dot notation for nested fields.
 * @param value - The value to filter by
 * @param isNegated - If the filter should be negated
 *
 * @returns The leaf
 */
type LeafBuilder = (
  column: string,
  value: OQOValue,
  isNegated?: boolean
) => OQOLeafFilter;

type OQO = {
  /**
   * Creates a query builder for authors.
   *
   * > An author is a person who creates works.
   *
   * @returns A query builder
   */
  authors: () => QueryBuilder;
  /**
   * Creates a query builder for awards.
   *
   * > An award is a single research grant: a specific pot of money a funder gave for a project.
   *
   * @returns A query builder
   */
  awards: () => QueryBuilder;
  /**
   * Creates a query builder for funders.
   *
   * > A funder is an organization that funds research — a government agency, foundation, or charity.
   *
   * @returns A query builder
   */
  funders: () => QueryBuilder;
  /**
   * Creates a query builder for institutions.
   *
   * > An institution is an organization that authors are affiliated with — a university, company, hospital, government agency, non-profit, and more.
   *
   * @returns A query builder
   */
  institutions: () => QueryBuilder;
  /**
   * Creates a query builder for publishers.
   *
   * > A publisher is a company or organization that distributes works — the parent behind the sources (journals, conference series, repositories) where works appear.
   *
   * @returns A query builder
   */
  publishers: () => QueryBuilder;
  /**
   * Creates a query builder for sources.
   *
   * > A source is a venue where works appear: a journal, a conference proceedings series, a preprint or institutional repository, an ebook platform, or a book series.
   *
   * @returns A query builder
   */
  sources: () => QueryBuilder;
  /**
   * Creates a query builder for works.
   *
   * > A work is any scholarly document: a journal article, conference paper, book or book chapter, dataset, dissertation, preprint, and more.
   *
   * @returns A query builder
   */
  works: () => QueryBuilder;

  /**
   * Utility to group multiple filters into a `AND` branch
   *
   * @returns The created branch
   */
  and: BranchBuilder;
  /**
   * Utility to group multiple filters into a `OR` branch
   *
   * @returns The created branch
   */
  or: BranchBuilder;

  /**
   * Utility to create a filter with the operator `has` (full text search)
   */
  has: LeafBuilder;
  /**
   * Utility to create a filter with the operator `>`
   */
  gt: LeafBuilder;
  /**
   * Utility to create a filter with the operator `>=`
   */
  gte: LeafBuilder;
  /**
   * Utility to create a filter with the operator `<=`
   */
  lte: LeafBuilder;
  /**
   * Utility to create a filter with the operator `<`
   */
  lt: LeafBuilder;
  /**
   * Utility to create a filter with the operator `in collection`
   */
  in: LeafBuilder;
  /**
   * Utility to create a filter with the operator `is`
   */
  is: LeafBuilder;
};

/**
 * Utility to create a builder for an OQO query
 *
 * @param entity the entity to return
 *
 * @returns Function that setup the OQO query
 */
function createBuilder(entity: QOQEntityType): QueryBuilder {
  const query: OQOQuery = {
    filter_rows: [],
    get_rows: entity,
    group_by: [],
  };

  const builder: QueryBuilder = {
    corpus: (data) => {
      if (entity === 'works') {
        query.corpus = data;
      }
      return builder;
    },
    groupBy: (column) => {
      query.group_by.push({ column_id: column });
      return builder;
    },
    sample: (count, seed) => {
      query.sample = count;
      query.seed = seed;
      return builder;
    },
    toJSON: () => query,
    where: (...filters) => {
      query.filter_rows.push(...filters);
      return builder;
    },
  };

  return builder;
}

/**
 * Utility to create a filter branch builder for an OQO query
 *
 * @param join - The operator of the branch
 *
 * @returns Function that creates a filter branch
 */
const createBranchBuilder =
  (join: OQOJoin): BranchBuilder =>
  (...leafs) => ({
    filters: leafs,
    join,
  });

/**
 * Utility to create a filter leaf builder for an OQO query
 *
 * @param operator - The operator of the leaf
 *
 * @returns Function that creates a filter leaf
 */
const createLeafBuilder =
  (operator: OQOOperator): LeafBuilder =>
  (column, value, not) => ({
    column_id: column,
    is_negated: Boolean(not),
    operator,
    value,
  });

/**
 * Utilities to create a OpenAlex Query Objects query
 */
// oxlint-disable-next-line sort-keys
export const oqo: OQO = {
  // Entities
  authors: () => createBuilder('authors'),
  awards: () => createBuilder('awards'),
  funders: () => createBuilder('funders'),
  institutions: () => createBuilder('institutions'),
  publishers: () => createBuilder('publishers'),
  sources: () => createBuilder('sources'),
  works: () => createBuilder('works'),
  // Branches
  and: createBranchBuilder('and'),
  or: createBranchBuilder('or'),
  // Leafs
  has: createLeafBuilder('has'),
  gt: createLeafBuilder('>'),
  gte: createLeafBuilder('>='),
  lte: createLeafBuilder('<='),
  lt: createLeafBuilder('<'),
  in: createLeafBuilder('in collection'),
  is: createLeafBuilder('is'),
};
