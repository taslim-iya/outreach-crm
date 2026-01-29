
# Auto-Sync Contacts with Pipeline Tabs

## Overview
This plan implements automatic synchronization between contacts and their relevant pipeline tabs. When you add a contact with a specific type (e.g., investor, company owner), they will automatically appear in the corresponding pipeline.

## Current Behavior
- Creating an **investor** contact already creates an investor pipeline entry (this is working)
- Creating an **owner** contact does NOT create a deal pipeline entry
- The Deals page uses mock data instead of the database
- Changing a contact's type doesn't update the pipelines

## What Will Change

### 1. Owner Contacts Auto-Create Deal Entries
When you create a contact with type "Company Owner", a corresponding entry will be automatically created in the Deal Pipeline (Deals tab) with:
- Company name = Contact's organization (or name if no organization)
- Stage = "Identified" (starting stage)
- Linked contact = The contact you just created

### 2. Real Data for Deals Page
The Deals page will be connected to the database instead of mock data, showing real companies you've added.

### 3. Contact Type Changes Trigger Updates
If you edit a contact and change their type:
- **To Investor**: Creates an investor pipeline entry (if not already exists)
- **To Owner**: Creates a deal pipeline entry (if not already exists)

### 4. Reverse Sync from Pipeline Forms
When adding an investor or company directly from the pipeline tabs, if no contact is linked, one can optionally be created.

---

## Technical Implementation

### Step 1: Create Companies Hook
Create `src/hooks/useCompanies.ts` with CRUD operations for the companies table, following the same pattern as `useInvestorDeals.ts`.

### Step 2: Update Contact Form Modal
Modify `src/components/contacts/ContactFormModal.tsx` to:
- Auto-create a company when `contact_type === 'owner'`
- Handle type changes during edits (create pipeline entries if type changes to investor/owner)

### Step 3: Update Deals Page
Modify `src/pages/Deals.tsx` to:
- Use the new `useCompanies` hook instead of mock data
- Add loading, empty, and error states
- Connect the "Add Company" button to a form modal

### Step 4: Create Company Form Modal
Create `src/components/deals/CompanyFormModal.tsx` for adding/editing companies in the Deal pipeline.

### Step 5: Create Delete Company Dialog
Create `src/components/deals/DeleteCompanyDialog.tsx` for removing companies.

### Step 6: Create Deal Card Component Update
Update `src/components/pipeline/DealCard.tsx` to work with real database data and include edit/delete actions.

---

## Files to Create
| File | Description |
|------|-------------|
| `src/hooks/useCompanies.ts` | CRUD hooks for companies table |
| `src/components/deals/CompanyFormModal.tsx` | Form for adding/editing companies |
| `src/components/deals/DeleteCompanyDialog.tsx` | Confirmation dialog for deletion |

## Files to Modify
| File | Changes |
|------|---------|
| `src/components/contacts/ContactFormModal.tsx` | Add auto-create company for owner type, handle type changes |
| `src/pages/Deals.tsx` | Replace mock data with real database queries |
| `src/components/pipeline/DealCard.tsx` | Add edit/delete handlers, use database types |

---

## Sync Logic Summary

| Contact Type | Auto-Creates Entry In | Pipeline Entry Fields |
|--------------|----------------------|----------------------|
| Investor | Investor Pipeline | name, organization, stage=not_contacted |
| Owner | Deal Pipeline | company name=organization, stage=identified |
| Intermediary | None | - |
| Advisor | None | - |

## Edge Cases Handled
- Duplicate prevention: Check if pipeline entry already exists before creating
- Missing organization: Use contact name as fallback for company name
- Type change: Only create if no existing pipeline entry is linked
- Error handling: If pipeline creation fails, contact is still saved with a warning toast
