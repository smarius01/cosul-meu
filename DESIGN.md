# Coșul meu design system
## Mode and layout
Operate. One narrow mobile-first column (720px max including gutters), all pending items first, purchased basket strictly below, never a side column. No hero imagery or marketing sections. Import is an always-visible text composer with an image attachment inside the same bordered surface and one Fă lista action; destructive reset and focused item editing use native dialogs.
## Tokens
System UI sans; headings 27–36px / 22px, product labels 16–17px, body 15px, supporting text 12–14px. Light: background #f5f7f6, surface #ffffff, primary text #18251f, muted #56665d, border #dce4df, action #176448, tint #e7f2ec. Dark: background #111a16, surface #19241e, primary #edf3ee, muted #b1c0b6, border #354b3d, action #89d6ae, tint #20392a, on-action #12251b. Theme is driven by system color preference.
## Components
Controls 12px radius / 48px minimum height; icon actions 44px; item rows 14px radius / 64px minimum height; import and dialogs 18px radius. One Phosphor Regular icon family, 22px standard. Purchased rows tinted, check filled and name crossed out. Empty and loading/error states always actionable.
## Interaction/accessibility
Native buttons and inputs, associated labels, focus-visible outline, aria-live status, independent edit control, keyboard focus retained on list moves. Motion limited to 120ms color/press feedback and disabled under reduced motion. No repeated entrance animations.
## Review evidence
Actual Chromium mobile 390px / desktop 1440px and dark-mode captures inspected. Native system clipboard image writing plus trusted Ctrl+V is covered end-to-end; text paste, image removal without draft loss, and explicit clipboard button are exercised. No clipping or horizontal overflow. Actual light/dark screenshot OCR exercised; a contact name in the dark fixture remains editable/deletable (no false semantic claim). Mechanical detector: hidden preview img has no src before selection by design; modal elevation removed. Integration suite verifies no external OCR requests or uploads.
