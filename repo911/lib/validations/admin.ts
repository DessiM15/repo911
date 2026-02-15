import { z } from 'zod';

const leadStatusEnum = z.enum([
  'pending', 'qualified_hot', 'qualified_warm', 'qualified_cold',
  'disqualified', 'claimed', 'closed',
]);

const qualificationTierEnum = z.enum(['hot', 'warm', 'cold', 'disqualified']);

export const adminLeadUpdateSchema = z.object({
  status: leadStatusEnum.optional(),
  qualification_tier: qualificationTierEnum.optional(),
  qualification_score: z.number().min(0).max(200).optional(),
}).refine(
  (data) => data.status !== undefined || data.qualification_tier !== undefined || data.qualification_score !== undefined,
  { message: 'At least one field is required' }
);

export const adminAttorneyUpdateSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'rejected']).optional(),
  is_verified: z.boolean().optional(),
}).refine(
  (data) => data.status !== undefined || data.is_verified !== undefined,
  { message: 'At least one field is required' }
);

export const adminCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'viewer']).default('viewer'),
});

export const pipelineUpdateSchema = z.object({
  lead_id: z.string().uuid(),
  status: leadStatusEnum,
});

export const errorStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['unresolved', 'resolved', 'ignored', 'muted']),
});

export const feeTrackingUpdateSchema = z.object({
  fee_id: z.string().min(1),
  case_status: z.enum(['open', 'in_progress', 'settled', 'dismissed', 'closed', 'paid']).optional(),
  attorney_total_fee: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const settingsUpdateSchema = z.object({
  lead_price_hot: z.number().optional(),
  lead_price_warm: z.number().optional(),
  lead_price_cold: z.number().optional(),
  notification_email_from: z.string().optional(),
  platform_name: z.string().optional(),
});

export const crmContactUpdateSchema = z.object({
  lifecycle_stage: z.enum(['new', 'contacted', 'qualified', 'retained', 'closed']).optional(),
  tags: z.array(z.string()).optional(),
  next_follow_up: z.string().optional(),
  add_note: z.string().optional(),
});
