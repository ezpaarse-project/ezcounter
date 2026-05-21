import type { elastic } from '~/lib/elasticsearch';

const organizationId: elastic.MappingTypeMapping = {
  properties: {
    ISIL: { type: 'keyword' },
    ISNI: { type: 'keyword' },
    OCLC: { type: 'keyword' },
    Proprietary: { type: 'keyword' },
  },
};

const authorId: elastic.MappingTypeMapping = {
  properties: {
    INSI: { type: 'keyword' },
    Name: { type: 'keyword' },
    ORCID: { type: 'keyword' },
  },
};

const itemId: elastic.MappingTypeMapping = {
  properties: {
    DOI: { type: 'keyword' },
    ISBN: { type: 'keyword' },
    Online_ISSN: { type: 'keyword' },
    Print_ISSN: { type: 'keyword' },
    Proprietary: { type: 'keyword' },
    URI: { type: 'keyword' },
  },
};

const baseItem: elastic.MappingTypeMapping = {
  properties: {
    Article_Version: { type: 'keyword' },
    Authors: authorId,
    Item_ID: itemId,
  },
};

/**
 * Mapping to use on COUNTER 5.1 index
 */
export const mapping: elastic.MappingTypeMapping = {
  dynamic_templates: [
    {
      strings_as_keywords: {
        mapping: {
          type: 'keyword',
        },
        match_mapping_type: 'string',
      },
    },
  ],
  properties: {
    ...baseItem.properties,
    Access_Method: { type: 'keyword' },
    Access_Type: { type: 'keyword' },
    Count: { type: 'integer' },
    Data_Type: { type: 'keyword' },
    Database: { type: 'keyword' },
    Item: { type: 'keyword' },
    Item_Parent: {
      properties: {
        ...baseItem.properties,
        Data_Type: { type: 'keyword' },
        Item_Name: { type: 'keyword' },
        Publication_Date: { type: 'keyword' },
      },
    },
    Metric_Type: { type: 'keyword' },
    Platform: { type: 'keyword' },
    Publication_Date: { type: 'keyword' },
    Publisher: { type: 'keyword' },
    Publisher_ID: organizationId,
    Report_Header: {
      properties: {
        Created: { type: 'date' },
        Created_By: { type: 'keyword' },
        Institution_ID: organizationId,
        Institution_Name: { type: 'keyword' },
        Release: { type: 'keyword' },
        Report_Attributes: { type: 'object' },
        Report_Filters: {
          properties: {
            Begin_Date: { type: 'keyword' },
            End_Date: { type: 'keyword' },
          },
        },
        Report_ID: { type: 'keyword' },
        Report_Name: { type: 'keyword' },
      },
    },
    Title: { type: 'keyword' },
    X_Date_Month: { format: 'yyyy-MM', type: 'date' },
    X_Harvested_At: { type: 'date' },
    YOP: {
      fields: {
        date: {
          ignore_malformed: true,
          type: 'date',
        },
      },
      type: 'keyword',
    },
  },
};

/**
 * Settings to use on COUNTER 5.1 index
 */
export const settings: elastic.IndicesIndexSettings = {
  number_of_shards: 1,
};
