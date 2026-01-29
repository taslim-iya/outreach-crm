
# Fix Company Name Display & Improve PDF Design

## Problem Identified

1. **Company name not saving**: The "Organization" field in Settings is not connected to the database. It has `defaultValue=""` and the "Save Changes" button doesn't actually persist the `company_name` to the profiles table.

2. **PDF needs professional upgrade**: The current PDF is basic - needs better styling, branding, and layout.

---

## Changes Required

### 1. Fix Settings Page - Save Company Name

**File: `src/pages/Settings.tsx`**

- Add state management for the profile form (display name, company name)
- Connect the "Organization" input to the `company_name` profile field
- Update the "Save Changes" button to actually persist both fields to the database
- Add a mutation to save profile updates
- Pre-fill the Organization field with the existing `company_name` from the profile query

### 2. Upgrade PDF Export Design

**File: `src/pages/CapTable.tsx`**

Transform the PDF from basic to professional with:

**Header Section:**
- Add a navy blue header bar with company name in white
- Professional title "Cap Table Report" 
- Subtitle with generation date

**Summary Section:**
- Clean card-style layout with key metrics
- Two-column layout: Total Raised / Goal on left, Investors / Avg Investment on right
- Progress indicator with percentage

**Table Improvements:**
- Navy blue header row matching branding
- Better cell padding and spacing
- Cleaner alternating row colors
- Right-aligned currency columns
- Professional typography

**Footer:**
- Page numbers
- "Confidential" watermark
- Generated timestamp

---

## Visual Preview

```text
┌─────────────────────────────────────────────────────────┐
│  ██████████████████████████████████████████████████████ │ ← Navy header bar
│  █           MUNGER LONGVIEW PARTNERS              █   │
│  ██████████████████████████████████████████████████████ │
│                                                         │
│                    CAP TABLE REPORT                     │
│               Generated: January 29, 2026               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │ Total Raised        │  │ Number of Investors     │   │
│  │ £320,000            │  │ 4                       │   │
│  ├─────────────────────┤  ├─────────────────────────┤   │
│  │ Fundraising Goal    │  │ Average Investment      │   │
│  │ £400,000 (80.0%)    │  │ £80,000                 │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  INVESTOR        CONTACT     COMMITMENT  %     STATUS   │ ← Navy header
├─────────────────────────────────────────────────────────┤
│  Legacy Partners Florian     £250,000    78.1% Closed   │
│  ABC Capital     John Smith  £70,000     21.9% Committed│
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Page 1                              Confidential       │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Settings.tsx Changes

1. Add form state for `displayName` and `companyName`
2. Pre-fill values from profile query
3. Create `updateProfile` mutation that saves to profiles table
4. Wire "Save Changes" button to the mutation

### CapTable.tsx PDF Changes

1. **Header bar**: Use `doc.setFillColor()` and `doc.rect()` for navy background
2. **Typography**: Larger company name (18pt bold), proper hierarchy
3. **Summary cards**: Use `doc.rect()` with light fill for card backgrounds
4. **Table styling**: Update `autoTable` config with:
   - Navy header (`fillColor: [10, 37, 64]` for Goldman-style navy)
   - Better column widths
   - Right-aligned number columns
5. **Footer**: Add page numbers and confidential notice

---

## Files to Modify

1. **`src/pages/Settings.tsx`**
   - Add form state management
   - Connect Organization input to save properly
   - Update Save button functionality

2. **`src/pages/CapTable.tsx`**
   - Rewrite `handleExportPDF` function with professional styling
   - Add header bar, improved summary section, enhanced table

---

## Summary

This fix addresses both issues: the company name will now properly save from Settings, and the PDF export will have a professional, branded appearance matching the Goldman Sachs-inspired visual identity of DealScope.
