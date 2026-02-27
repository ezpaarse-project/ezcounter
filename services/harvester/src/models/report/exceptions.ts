import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import type { HarvestException } from '@ezcounter/models/harvest';

import type { RawReportException } from './types';

/**
 * Exception codes from COUNTER CoP
 *
 * @see https://cop5.projectcounter.org/en/5.0.3/appendices/f-handling-errors-and-exceptions.html#appendix-f
 * @see https://cop5.projectcounter.org/en/5.1/appendices/d-handling-errors-and-exceptions.html
 */
export enum CounterCodes {
  /** The service is executing a request, but due to internal errors cannot complete the request. If possible, the server should provide an explanation in the additional Data element. */
  SERVICE_UNAVAILABLE = 1000,
  /** The service is too busy to execute the incoming request. The client should retry the request after some reasonable time. */
  SERVICE_BUSY = 1010,
  /** Services queueing incoming report requests must return a response with this Exception and no payload to inform the client about the processing status. The client should retry the request after some reasonable time. */
  QUEUED_FOR_PROCESSING = 1011,
  /** If the service sets a limit on the number of requests a client can make within a given timeframe, the server will return this Exception when the client exceeds that limit. The server would provide an explanation of the limit in the additional Data element (e.g. “Client has made too many requests. This server allows only 500 requests per day per requestor_id and customer_id.”). */
  TOO_MANY_REQUESTS = 1020,
  /** There is insufficient data in the request to begin processing (e.g. missing requestor_id, no customer_id, etc.). */
  INSUFFICIENT_INFORMATION = 1030,
  /**  If requestor_id is not recognized or not authorized by the service.*/
  UNAUTHORIZED_REQUESTOR = 2000,
  /** If requestor_id has not been authorized to harvest usage for the institution identified by the customer_id, or if the customer_id is not recognized. */
  UNAUTHORIZED_REQUESTOR_INSTITUTION = 2010,
  /** Reporting to “The World”, customer_id 0000000000000000, is not supported. */
  GLOBAL_REPORTS_NOT_SUPPORTED = 2011,
  /** The service requires a valid APIKey to access usage data and the key provided was not valid or not authorized for the data being requested. */
  INVALID_API_KEY = 2020,
  /** The service requires IP authorization, and the IP address used by the client is not authorized. The server MUST include information on how this issue can be resolved in the Data element or include a Help_URL that points to the information. */
  UNAUTHORIZED_IP_ADDRESS = 2030,
  /** The requested report name, or other means of identifying a report that the service can process is not matched against the supported reports. */
  UNSUPPORTED_REPORT = 3000,
  /** The requested version of the report is not supported by the service. */
  UNSUPPORTED_REPORT_VERSION = 3010,
  /** Any format or logic errors involving date computations (e.g., end_date cannot be less than begin_date). */
  INVALID_DATES = 3020,
  /** The service did not find any data for the specified date range and other filters (if any). */
  USAGE_NOT_AVAILABLE = 3030,
  /** The service has not yet processed the usage for one or more of the requested months, if some months are available that data should be returned. The Exception should include the months not processed in the additional Data element. */
  USAGE_NOT_READY_FOR_REQUESTED_DATES = 3031,
  /** The service does not have the usage for one or more of the requested months because the requested begin_date is earlier than the first month for which data has been processed and is available. If some months are available that data should be returned. The Exception should include the information about the months processed and available in the additional Data element. */
  USAGE_NO_LONGER_AVAILABLE = 3032,
  /** The request could not be fulfilled in its entirety, since some of the requested data is missing. The server should return the available data and provide an explanation in the additional Data element. */
  PARTIAL_DATA = 3040,
  /** The request contained one or more parameters that are not recognized by the server in the context of the report being serviced. The server should list the names of unsupported parameters in the additional Data element. */
  PARAM_NOT_RECOGNIZED_IN_CONTEXT = 3050,
  /** The request contained one or more filter values that are not supported by the server. The server should list the names of unsupported filter values in the additional Data element. */
  INVALID_REPORT_FILTER_VALUE = 3060,
  /** A filter element includes multiple values in a pipe-delimited list; however, the supplied values are not all of the same scope (e.g., item_id filter includes article level DOIs and journal level DOIs or ISSNs). */
  INCONGRUOUS_REPORT_FILTER_VALUE = 3061,
  /** The request contained one or more report attribute values that are not supported by the server. The server should list the names of unsupported report attribute values in the additional Data element. */
  UNSUPPORTED_REPORT_ATTRIBUTE_VALUES = 3062,
  /** The request contained include_component_details=True, but reporting on component usage is not supported. */
  COMPONENT_DETAILS_NOT_SUPPORTED = 3063,
  /** A required filter was not included in the request. Which filters are required will depend on the report and the service being called. The server should list the names of the missing filters in the additional Data element. */
  REQUIRED_FILTER_MISSING = 3070,
}

/**
 * How common HTTP statuses should be converted to Harvest Exception
 *
 * @see https://cop5.projectcounter.org/en/5.1/appendices/d-handling-errors-and-exceptions.html
 */
