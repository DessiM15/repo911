import { z } from 'zod';

export const attorneyProfileUpdateSchema = z.object({
  phone: z.string().optional(),
  firm_name: z.string().optional(),
  website: z.string().optional(),
  preferred_states: z.array(z.string()).optional(),
  preferred_case_types: z.array(z.string()).optional(),
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
});

export const attorneyClaimSchema = z.object({
  lead_id: z.string().min(1, 'Lead ID is required'),
});

export const attorneyLeadUpdateSchema = z.object({
  case_status: z.enum(['open', 'in_progress', 'settled', 'dismissed', 'closed']).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.case_status !== undefined || data.notes !== undefined,
  { message: 'At least one field is required' }
);

export const attorneyMessageSchema = z.object({
  content: z.string().min(1, 'Message is required').max(2000, 'Message must be under 2000 characters'),
});

export const notificationUpdateSchema = z.object({
  mark_all_read: z.boolean().optional(),
  notification_id: z.string().optional(),
}).refine(
  (data) => data.mark_all_read !== undefined || data.notification_id !== undefined,
  { message: 'At least one field is required' }
);
