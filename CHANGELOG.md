# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-10-17 — Template editor UX, previews, and color picker

### Added

- **Drag-and-drop template layout** – Reorder rows and field chips within rows in the visual template editor (`@dnd-kit/core`, `@dnd-kit/sortable`), with row insert drop zones and dedicated drag-over layout helpers
- **Field management UI** – `AddFieldMenu` with Radix **dropdown menu** for adding fields; per-row field blocks with remove actions and clearer row/field chrome
- **`TemplateFieldStylePanel`** – Per-field overrides for font, style, size, and **light/dark text colors** with reset-to-default
- **`ColorInput` + `ColorPickerPanel`** – Popover color picker (`react-colorful`, `colord`) with preset swatches, saturation/hue picker, RGB and HSL sliders/inputs, and hex entry
- **App-themed signature previews** – `wrapSignatureHtmlForPreview` / `rewriteSignatureHtmlForAppPreview` flatten `@media (prefers-color-scheme: dark)` rules so in-app previews follow the app light/dark toggle; copied HTML still keeps client-side dark-mode rules
- **`useSyncSignaturePreviewIframeDoc`** and **`useAppPreviewTheme`** – Shared iframe document sync (layout effect, no theme flash) across template editor, wizard, template picker, library cards, and home marquee
- **`SignaturePreviewIframe` `fit` modes** – `content` (natural size, home showcase) vs `container` (scale-to-fit library cards) with intrinsic measurement via `measureSignatureIntrinsicSize`
- **Hyperlink dark-mode colors** – `resolveFieldTextColors` / `signatureTextColors.ts` and builder dark CSS so phone, email, website, and social links use link blue in light mode and `#7CB8FF` in dark when on defaults
- **Template editor save state** – **Saved** indicator when the custom template matches the last persisted snapshot (`templateEditorSnapshot.ts`)
- **Dependencies** – `react-colorful`, `colord`, `@dnd-kit/*`, and UI primitives (`popover`, `dropdown-menu`)

### Changed

- **Template editor layout** – Preview and attributes/field panels reorganized: live preview above template attributes; template name in header; image row order **Image · Placement · Shape · Size**; full-width selects; removed separate generated-HTML panel in favor of preview + copy actions
- **Live preview panel** – Dropped nested bordered preview box; iframe sized to signature content without extra bottom gap; panel no longer forced to a minimum viewport height
- **Preview surfaces** – Transparent iframe backgrounds; preview document padding trimmed on the bottom edge; theme class on `html` applied in `useLayoutEffect` in `UserContext`
- **Field style color display** – Swatches and placeholders use `resolveFieldTextColors` so inherited defaults (e.g. social links dark blue) match the preview
- **Image export** – PNG/JPEG/WebP export respects the active app preview theme when rendering off-screen
- **Template library cards** – Preview slots use the shared iframe component and scaling behavior
- **Home showcase carousel** – Full-width marquee uses content-fit previews without incorrect clipping from viewport measurement
- **i18n** – Template editor strings for drag hints, field style, saved state, light/dark text colors, and image short labels (`en.json`)

### Removed

- **`HtmlPanel`** – Generated HTML is no longer shown as a separate editor panel on the template edit page (copy actions remain on the live preview)

## [1.2.1] - 2026-06-12 — Signature image export

### Added

- **Signature image export** – Export signatures as **PNG**, **JPEG**, or **WebP** from the library and the signature wizard review step, using `html-to-image` and a dedicated off-screen render pass
- **`SignatureExportButton`** – Shared export control with a portaled dropdown (HTML to clipboard, plus image formats) so menus are not clipped inside library cards
- **Export tab flow** – Image export opens a blank tab on click, shows a generating state, then displays the image with **Save image as…** and a download link (reliable across browsers after async rendering)
- **Review-step export** – The guided signature editor’s final step now includes the same **Export** actions as the signatures library
- **Signatures library actions** – **Copy** (rich HTML for Gmail) and **Export** dropdown on each saved signature card
- **Export i18n** – `signatures.copy`, `signatures.export`, `signatures.exporting`, and image-format labels across all nine locales

### Changed

