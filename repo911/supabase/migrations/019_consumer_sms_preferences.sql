-- 019: Add SMS notification preference for consumers
ALTER TABLE leads ADD COLUMN sms_notifications BOOLEAN DEFAULT TRUE;
