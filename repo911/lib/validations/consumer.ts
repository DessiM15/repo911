import { z } from 'zod';

export const leadTrackSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('case_id'),
    email: z.string().email('Please enter a valid email address'),
    leadId: z.string().uuid('Invalid case ID format'),
  }),
  z.object({
    mode: z.literal('phone'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    lastName: z.string().min(1, 'Last name is required'),
  }),
]);

export const leadUploadSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  leadId: z.string().uuid('Invalid case ID format'),
});

export const consumerMessageSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  leadId: z.string().uuid('Invalid case ID format'),
  content: z.string().min(1, 'Message is required').max(2000, 'Message must be under 2000 characters'),
});
