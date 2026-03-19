import r51Schema from './schema.json' with { type: 'json' };

// Patches definitions

/**
 * Fix Registry_Record regex to allow any string, as we don't use it in ezMESURE
 *
 * Updates by reference
 *
 * @param schemas to fix
 */
function fixRegistryRecord(
  ...schemas: {
    properties: { Registry_Record: { pattern?: string } };
    required: string[];
  }[]
): void {
  for (const schema of schemas) {
    const { Registry_Record: item } = schema.properties;
    item.pattern = undefined;

    schema.required = schema.required.filter(
      (property) => property !== 'Registry_Record'
    );
  }
}

/**
 * Fix Begin_Date and End_Date to allow not providing day of date
 *
 * Updates by reference
 *
 * @param schemas to fix
 */
function fixPeriodDateFormat(
  ...schemas: {
    properties: {
      Begin_Date?: { format?: string; pattern?: string };
      End_Date?: { format?: string; pattern?: string };
    };
  }[]
): void {
  const pattern = '^([0-9]{4})-([0-9]{2})(-[0-9]{2})?$';

  for (const schema of schemas) {
    if (schema.properties.Begin_Date) {
      const { Begin_Date: item } = schema.properties;
      item.format = undefined;
      item.pattern = pattern;
    }
    if (schema.properties.End_Date) {
      const { End_Date: item } = schema.properties;
      item.format = undefined;
      item.pattern = pattern;
    }
  }
}

/**
 * Removes restriction that enforces Authors to be unique
 * (in some cases multiples authors are reported as "null null")
 *
 * Updates by reference
 *
 * @param schemas to fix
 */
function removeAuthorsUniqueness(
  ...schemas: {
    type: string;
    uniqueItems?: boolean;
  }[]
): void {
  for (const schema of schemas) {
    if (schema.type === 'array' && schema.uniqueItems) {
      schema.uniqueItems = undefined;
    }
  }
}

/**
 * Fix Exception having Severity (coming from R5)
 *
 * Updates by reference
 *
 * @param schemas to fix
 */
function fixSeverityException(
  ...schemas: {
    type: string;
    properties: Record<string, unknown>;
  }[]
): void {
  for (const schema of schemas) {
    if (schema.type === 'object') {
      schema.properties.Severity = {
        type: 'string',
      };
    }
  }
}
/**
 * Fix performances needing at least 2 properties in schema
 * while actually needing one given the case
 *
 * Updates by reference
 *
 * @deprecated should be fixed by R5.1.1
 *
 * @param schemas to fix
 */
function fixPerfMinProperties(
  ...schemas: {
    type: string;
    minProperties: number;
  }[]
): void {
  // eslint-disable-next-line no-restricted-syntax
  for (const schema of schemas) {
    if (schema.type === 'object') {
      schema.minProperties = 1;
    }
  }
}
/**
 * Fix ISBN format by removing the need of having hyphens
 *
 * Updates by reference
 *
 * @deprecated should be fixed by R5.1.1
 *
 * @param schemas to fix
 */
function fixISBNHyphens(
  ...schemas: {
    type: string;
    properties: {
      ISBN: Record<string, unknown>;
    };
  }[]
): void {
  // eslint-disable-next-line no-restricted-syntax
  for (const schema of schemas) {
    if (schema.type === 'object') {
      schema.properties.ISBN = {
        oneOf: [
          // Keep original validation
          schema.properties.ISBN,
          // Add un-hyphened validation
          {
            type: 'string',
            pattern: '^97[89][0-9]+$',
            minLength: 13,
            maxLength: 13,
          },
        ],
      };
    }
  }
}

// Patches application

fixRegistryRecord(
  r51Schema.definitions.Status,
  r51Schema.definitions.Base_Report_Header
);

fixPeriodDateFormat(r51Schema.definitions.Base_Report_Filters);

removeAuthorsUniqueness(r51Schema.definitions.Authors);

fixSeverityException(
  r51Schema.definitions.Exception,
  r51Schema.definitions.Exception_0,
  r51Schema.definitions['Exception_1-999'],
  r51Schema.definitions.Exception_1000,
  r51Schema.definitions.Exception_1010,
  r51Schema.definitions.Exception_1011,
  r51Schema.definitions.Exception_1020,
  r51Schema.definitions.Exception_1030,
  r51Schema.definitions.Exception_2000,
  r51Schema.definitions.Exception_2010,
  r51Schema.definitions.Exception_2011,
  r51Schema.definitions.Exception_2020,
  r51Schema.definitions.Exception_3020,
  r51Schema.definitions.Exception_3030,
  r51Schema.definitions.Exception_3031,
  r51Schema.definitions.Exception_3032,
  r51Schema.definitions.Exception_3040,
  r51Schema.definitions.Exception_3050,
  r51Schema.definitions.Exception_3060,
  r51Schema.definitions.Exception_3061,
  r51Schema.definitions.Exception_3062,
  r51Schema.definitions.Exception_3063,
  r51Schema.definitions.Exception_3070
);

fixPerfMinProperties(
  r51Schema.definitions.TR_Performance,
  r51Schema.definitions.TR_B2_Performance
);

fixISBNHyphens(r51Schema.definitions.Item_ID);

export { r51Schema as schema };
