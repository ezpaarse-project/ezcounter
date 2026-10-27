import { z } from '@ezcounter/dto';

export const CounterService = z.looseObject({
  api_key_required: z.boolean(),
  counter_release: z.string(),
  // Contact: z
  //   .object({
  //     Email: z.email().or(z.literal('')),
  //     Form_url: z.url().or(z.literal('')),
  //     Person: z.string(),
  //     Phone: z.string(),
  //   }).nullable()
  // Credentials_auto_expire: z.boolean(),
  // Credentials_auto_expire_info: z.string(),
  // Ip_address_authorization: z.boolean(),
  // Ip_address_authorization_info: z.string(),
  last_audit: z.looseObject({
    audit_status: z.enum([
      'Audit expired',
      'Audit in progress',
      'Currently valid audit',
      'Audit failed',
    ]),
  }),
  // Migrations: z.array(
  //   Z.object({
  //     Data_host: z.url().nullable(),
  //     Data_host_original_name: z.string(),
  //     Id: z.uuid(),
  //     Migration_date: z.iso.date(),
  //   })
  // ),
  // Notifications_url: z.url(),
  platform_attr_required: z.boolean(),
  platform_specific_info: z.string(),
  requestor_id_required: z.boolean(),
  url: z.url(),
});

export type CounterService = z.infer<typeof CounterService>;

export const CounterPlatformReport = z.looseObject({
  counter_release: z.string(),
  report_id: z.string(),
});

export type CounterPlatformReport = z.infer<typeof CounterPlatformReport>;

export const CounterPlatform = z.looseObject({
  abbrev: z.string(),
  // Audited: z.boolean(),
  // Contact: z
  //   .object({
  //     Email: z.email().or(z.literal('')),
  //     Form_url: z.url().or(z.literal('')),
  //     Person: z.string(),
  //     Phone: z.string(),
  //   })
  //   .nullable(),
  // Content_provider_name: z.string(),
  id: z.uuid(),
  name: z.string(),
  reports: z.array(CounterPlatformReport),
  sushi_services: z.array(
    z.object({
      counter_release: z.string(),
      url: z.url(),
    })
  ),
  // Website: z.url().or(z.literal('')),
});

export type CounterPlatform = z.infer<typeof CounterPlatform>;
