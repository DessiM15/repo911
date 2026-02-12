import { z } from 'zod';

export const attorneyRegistrationSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  firm_name: z.string().optional(),
  bar_number: z.string().min(1, 'Bar number is required'),
  bar_state: z.string().min(1, 'Bar state is required'),
  licensed_states: z.array(z.string()).min(1, 'Select at least one licensed state'),
  preferred_case_types: z.array(z.string()).min(1, 'Select at least one practice area'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type AttorneyRegistrationData = z.infer<typeof attorneyRegistrationSchema>;

export const feeAgreementSchema = z.object({
  electronic_signature: z.string().min(1, 'Electronic signature is required'),
  agree_to_terms: z.literal(true, {
    error: 'You must agree to the lead purchase agreement',
  }),
});

export type FeeAgreementData = z.infer<typeof feeAgreementSchema>;
