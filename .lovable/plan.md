
# Cap Table Enhancement Plan

## Issues Identified

### Issue 1: Investor Not Appearing on Cap Table
The investor "Florian" was moved to "committed" stage but has no commitment amount. The Cap Table currently filters for investors where:
- `stage` = 'committed' OR 'closed'
- **AND** `commitment_amount > 0`

Since commitment_amount is null, the investor doesn't appear.

### Issue 2: No Commitment Amount Prompt
When moving an investor to "committed" or "closed" via the dropdown menu, the system only updates the stage without prompting for the investment amount.

### Issue 3: No Manual Cap Table Editing
Users cannot add entries directly to the Cap Table - they must first add an investor contact.

---

## Solution Overview

### 1. Commitment Amount Modal
Create a popup that appears when moving an investor to "committed" or "closed" stages, prompting the user to enter the commitment amount.

### 2. Direct Cap Table Entry
Add an "Add Entry" button on the Cap Table page that allows manually adding cap table entries without requiring an investor in the pipeline.

### 3. Inline Editing
Enable editing commitment amounts directly from the Cap Table view.

---

## Technical Implementation

### New Files to Create

**`src/components/pipeline/CommitmentAmountModal.tsx`**
A modal dialog that:
- Prompts for commitment amount when moving to committed/closed stages
- Shows investor name and organization
- Has a required amount field
- Submits both stage change and commitment amount together

**`src/components/cap-table/CapTableEntryModal.tsx`**
A modal for adding/editing cap table entries directly:
- Name field
- Organization field
- Commitment amount (required)
- Stage (committed/closed)
- Optional: link to existing investor or contact

### Files to Modify

**`src/components/pipeline/InvestorCard.tsx`**
- When clicking "Move to Stage" -> "Committed" or "Closed", instead of directly calling `handleMoveToStage`, open the CommitmentAmountModal
- Pass the selected stage and investor data to the modal

**`src/hooks/useInvestorDeals.ts`**
- Add a new hook `useUpdateInvestorStageWithCommitment` that updates both stage and commitment_amount in one call

**`src/pages/CapTable.tsx`**
- Add "Add Entry" button in the header
- Add edit/delete actions to the investor table rows
- Integrate CapTableEntryModal for adding/editing entries

---

## User Flow Changes

### Moving Investor to Committed/Closed

```text
Current Flow:
1. Click "Move to Stage" → "Committed"
2. Stage updates immediately
3. No commitment amount set
4. Investor doesn't appear on Cap Table

New Flow:
1. Click "Move to Stage" → "Committed"
2. Modal opens: "Enter Commitment Amount"
   - Shows: "Florian - Legacy Partners"
   - Input: $ [amount field]
   - Buttons: Cancel | Confirm
3. Both stage AND amount update together
4. Investor appears on Cap Table immediately
```

### Adding Cap Table Entry Directly

```text
1. Navigate to Cap Table
2. Click "Add Entry" button
3. Modal opens with fields:
   - Investor Name *
   - Organization
   - Commitment Amount * ($)
   - Stage (Committed/Closed)
4. Entry appears in Cap Table
```

---

## Component Details

### CommitmentAmountModal

```typescript
interface CommitmentAmountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: InvestorDeal;
  targetStage: 'committed' | 'closed';
  onConfirm: (amount: number) => void;
}
```

Features:
- Pre-filled investor info (name, org)
- Number input for amount with currency formatting
- Validation: amount required and must be > 0
- Cancel returns to previous state (no stage change)

### CapTableEntryModal

```typescript
interface CapTableEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: InvestorDeal | null; // For editing existing entries
}
```

Features:
- Add new entries not linked to investor pipeline
- Edit existing entries inline
- Required: name, commitment amount
- Optional: organization, notes
- Stage defaults to 'committed'

---

## Summary

This implementation:
1. Fixes the immediate issue where committed investors don't show on Cap Table
2. Ensures commitment amounts are always captured when moving to final stages
3. Provides flexibility to manually manage the Cap Table directly
4. Maintains data integrity between Investors and Cap Table

No database changes required - uses existing `investor_deals` table structure.
