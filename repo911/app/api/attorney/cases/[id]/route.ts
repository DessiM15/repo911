import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { sendStatusUpdateSms, sendSettlementUpdateSms } from '@/lib/sms';
import { verifyAttorney } from '@/lib/auth/verify-attorney';
import { rateLimit } from '@/lib/rate-limit';
import { caseStatusUpdateSchema, VALID_TRANSITIONS } from '@/lib/validations/attorney';
import type { StatusHistoryEntry } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const rl = rateLimit(`attorney-case-update:${attorney.id}`, { limit: 30, windowSeconds: 3600 });
    if (!rl.success) {
      return apiError('Too many requests', 429);
    }

    // Fetch existing record and verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('fee_tracking')
      .select('id, attorney_id, case_status, status_history, settlement_amount')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return apiError('Case not found', 404);
    }

    if (existing.attorney_id !== attorney.id) {
      return apiError('Access denied', 403);
    }

    const body = await request.json();
    const parsed = caseStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { case_status, note, settlement_amount } = parsed.data;
    const currentStatus = existing.case_status;

    // Validate transition
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(case_status)) {
      return apiError(
        `Cannot transition from "${currentStatus}" to "${case_status}". Allowed: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`,
        400
      );
    }

    // Build history entry
    const historyEntry: StatusHistoryEntry = {
      from: currentStatus,
      to: case_status,
      changed_at: new Date().toISOString(),
    };
    if (note) historyEntry.note = note;

    const currentHistory = Array.isArray(existing.status_history) ? existing.status_history : [];
    const updatedHistory = [...currentHistory, historyEntry];

    // Build update payload
    const updates: Record<string, unknown> = {
      case_status,
      status_updated_at: new Date().toISOString(),
      status_history: updatedHistory,
    };

    if (settlement_amount !== undefined) {
      updates.settlement_amount = settlement_amount;
    }

    if (note) {
      updates.outcome_notes = note;
    }

    const { error: updateError } = await supabase
      .from('fee_tracking')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Case status update error:', updateError);
      return apiError('Failed to update case status', 500);
    }

    // Create notification (fire-and-forget)
    supabase
      .from('notifications')
      .insert({
        recipient_type: 'attorney',
        recipient_id: attorney.id,
        title: 'Case Status Updated',
        message: `Case status changed from ${currentStatus} to ${case_status}`,
        type: 'system',
        link: '/attorney/cases',
      })
      .then(() => {});

    // SMS to consumer (fire-and-forget)
    supabase
      .from('fee_tracking')
      .select('lead_id')
      .eq('id', id)
      .single()
      .then(({ data: feeRec }) => {
        if (feeRec) {
          supabase
            .from('leads')
            .select('phone, preferred_contact, sms_notifications')
            .eq('id', feeRec.lead_id)
            .single()
            .then(({ data: leadData }) => {
              if (leadData) {
                const consumer = { phone: leadData.phone, preferred_contact: leadData.preferred_contact, sms_notifications: leadData.sms_notifications };
                if (case_status !== currentStatus) {
                  sendStatusUpdateSms(consumer, feeRec.lead_id, case_status).catch(() => {});
                }
                if (settlement_amount !== undefined && settlement_amount !== null) {
                  sendSettlementUpdateSms(consumer, feeRec.lead_id, settlement_amount).catch(() => {});
                }
              }
            });
        }
      });

    // CRM activity logging (fire-and-forget, same pattern as leads PATCH)
    supabase
      .from('fee_tracking')
      .select('lead_id')
      .eq('id', id)
      .single()
      .then(({ data: feeRecord }) => {
        if (feeRecord) {
          supabase
            .from('crm_contacts')
            .select('id')
            .eq('source_lead_id', feeRecord.lead_id)
            .single()
            .then(({ data: contact }) => {
              if (contact) {
                supabase.from('crm_activities').insert({
                  contact_id: contact.id,
                  activity_type: 'status_change',
                  description: `Case status changed from ${currentStatus} to ${case_status}`,
                  performed_by: attorney.id,
                  metadata: {
                    field: 'case_status',
                    old_value: currentStatus,
                    new_value: case_status,
                    settlement_amount: settlement_amount || null,
                  },
                }).then(() => {});
              }
            });
        }
      });

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Case PATCH error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
