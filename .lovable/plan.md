
# Fix Non-Functional Buttons on Outreach Page

## Problem Summary

The Outreach page has **4 buttons** that do nothing when clicked because they have no `onClick` handlers:

1. **"New Campaign"** - Header action button
2. **"New Template"** - In Email Templates card
3. **"View All"** - In Active Campaigns card  
4. **"Compose with AI"** - In AI Email Composer card

## Solution

I'll implement functional behavior for each button by following the established patterns in the codebase:

### 1. Compose with AI Button
**Action:** Navigate to the AI Assistant page with a pre-filled prompt for email drafting.

This leverages the existing AI Assistant infrastructure that already supports email drafting suggestions.

### 2. New Template Button
**Action:** Open a modal to create a new email template.

Since there's no `email_templates` table in the database yet, I'll need to:
- Create the database table for email templates
- Create a template form modal component
- Add hooks for template CRUD operations

### 3. New Campaign Button  
**Action:** Show a toast notification that this feature is "coming soon" (similar to Microsoft integration in Settings).

Building a full email campaign system requires significant infrastructure (sending emails, tracking opens/clicks, scheduling). For now, a placeholder is appropriate.

### 4. View All Button
**Action:** Currently there are no campaigns to view, so this button will be disabled or hidden when there are no campaigns.

---

## Implementation Plan

### Step 1: Add Navigation for AI Compose
- Import `useNavigate` from react-router-dom
- Navigate to `/assistant` with a query parameter or state to trigger the email compose flow

### Step 2: Create Email Templates Infrastructure

**Database Migration:**
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own templates" ON email_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON email_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON email_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON email_templates
  FOR DELETE USING (auth.uid() = user_id);
```

**New Files:**
- `src/hooks/useEmailTemplates.ts` - CRUD hooks for templates
- `src/components/outreach/TemplateFormModal.tsx` - Modal for creating/editing templates

**Updated Files:**
- `src/pages/Outreach.tsx` - Add state, handlers, and modal integration

### Step 3: Add Toast for Campaign Button
- Simple toast notification: "Campaigns feature coming soon"

---

## Visual Changes

The Outreach page will show:
- Templates list (when templates exist) instead of empty state
- Working "New Template" button that opens a modal
- "Compose with AI" redirects to AI Assistant
- "New Campaign" shows coming soon toast

---

## Files to Create

1. `src/hooks/useEmailTemplates.ts`
2. `src/components/outreach/TemplateFormModal.tsx`

## Files to Modify

1. `src/pages/Outreach.tsx`

## Database Changes

1. Create `email_templates` table with RLS policies

---

## Technical Details

### Template Form Modal Structure
```text
┌─────────────────────────────────────┐
│  Create Email Template              │
├─────────────────────────────────────┤
│  Template Name: [________________]  │
│                                     │
│  Subject Line:  [________________]  │
│                                     │
│  Category:      [General      ▼ ]   │
│                                     │
│  Email Body:                        │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │ Write your template here... │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│           [Cancel]  [Save Template] │
└─────────────────────────────────────┘
```

### Template Categories
- Investor Outreach
- Follow-up
- Meeting Request
- Thank You
- General

---

## Summary

This fix will make all buttons on the Outreach page functional:
- AI compose navigates to the existing AI Assistant
- Templates can be created and stored in the database
- Campaigns shows a "coming soon" notification
- The page follows the same patterns used throughout the app
