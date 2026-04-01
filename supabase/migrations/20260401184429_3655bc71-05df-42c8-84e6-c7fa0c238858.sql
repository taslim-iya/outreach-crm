
-- Fix trigger to also fire on UPDATE (when contact_type changes to investor)
DROP TRIGGER IF EXISTS trg_sync_investor_contact ON public.contacts;

CREATE OR REPLACE FUNCTION public.sync_investor_contact_to_deals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.contact_type = 'investor' THEN
    -- Only insert if no investor_deal already linked to this contact
    INSERT INTO investor_deals (user_id, contact_id, name, organization, stage, notes)
    SELECT NEW.user_id, NEW.id, NEW.name, NEW.organization, 'not_contacted', NEW.notes
    WHERE NOT EXISTS (
      SELECT 1 FROM investor_deals WHERE contact_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Fire on both INSERT and UPDATE
CREATE TRIGGER trg_sync_investor_contact
  AFTER INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_investor_contact_to_deals();

-- Backfill: create investor_deals for any investor contacts missing them
INSERT INTO investor_deals (user_id, contact_id, name, organization, stage, notes)
SELECT c.user_id, c.id, c.name, c.organization, 'not_contacted', c.notes
FROM contacts c
WHERE c.contact_type = 'investor'
  AND NOT EXISTS (SELECT 1 FROM investor_deals id WHERE id.contact_id = c.id);
