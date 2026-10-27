import { describe, expect, it } from 'vitest';

import type {
  CounterPlatform,
  CounterPlatformReport,
  CounterService,
} from './dto';
import {
  formatPlatformToHost,
  formatReport,
  formatServiceToRelease,
} from './format';

const platform: CounterPlatform = {
  abbrev: '',
  id: 'bf9a2458-2386-48c5-a810-4a33c2dacf80',
  name: 'Academy of Management',
  reports: [],
  sushi_services: [],
};

describe('format registry platform', () => {
  it('should match source', () => {
    expect.assertions(2);

    const host = formatPlatformToHost(platform);

    expect(host).toHaveProperty('id', 'bf9a2458-2386-48c5-a810-4a33c2dacf80');
    expect(host).toHaveProperty('name', 'Academy of Management');
  });

  it('should mark host as not local', () => {
    expect.assertions(1);

    const host = formatPlatformToHost(platform);

    expect(host).toHaveProperty('local', false);
  });

  it('should add abbrev to name', () => {
    expect.assertions(1);

    const host = formatPlatformToHost({
      ...platform,
      abbrev: 'AOM',
    });

    expect(host).toHaveProperty('name', 'Academy of Management (AOM)');
  });
});

describe('format registry service', () => {
  const service: CounterService = {
    api_key_required: false,
    counter_release: '5.1',
    last_audit: {
      audit_status: 'Currently valid audit',
    },
    platform_attr_required: false,
    platform_specific_info: '',
    requestor_id_required: true,
    url: 'https://api.taylorandfrancis.com/v2/counterreports/r51',
  };

  it('should match source', () => {
    expect.assertions(5);

    const release = formatServiceToRelease(service, platform);

    expect(release).toHaveProperty('dataHostId', platform.id);
    expect(release).toHaveProperty('release', '5.1');
    expect(release).toHaveProperty(
      'baseURL',
      'https://api.taylorandfrancis.com/v2/counterreports/r51'
    );
    expect(release).toHaveProperty('requiredAuth.api_key', false);
    expect(release).toHaveProperty('requiredAuth.requestor_id', true);
  });

  it('should mark release as supported', () => {
    expect.assertions(1);

    const release = formatServiceToRelease(service, platform);

    expect(release).toHaveProperty('supported', true);
  });

  describe('platform parameter', () => {
    it('should NOT extract platform if not required', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(
        {
          ...service,
          platform_attr_required: false,
          platform_specific_info: 'ck',
        },
        platform
      );

      expect(release).not.toHaveProperty('params.platform');
    });

    it('should extract platform if info is the value', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(
        {
          ...service,
          platform_attr_required: true,
          platform_specific_info: 'ck',
        },
        platform
      );

      expect(release).toHaveProperty('params.platform', 'ck');
    });

    it('should extract platform if info have the value', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(
        {
          ...service,
          platform_attr_required: true,
          platform_specific_info: 'Platform: clinicalkey',
        },
        platform
      );

      expect(release).toHaveProperty('params.platform', 'clinicalkey');
    });

    it('should extract platform if info have the name of the host', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(
        {
          ...service,
          platform_attr_required: true,
          platform_specific_info:
            'Resource Standard Format: Academy of Management. Note that URL-encoded versions were originally added to support manual URL construction, but are no longer necessary.',
        },
        platform
      );

      expect(release).toHaveProperty(
        'params.platform',
        'Academy of Management'
      );
    });

    it('should NOT extract platform if unknown', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(
        {
          ...service,
          platform_attr_required: true,
          platform_specific_info: 'Please use the ABCDE parameter',
        },
        platform
      );

      expect(release).not.toHaveProperty('params.platform');
    });
  });

  describe('compliant property', () => {
    it('should be compliant if audit is valid', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(service, platform);

      expect(release).toHaveProperty('compliant', true);
    });

    it('should be NOT compliant if audit is expired', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(
        {
          ...service,
          last_audit: {
            audit_status: 'Audit expired',
          },
        },
        platform
      );

      expect(release).toHaveProperty('compliant', false);
    });

    it('should be NOT compliant if audit is in progress', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(
        {
          ...service,
          last_audit: {
            audit_status: 'Audit in progress',
          },
        },
        platform
      );

      expect(release).toHaveProperty('compliant', false);
    });

    it('should be NOT compliant if audit is failed', () => {
      expect.assertions(1);

      const release = formatServiceToRelease(
        {
          ...service,
          last_audit: {
            audit_status: 'Audit failed',
          },
        },
        platform
      );

      expect(release).toHaveProperty('compliant', false);
    });
  });

  it('should skip unsupported release', () => {
    expect.assertions(1);

    const release = formatServiceToRelease(
      {
        ...service,
        counter_release: '0',
      },
      platform
    );

    expect(release).toBeNull();
  });
});

describe('format registry report', () => {
  const data: CounterPlatformReport = {
    counter_release: '5.1',
    report_id: 'TR',
  };

  it('should match source', () => {
    expect.assertions(3);

    const report = formatReport(data, platform.id);

    expect(report).toHaveProperty('dataHostId', platform.id);
    expect(report).toHaveProperty('release', '5.1');
    expect(report).toHaveProperty('reportId', 'tr');
  });

  it('should mark report as supported', () => {
    expect.assertions(1);

    const report = formatReport(data, platform.id);

    expect(report).toHaveProperty('supported', true);
  });

  it('should skip unsupported release', () => {
    expect.assertions(1);

    const report = formatReport(
      {
        ...data,
        counter_release: '0',
      },
      platform.id
    );

    expect(report).toBeNull();
  });
});
