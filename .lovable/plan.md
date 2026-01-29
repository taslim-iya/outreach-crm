
# Display Organization Name as Primary in Investors & Cap Table

## Overview

Update both the Investors page (InvestorCard) and Cap Table to prioritize showing the investor's **organization/company name** when available, with the personal name as secondary info.

---

## Changes Required

### 1. InvestorCard.tsx (Investors Page)

**Current display:**
- Primary: Personal name (e.g., "Florian")
- Secondary: Organization (e.g., "Legacy Partners")

**New display:**
- Primary: Organization name if available, otherwise personal name
- Secondary: Personal name (only shown if organization exists)
- Initials: Use organization initials if available

**Code changes:**
- Create a helper to get display name: `organization || name`
- Update the main title to show organization (or name if no org)
- Show personal name as subtitle when organization exists
- Update `getInitials()` to use the display name

---

### 2. CapTable.tsx

**Locations to update:**

1. **Pie Chart Data** (line 182-186):
   - Change `name: inv.name` to `name: inv.organization || inv.name`

2. **Bar Chart Data** (line 188-195):
   - Change `name: inv.name...` to use organization when available

3. **Table Display** (line 658):
   - Change primary column from `investor.name` to `investor.organization || investor.name`
   - Show personal name in parentheses or as subtitle when organization differs

4. **CSV Export** (line 207-227):
   - Keep both columns but use organization as primary identifier

5. **PDF Export** (line 267-278):
   - Use organization name as primary in the table

---

## Display Logic

A simple helper function will be used:

```typescript
// Get the display name (prefer organization over personal name)
const getDisplayName = (investor: InvestorDeal) => 
  investor.organization || investor.name;
```

---

## Visual Examples

### InvestorCard (Before → After)

**Before:**
```
[FL] Florian
     Legacy Partners
     $250K
```

**After:**
```
[LP] Legacy Partners
     Florian
     $250K
```

### Cap Table (Before → After)

**Before:**
| Investor | Organization | Commitment |
|----------|--------------|------------|
| Florian  | Legacy Partners | $250K   |

**After:**
| Investor         | Contact  | Commitment |
|------------------|----------|------------|
| Legacy Partners  | Florian  | $250K      |

---

## Files to Modify

1. **`src/components/pipeline/InvestorCard.tsx`**
   - Update display logic to show organization as primary
   - Show personal name as secondary when organization exists
   - Update initials to use organization

2. **`src/pages/CapTable.tsx`**
   - Update pieChartData to use organization
   - Update barChartData to use organization
   - Update table column headers ("Contact" instead of "Organization")
   - Update table row display
   - Update CSV export headers
   - Update PDF export table

---

## Summary

This change prioritizes the investor's company/organization name (like "Legacy Partners") over their personal name ("Florian") throughout the app, making it more professional and consistent with how investors are typically identified in fundraising contexts.
