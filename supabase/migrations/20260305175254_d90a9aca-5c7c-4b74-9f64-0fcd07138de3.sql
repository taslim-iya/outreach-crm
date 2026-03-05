-- Backfill: create investor_deals for investor contacts that don't have one
INSERT INTO investor_deals (user_id, contact_id, name, organization, stage, notes)
SELECT c.user_id, c.id, c.name, c.organization, 'not_contacted', c.notes
FROM contacts c
WHERE c.contact_type = 'investor'
  AND NOT EXISTS (SELECT 1 FROM investor_deals id WHERE id.contact_id = c.id);

-- Create trigger to auto-sync new investor contacts to investor_deals
CREATE OR REPLACE FUNCTION public.sync_investor_contact_to_deals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.contact_type = 'investor' THEN
    INSERT INTO investor_deals (user_id, contact_id, name, organization, stage, notes)
    VALUES (NEW.user_id, NEW.id, NEW.name, NEW.organization, 'not_contacted', NEW.notes)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_investor_contact
AFTER INSERT ON contacts
FOR EACH ROW
EXECUTE FUNCTION public.sync_investor_contact_to_deals();