const EXCEPTION_PER_HTTP_STATUS: Record<number, HarvestException | undefined> =
  {
    // 200+
    [StatusCodes.ACCEPTED]: {
      severity: 'info',
      code: `counter:${CounterCodes.QUEUED_FOR_PROCESSING}`,
      message: 'Report is being processed',
    },
    // 400+
    [StatusCodes.BAD_REQUEST]: {
      severity: 'error',
      code: `counter:${CounterCodes.INSUFFICIENT_INFORMATION}`,
      message: 'Insufficient Information to Process Request',
    },
    [StatusCodes.UNAUTHORIZED]: {
      severity: 'error',
      code: `counter:${CounterCodes.UNAUTHORIZED_REQUESTOR}`,
      message: 'Requestor Not Authorized to Access Service',
    },
    [StatusCodes.FORBIDDEN]: {
      severity: 'error',
      code: `counter:${CounterCodes.UNAUTHORIZED_REQUESTOR_INSTITUTION}`,
      message: 'Requestor is Not Authorized to Access Usage for Institution',
    },
    [StatusCodes.NOT_FOUND]: {
      severity: 'error',
      code: `counter:${CounterCodes.UNSUPPORTED_REPORT}`,
      message: 'Report Not Supported',
    },
    [StatusCodes.TOO_MANY_REQUESTS]: {
      severity: 'error',
      code: `counter:${CounterCodes.TOO_MANY_REQUESTS}`,
      message: 'Client has made too many requests',
    },
    // 500+
    [StatusCodes.INTERNAL_SERVER_ERROR]: {
      severity: 'error',
      code: `counter:${CounterCodes.SERVICE_UNAVAILABLE}`,
      message: 'Service Not Available',
    },
    [StatusCodes.SERVICE_UNAVAILABLE]: {
      severity: 'error',
      code: `counter:${CounterCodes.SERVICE_BUSY}`,
      message: 'Service Busy',
    },
  };

/**
 * Get severity from exception code
 */
const SEVERITY_PER_COUNTER_CODE: Record<
  string,
  HarvestException['severity'] | undefined
> = {
  '0': 'info',
  // 1 to 999 are considered as warning
  [CounterCodes.SERVICE_UNAVAILABLE]: 'error',
  [CounterCodes.SERVICE_BUSY]: 'error',
  [CounterCodes.QUEUED_FOR_PROCESSING]: 'info',
  [CounterCodes.TOO_MANY_REQUESTS]: 'error',
  [CounterCodes.INSUFFICIENT_INFORMATION]: 'error',
  [CounterCodes.UNAUTHORIZED_REQUESTOR]: 'error',
  [CounterCodes.UNAUTHORIZED_REQUESTOR_INSTITUTION]: 'error',
  [CounterCodes.GLOBAL_REPORTS_NOT_SUPPORTED]: 'error',
  [CounterCodes.INVALID_API_KEY]: 'error',
  [CounterCodes.UNAUTHORIZED_IP_ADDRESS]: 'error',
  [CounterCodes.UNSUPPORTED_REPORT]: 'error',
  [CounterCodes.UNSUPPORTED_REPORT_VERSION]: 'error',
  [CounterCodes.INVALID_DATES]: 'error',
  [CounterCodes.USAGE_NOT_AVAILABLE]: 'error',
  [CounterCodes.USAGE_NOT_READY_FOR_REQUESTED_DATES]: 'warn',
  [CounterCodes.USAGE_NO_LONGER_AVAILABLE]: 'warn',
  [CounterCodes.PARTIAL_DATA]: 'warn',
  [CounterCodes.PARAM_NOT_RECOGNIZED_IN_CONTEXT]: 'warn',
  [CounterCodes.INVALID_REPORT_FILTER_VALUE]: 'warn',
  [CounterCodes.INCONGRUOUS_REPORT_FILTER_VALUE]: 'warn',
  [CounterCodes.UNSUPPORTED_REPORT_ATTRIBUTE_VALUES]: 'warn',
  [CounterCodes.COMPONENT_DETAILS_NOT_SUPPORTED]: 'warn',
  [CounterCodes.REQUIRED_FILTER_MISSING]: 'warn',
};

/**
 * Normalise severity from an exception from a COUNTER report
 *
 * @param raw - Exception severity from COUNTER report
 *
 * @returns The local severity
 */
function normaliseSeverity(
  raw: string | undefined
): HarvestException['severity'] {
  switch (raw?.toLowerCase()) {
    case 'fatal':
    case 'error':
    case 'err':
      return 'error';

    case 'warning':
    case 'warn':
      return 'warn';

    case 'info':
    case 'debug':
      return 'info';

    default:
      return 'error';
  }
}

/**
 * Normalise exception from an HTTP Code
 *
 * @param code - The HTTP code of the request
 *
 * @returns The matching harvest exception, if found
 */
export function asHarvestException(code: number): HarvestException | undefined;
/**
 * Normalise exception from a COUNTER report
 *
 * @param raw - The exception from a COUNTER report
 *
 * @returns The normalised exception
 */
export function asHarvestException(raw: RawReportException): HarvestException;
export function asHarvestException(
  input: number | RawReportException
): HarvestException | undefined {
  // Input is an HTTP Code
  if (typeof input === 'number') {
    const standard = EXCEPTION_PER_HTTP_STATUS[input];

    if (standard) {
      return standard;
    }

    if (!(input in StatusCodes)) {
      return {
        severity: 'error',
        code: `http:${input}`,
        message: 'Unknown status',
      };
    }

    if (input >= 400) {
      return {
        severity: 'error',
        code: `http:${input}`,
        message: getReasonPhrase(input),
      };
    }

    return undefined;
  }
  // Input is an exception from a COUNTER report

  // 1 to 999 are considered as warning
  const codeNumber = Number.parseInt(`${input.Code}`, 10);

  const severity =
    1 <= codeNumber && codeNumber <= 999
      ? 'warn'
      : SEVERITY_PER_COUNTER_CODE[`${input.Code}`] ||
        normaliseSeverity(`${input.Severity}`);

  return {
    severity,
    code: `counter:${input.Code}`,
    message: input.Data || input.Message || 'Unexpected error occurred',
    helpUrl: input.Help_URL,
  };
}

export { asHarvestError } from '@ezcounter/models/lib/harvest';
