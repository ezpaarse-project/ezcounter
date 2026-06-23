import { describe, expect, it } from 'vitest';

import type { DataHostSupportedReport } from '~/models/data-host/dto';

import type { HarvestReportOptions } from './dto';
import { limitReportOptionsWithSupported } from './limits';

describe('limit report with supported', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getReportOptions = (): HarvestReportOptions => ({
    id: 'ir',
    period: { end: '2025-12', start: '2025-01' },
  });

  // oxlint-disable-next-line consistent-function-scoping
  const getSupportedReport = (): DataHostSupportedReport => ({
    createdAt: new Date(),
    dataHostId: '',
    firstMonthAvailable: '',
    id: 'ir',
    lastMonthAvailable: '',
    params: {},
    release: '5.1',
    supported: true,
    updatedAt: null,
  });

  it('should change nothing if request is supported', () => {
    expect.hasAssertions();
    const options = getReportOptions();
    const report = getSupportedReport();

    const result = limitReportOptionsWithSupported(options, report);

    expect(result).toMatchObject(options);
  });

  it('should change nothing if report is unknown', () => {
    expect.hasAssertions();
    const options = getReportOptions();
    options.id = 'custom:tr';

    // oxlint-disable-next-line unicorn/no-useless-undefined
    const result = limitReportOptionsWithSupported(options, undefined);

    expect(result).toMatchObject(options);
  });

  it('should return null if unsupported', () => {
    expect.hasAssertions();
    const options = getReportOptions();
    const report = getSupportedReport();
    report.supported = false;

    const result = limitReportOptionsWithSupported(options, report);

    expect(result).toBeNull();
  });

  it("should change period if there's limits", () => {
    expect.hasAssertions();
    const options = getReportOptions();
    const report = getSupportedReport();
    report.firstMonthAvailable = '2025-03';
    report.lastMonthAvailable = '2025-09';

    const result = limitReportOptionsWithSupported(options, report);

    expect(result).toHaveProperty('period.start', '2025-03');
    expect(result).toHaveProperty('period.end', '2025-09');
  });
});
