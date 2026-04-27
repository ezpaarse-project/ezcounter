type OrganizationID = {
  ISIL?: string[];
  ISNI?: string[];
  OCLC?: string[];
  Proprietary?: string[];
};

type AuthorID = {
  ISNI?: string;
  Name: string;
  ORCID?: string;
};

type ItemID = {
  DOI?: string;
  ISBN?: string;
  Online_ISSN?: string;
  Print_ISSN?: string;
  Proprietary?: string;
  URI?: string;
};

type BaseItem = {
  Article_Version?: string;
  Authors?: AuthorID[];
  Item_ID?: ItemID;
};

/**
 * Type for inserting a COUNTER 5.1 document header
 */
export type CreateR51DocumentHeader = {
  Created: string;
  Created_By: string;
  Institution_ID: OrganizationID;
  Institution_Name: string;
  Release: string;
  Report_Attributes?: object;
  Report_Filters: object & {
    Begin_Date: string;
    End_Date: string;
  };
  Report_ID: string;
  Report_Name: string;
};

/**
 * Type for inserting a COUNTER 5.1 document parent
 */
export type CreateR51DocumentParent = BaseItem & {
  Data_Type?: string;
  Item_Name?: string;
  Publication_Date?: string;
};

/**
 * Type for inserting a COUNTER 5.1 document item
 */
export type CreateR51DocumentItem = BaseItem & {
  Database?: string;
  Item?: string;
  Platform: string;
  Publication_Date?: string;
  Publisher?: string;
  Publisher_ID?: OrganizationID;
  Title?: string;
};

/**
 * Type for inserting a COUNTER 5.1 document attribute
 */
export type CreateR51DocumentAttribute = {
  Access_Method?: string;
  Access_Type?: string;
  Data_Type?: string;
  YOP?: string;
};

/**
 * Type for inserting a COUNTER 5.1 document
 */
export type CreateR51Document = CreateR51DocumentItem &
  CreateR51DocumentAttribute & {
    Count: number;
    Item_Parent?: CreateR51DocumentParent;
    Metric_Type: string;
    Report_Header: CreateR51DocumentHeader;
    X_Date_Month: string;
    X_Harvested_At: string;
  };
