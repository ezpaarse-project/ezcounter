import type { elastic } from '~/lib/elasticsearch';

const baseItem: elastic.MappingTypeMapping = {
  properties: {
    Data_Type: { type: 'keyword' },
    Item_Attributes: { type: 'object' },
    Item_Contributors: {
      properties: {
        Identifier: { type: 'keyword' },
        Name: { type: 'keyword' },
        Type: { type: 'keyword' },
      },
    },
    Item_Dates: { type: 'object' },
    Item_ID: { type: 'object' },
  },
};

/**
 * Mapping to use on COUNTER 5 index
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
    Database: { type: 'keyword' },
    Item: { type: 'keyword' },
    Item_Parent: {
      properties: {
        ...baseItem.properties,
        Item_Name: { type: 'keyword' },
      },
    },
    Metric_Type: { type: 'keyword' },
    Platform: { type: 'keyword' },
    Publisher: { type: 'keyword' },
    Publisher_ID: { type: 'object' },
    Report_Header: {
      properties: {
        Created: { type: 'date' },
        Created_By: { type: 'keyword' },
        Customer_ID: { type: 'keyword' },
        Institution_ID: { type: 'object' },
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
    Section_Type: { type: 'keyword' },
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
