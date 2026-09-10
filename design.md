# AI-Powered Contract SaaS - Design System

## 1. Design Aspect

This product is a professional SaaS platform that manages contract drafting, document management, and future electronic signature processes.

### Design Goals

- Reliable and professional appearance
- Seriousness appropriate for legal document products
- Modern interface that doesn't fall into AI clichés
- Using red and black as strong accent colors
- Avoiding excessive gradients, neon, glass effects, and random color usage
- Quickly guiding the user to the contract creation flow
- Presenting dense information calmly and clearly on the dashboard and admin screens

### Appearance to Avoid

- Purple-blue neon “AI” color palette
- Excessive gradients and bright light effects
- Using different colors in each section
- Overly rounded, toy-like cards
- Large robot, brain, magic wand, or abstract AI visuals
- Decorative 3D illustrations that don't support the content
- Use of red on every button or label

## 2. Brand Color Palette

The main color system consists of red, charcoal black, warm white, and neutral gray tones.

### Main Colors

| Token | Hex | Usage |
|---|---|---|
| `brand-red-600` | `#C62828` | Main CTA, active state, important actions |
| `brand-red-700` | `#A61B1B` | Hover, pressed state, dark highlight |
| `brand-red-500` | `#D83A3A` | Secondary highlight, graphic series |
| `ink-950` | `#0D0D0F` | Main black, dark hero, titles |
| `ink-900` | `#151518` | Dark surfaces, sidebar |
| `ink-800` | `#222226` | Dark cards and borders |

### Neutral colors

| Token | Hex | Usage |
|---|---|---|
| `paper-50` | `#FAF9F7` | Main open background |
| `paper-100` | `#F3F1EE` | Section background, hover surfaces |
| `stone-200` | `#E5E1DC` | Border, divider |
| `stone-400` | `#AAA49D` | Placeholder, secondary icons |
| `stone-600` | `#6D6862` | Auxiliary text |
| `stone-800` | `#393633` | Main body text |

### Status colors

Status colors should be separated from red; use red only for errors.

| Status | Hex | Usage |
|---|---|---|
| Successful | `#287A55` | Created, completed, active |
| Information | `#35658F` | Information and system messages |
| Warning | `#B7791F` | Missing information, upcoming expiry date |
| Error | `#B42318` | Failed operation, critical alert |
| Successful open surface | `#E8F3ED` | Success badge and alert background |
| Alert open surface | `#FFF4D6` | Alert badge and alert background |
| Error open surface | `#FDEAE8` | Error badge and alert background |

## 3. Color Usage Rate

Overall rate:

- **60%:** Warm white and light neutral surfaces
- **25%:** Black and charcoal tones
- **10%:** Gray text, borders and auxiliary surfaces
- **5%:** Brand red

Red is not a decorative color, it is an indicator of action and importance. Do not confront the user with multiple red CTAs at once.

## 4. Typography

### Proposed Font Approach

- Headings: strong character, modern grotesque sans-serif
- Body text: highly readable neutral sans-serif
- Contract text: a quieter serif suitable for document reading or a highly readable sans-serif
- Numbers and case values: tabular numerals supported font

### Typographic Scale

| Usage | Size | Weight |
|---|---:|---:|
| Landing hero title | 56–72 px | 700 |
| Landing section title | 36–48 px | 700 |
| Dashboard page title | 28–32 px | 700 |
| Card title | 16–18 px | 650 |
| Body text | 15–16 px | 400 |
| Auxiliary text | 13–14 px | 400 |
| Button text | 14–15 px | 600 |
| Contract text | 15–17 px | 400 |

## 5. General UI principles

- The interface should show tangible progress instead of conveying the message "something magical is being done with AI."
- Every AI output should be editable, explainable, and subject to user approval.
- The primary action should be unique and distinct on every screen.
- Border usage should be more dominant than shadow usage.
- Cards should be used to group information; not all content should be placed inside a card.
- Border radius should generally be kept between 8–12 px.
- 16–20 px can be used in large marketing areas; more control should be maintained in the dashboard.
- Shadows should be light: `0 4px 16px rgba(13, 13, 15, 0.08)`.
- Icons should be line-based, simple, and have the same stroke weight.

## 6. Landing page design

### General visual language

The landing page should use a dark black background at the top, and warm white and light neutral sections below. Red should only be used in main actions and strategic highlights.

### Section Structure

#### 6.1 Navbar

