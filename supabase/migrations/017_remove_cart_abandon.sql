-- Remove cart abandonment email sequences (policy: no discounts, no abandon emails)
DELETE FROM email_sequences WHERE trigger_event = 'CHECKOUT_STARTED';
