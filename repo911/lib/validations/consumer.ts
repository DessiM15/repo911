import { z } from 'zod';

export const leadTrackSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  leadId: z.string().uuid('Invalid case ID format'),
});

export const leadUploadSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  leadId: z.string().uuid('Invalid case ID format'),
});