- Background: `ink-950`
- Logo: `paper-50`
- Navigation text: `stone-400`
- Hover text: `paper-50`
- Main button: `brand-red-600`
- Main button hover: `brand-red-700`
- Simple menu structure: Product, How it works, Pricing, FAQ

#### 6.2 Hero

- Background: `ink-950`
- Main title: `paper-50`
- Description: `stone-400`
- Highlighted short phrase: `brand-red-500`
- Primary CTA: `brand-red-600` background, `paper-50` text
- Secondary CTA: transparent background, `stone-200` border, `paper-50` Text
- A contract creation panel resembling the actual product screen should be used on the right side. - Instead of an abstract AI visualization, a UI showing questions and answers, document drafts, and progress steps should be used.

#### 6.3 Problem Section

- Background: `paper-50`
- Heading: `ink-950`
- Text: `stone-600`
- Problem Icons: `ink-800`
- Critical Highlight: thin `brand-red-600` line or small label

#### 6.4 Product Flow

Four or five-step horizontal/vertical process:

1. Describe your need
2. Complete any missing information
3. Edit the draft
4. Create the PDF
5. Share with your customer

- Step number: `ink-950`
- Active step: `brand-red-600`
- Completed step: `#287A55`
- Connecting lines: `stone-200`
- Each step should include a short, concrete description.

#### 6.5 Features

- Background: `paper-100`
- Cards: `paper-50`
- Card border: `stone-200`
- Icon: `ink-900`
- Featured card: `ink-950` background, `paper-50` text and small red highlight

#### 6.6 Price

There are no packages. The product is pay-as-you-go: a single unit price per contract,
charged only when the user generates the PDF. One centred card, not a comparison grid —
there is nothing to compare against.

- Card: `paper-50` background, `ink-950` border, centred, max ~28rem wide
- Price: large heading type, with the `/ contract` unit in auxiliary text next to it
- The card carries the section's only red CTA (§3, §5)
- Maximum 5–6 lines of what is included
- Below the CTA, one plain line stating when the charge happens — this is the single most
  important sentence on the section and must not read as marketing

#### 6.7 Trust Section

- Background: `paper-50`
- Trust messages: data control, version history, document archive, user confirmation
- Red should only be used for critical emphasis. - Avoid claims such as legal guarantees or “completely error-free contract”.

#### 6.8 Final CTA

- Background: `brand-red-700` or `ink-950`

- Title: `paper-50`

- Description: `#F3D2D0`

- CTA: `paper-50` background, `ink-950` text

## 7. Dashboard design

There is one dashboard for everyone. Packages are gone, so there is no tier to express;
what the dashboard has to make legible instead is the wallet — *what is my balance, and
where did it go* — plus, in shared workspaces only, who is in the workspace and what they
have been doing.

### 7.1 Common Dashboard Structure

- Sidebar: `ink-950`
- Sidebar Active Item: `brand-red-600`
- Main Content: `paper-50`
- Card Surface: `paper-50`
- Border: `stone-200`
- Header: `ink-950`
- Body: `stone-800`
- Auxiliary Text: `stone-600`
- Primary Action: `brand-red-600`
- Success Status: `#287A55`

Common Menu:

- Overview
- Contracts
- Create New Contract
- Templates
- Archive
- Reminders
- Settings

Signature features should be added to the menu in a later phase; do not highlight a feature that is not active in the MVP in the main navigation.

### 7.2 Overview — everyone

Purpose: to make the balance and where it went legible, and to keep the path to a new
contract one click away.

- Tone: calm, low-density; no upsell surface anywhere, because there is nothing to upsell to
- Metric row: 3–4 key numbers only (total contracts, drafts, ready, remaining credits)
- Credit summary: `ink-950` card — balance and spend over the last 30 days side by side
- Under the balance, one auxiliary line: normally what a contract costs; when the balance
  runs low, a **calm inline message**, never an aggressive banner
- Spending graph: `brand-red-600` single emphasis series, other series gray
- Credit history: simple table view; sign-coloured amounts (red out, green in)
- Empty states: white surface, simple icon, single CTA
- Document status: green for completed, amber for pending, red for error

### 7.3 Shared workspace additions

In a workspace that is not personal, two more cards follow the credit history. Nothing else
about the screen changes — this is the same dashboard with one extra block, not a variant.

- Team activity: gray background, red only for significant actions
- Role and authority badges: neutral tones; for the admin `ink-900`, for the editor
  `brand-red-100` (a light red surface), for the viewer `paper-100`

