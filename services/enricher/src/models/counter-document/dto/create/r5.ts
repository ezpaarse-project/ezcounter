type Contributor = {
  Type: string;
  Name: string;
  Identfier?: string;
};

type BaseItem = {
  Data_Type?: string;
  Item_Attributes?: Record<string, string[]>;
  Item_Contributors?: Contributor[];
  Item_Dates?: Record<string, string[]>;
  Item_ID?: Record<string, string[]>;
};

/**
 * Type for inserting a COUNTER 5.1 document header
 */
export type CreateR5DocumentHeader = {
  Created?: string;
  Created_By?: string;
  Customer_ID?: string;
  Institution_ID?: Record<string, string[]>;
  Institution_Name?: string;
  Release?: string;
  Report_Attributes?: Record<string, string[]>;
  Report_Filters: Record<string, string[]>;
  Report_ID: string;
  Report_Name?: string;
};

/**
 * Type for inserting a COUNTER 5.1 document parent
 */
export type CreateR5DocumentParent = BaseItem & {
  Item_Name?: string;
};

/**
 * Type for inserting a COUNTER 5.1 document item
 */
export type CreateR5DocumentItem = BaseItem & {
  Access_Method?: string;
  Access_Type?: string;
  Database?: string;
  Item?: string;
  Platform?: string;
  Publisher?: string;
  Publisher_ID?: Record<string, string[]>;
  Section_Type?: string;
  Title?: string;
  YOP?: string;
};

/**
 * Type for inserting a COUNTER 5.1 document
 */
export type CreateR5Document = CreateR5DocumentItem & {
  Count: number;
  Item_Parent?: CreateR5DocumentParent;
  Metric_Type: string;
  Report_Header: CreateR5DocumentHeader;
  X_Date_Month: string;
  X_Harvested_At: string;
};