- **Signatures library header** – Compact **New signature** and **Import from LinkedIn** actions replace the large dashed create card
- **README production badge** – Fixed broken deploy workflow badge; now reflects live status at [email-signature-editor.pages.dev](https://email-signature-editor.pages.dev/)

## [1.2.0] - 2026-06-11

### Added

- **Schema-driven template model (`NewTemplate`)** – Templates are now structured data instead of hand-authored HTML files: global **image** and **text** config plus a **rows** layout of typed field chips (`name`, `role`, `company`, `phone`, `email`, `link`, `socials`, `text`)
- **Per-field text overrides** – Each row field can override font, color, size, and style (`normal` / `bold` / `italic`); unset properties inherit the template default at render time via `resolveFieldText()`
- **Template HTML builder** – `buildTemplateHtmlFromSchema()` generates table-based email HTML from the schema, including image placement, hyperlink fields, and disclaimer support
- **Template row helpers** – `templateRows.ts` provides normalization, cloning, row construction (`buildTemplateRows`), and helpers for detecting customized field styles
- **Visual template editor** (`/templates/edit`) – Build and refine templates with:
  - **Template attributes** – name, image URL/placement/size/shape, and global text defaults
  - **Template rows** – add/remove rows, pick field types, and style individual fields
  - **Live HTML + preview panels** – generated markup and rendered preview stay in sync; copy actions for Gmail and raw HTML
- **Saved custom templates** – User templates persist in `localStorage` (`savedTemplates.ts`) alongside the three built-in layouts
- **Duplicate template** – Clone any built-in or saved template from the templates library and open it in the editor
- **Marketing home page** (`/`) – New landing experience with hero, primary CTAs, and below-the-fold sections
- **Signature showcase carousel** – Two full-width marquee rows scrolling in opposite directions:
  - **Modern** (default template) on top, **Compact** on bottom
  - Five fixed demo signatures (Google, Meta, Microsoft, YouTube, Revolut) with fictional names and shared example contact details
  - Auto-sized iframe previews with no card chrome — signature content only
- **Home landing sections** – “How it works” steps, **Everything you need** feature row (horizontal marquee), built-in template summaries, and bottom CTA
- **Home i18n** – Landing copy under `home.*` in locale files (English fully translated; other locales fall back where needed)

### Changed

- **Built-in templates** – Modern, Minimal, and Compact are now defined as `NewTemplate` schemas in `src/lib/templates/index.ts`; static per-template HTML files were removed
- **Template resolution** – `resolveTemplateFromSchema()` builds HTML from the schema before substituting `{{VARIABLE}}` values
- **App routing** – `/` is the marketing home page; saved signatures live at `/signatures`, signature editing at `/signatures/edit`, template library at `/templates`, and template editing at `/templates/edit`
- **Hyperlink styling** – Phone, email, website, and social fields use dedicated link color defaults (`DEFAULT_HYPERLINK_COLOR`) with per-field overrides in the builder
- **Text style model** – Replaced `uppercase` with **bold** (`font-weight: bold`); added **`xs`** size for text and images

### Removed

- **Static template HTML modules** – `default.ts`, `minimal.ts`, `compact.ts`, and `disclaimerSnippet.ts` in favor of the shared builder pipeline

## [1.1.1] - 2026-06-08

### Added

- **App routing with `react-router`** – Introduced route-based navigation with three pages: **Library (Home)** at `/`, **Edit (Simple)** at `/edit`, and **Edit (Advanced)** at `/edit/advanced`
- **App module structure** – Moved app orchestration into `src/app/` with dedicated `pages/`, `contexts/`, and `routes/` folders
- **Shared user context provider** – Added a single provider to centralize local-storage-backed library data and active editing state across pages

### Changed

- **Home experience is now the default page** – The project now lands on the saved-signatures library view by default
- **Edit flow now uses explicit routes** – Creating or opening a signature transitions into `/edit`, and advanced editing is handled by `/edit/advanced`
- **Simple/Advanced state is synchronized in real time** – Field values and template HTML are shared through context, so toggling between edit modes no longer resets in-progress data
- **Simple mode preference persistence removed** – Removed `MODE_STORAGE_KEY` behavior; edit mode now defaults to simple mode unless navigated to advanced route


## [1.1.0] - 2026-03-29

### Added

- **Simple mode (default)** – Landing experience with a **library** of saved signatures stored in `localStorage`, card previews, timestamps, delete, and **Create new signature** to start the flow
- **Guided creation wizard** – Pick a template, complete fields step by step, then **Review** with **Copy for Gmail**, **Copy HTML**, **Save**, and **Edit from start**
- **Template picker grid** – Visual previews for each built-in template before entering field steps
- **Optional disclaimer** – `{{DISCLAIMER}}` on every built-in template; optional plain-text block below the signature (HTML-escaped, line breaks preserved); the disclaimer section is omitted when the field is empty
- **Disclaimer editing** – Textarea in advanced **Values** and a dedicated step in the simple wizard
- **Simple / Advanced toggle** – Switch modes from the header; preference is persisted locally
- **`Textarea` UI component** – shadcn-style textarea for multi-line fields
- **Expanded i18n** – Catalan, Chinese, Dutch, French, German, Italian, Russian, and more, in addition to English and Spanish

### Changed

- **Template selector** – Shown in the header only in **advanced** mode (hidden in simple mode so templates are chosen inside the wizard)
- **Opening saved signatures** – Values are merged with defaults so older saves without newer fields (e.g. disclaimer) still load correctly

### Documentation

- **README** – Screenshots and short descriptions for the library home, simple-mode review step, and advanced HTML + preview layout (`src/assets/sample-*.png`)

## [1.0.0] - 2026-03-02

### Added

- **React email signature editor** – Vite + React + TypeScript web app for editing HTML email signatures
- **Split layout** – HTML editor on one side, live preview on the other
- **Copy to clipboard** – One-click copy of resolved signature for pasting into Gmail
- **Template variables** – Editable placeholders: `{{NAME}}`, `{{POSITION}}`, `{{COMPANY}}`, `{{LINKEDIN_URL}}`, `{{PHONE}}`, `{{EMAIL}}`, `{{WEBSITE}}`, `{{IMAGE}}`
- **Variable highlighting** – `{{VARIABLE}}` placeholders highlighted in the HTML editor (uses `react-simple-code-editor`)
- **Values form** – Form to edit all template variables; copy exports resolved HTML with values applied
- **Template selector** – Select template dropdown (resets HTML editor, keeps values when re-selecting)
- **Layout toggle** – Switch between horizontal (side-by-side) and vertical (stacked) panel alignment
- **Vertical layout** – Preview on top, editor below; preview height sizes to content (no empty space)
- **i18n** – English and Spanish with `react-i18next`; language selector in header
- **Tailwind CSS v4** – Modern styling with `@tailwindcss/vite`
- **shadcn/ui** – Button, Card, Input, Label, Select components; New York style, neutral theme
- **Lucide React** – Icons for layout toggle and copy button
- **Production deployment** – Live demo at [https://email-signature-editor.pages.dev/](https://email-signature-editor.pages.dev/)