### 7.4 Reserved

Multi-workspace filters and an API/integration area were specified for a "Business" tier
that no longer exists. If they return, they return as capabilities of a shared workspace,
not of a purchased tier.

## 8. Contract creation screen

This screen is the heart of the product.

### Left panel: AI chat / information gathering

- Background: `ink-950`
- AI message: `ink-800` surface, `paper-50` text
- User message: `brand-red-700` surface, `paper-50` text
- Question title: `paper-50`
- Missing field warning: `#FFF4D6` surface, `#8A5A00` text

### Right panel: Draft contract

- Background: `paper-100`
- Document surface: `paper-50`
- Title: `ink-950`
- Text: `stone-800`
- Last modified lines by AI: very light red background, e.g., `#FFF1F0`
- Sections approved by the user: very light green highlight, e.g., `#E8F3ED`
- Edit button: outline `ink-800`
- Generate PDF: `brand-red-600`

AI output should never be automatically displayed as “final”. Draft, revision, and user approval statuses should be clearly separated.

## 9. Admin Panel Design

The admin panel should be more robust and operational than the end-user dashboard; however, it should maintain the brand language.

### Admin Colors

- Main background: `#ECEAE7`
- Sidebar: `ink-950`
- Sidebar active element: `brand-red-600`
- Content surface: `paper-50`
- Table header: `paper-100`
- Border: `stone-200`
- Main text: `ink-950`
- Auxiliary text: `stone-600`
- Critical action: `#B42318`
- System success: `#287A55`
- System alert: `#B7791F`

### Admin Sections

- Users
- Workspaces and Teams
- Contract Templates
- AI Usage Statistics
- Document Processing Logs
- System Notifications
- Credits and Usage Management
- Support Requests
- Security and Access Logs

### Admin Special Rules

- Deletions and irreversible actions should be shown with a red outline or a dark error color. - In the admin interface, red should be the color for critical actions, not the normal navigation color. - Tables should use borders and spacing instead of zebra rows. - Role-based authorization messages should be displayed for user data and document content, not open access messages. - Audit log screens should present time, actor, action, and source in separate columns.

## 10. Button and Status System

### Primary Button

- Background: `brand-red-600`
- Text: `paper-50`
- Hover: `brand-red-700`
- Disabled: `#D6A0A0`

### Secondary Button

- Background: transparent
- Border: `stone-400` or `ink-800`

- Text: `ink-900`

- Hover Background: `paper-100`

### Dangerous Button

- Background: `#B42318`
- Text: `paper-50`

- Approval mode required

### Status Badges

- Draft: `paper-100` background, `stone-800` text
- Under Review: `#FFF4D6` background, `#8A5A00` text
- Ready: `#E8F3ED` background, `#21623F` text
- Shared: `#E8EEF5` background, `#2D5478` text
- Error: `#FDEAE8` background, `#9B2118` text

## 11. Responsive Design

### Mobile

- Sidebar bottom navigation or dropdown drawer should be enabled. - Contract creation screen should switch to a single-column flow. - Draft and AI chat should be separated by a tabbed view. - The price card should stretch to full width. - Admin tables should be converted to card view.

### Tablet

- Dashboard can maintain a two-column structure. - AI panel in contract editor should be collapsible.

### Desktop

- Maximum content width: 1280–1440 px
- AI panel and document panel side-by-side on the contract screen
- Spacious, breathable layout for the landing hero

## 12. Design Quality Checklist

- [ ] Is red only used as an indicator of action and importance?
- [ ] Are purple-blue neon or general AI colors not used?
- [ ] Is there a single main CTA on each screen?
- [ ] Are AI draft and user approval visually separated?
- [ ] Is the contract text easy to read?
- [ ] Is it unmistakable that the charge happens at PDF generation, and only once per contract?
- [ ] Are critical actions securely separated on the admin screen?
- [ ] Do empty states redirect the user to the next step? - [ ] Is the contract creation flow usable on mobile?
- [ ] Are signature features not shown as main features in the interface if they are outside the MVP?

## 13. Brief Design Summary

**Color Character:** Charcoal black, warm white, controlled red.

**Visual Character:** Professional, calm, document-focused, trustworthy.

**Purpose of Red:** CTA, active status, critical emphasis.

**Approach to Avoid:** Purple-blue AI gradients, neon glows, AI clichés, and unnecessary decoration.

**Main Product Feel:** The user is not left with a blank page; the system guides them step-by-step to a usable agreement.