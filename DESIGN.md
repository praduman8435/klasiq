---
name: Klasiq
description: The whole family's shop in one scroll, with every school one tap away. A dark, black-red-grey shopping app for a thirty-year-old local store.
colors:
  klasiq-red: "oklch(0.56 0.2 25)"
  klasiq-red-ink: "oklch(0.98 0.012 25)"
  deal-red: "oklch(0.66 0.19 25)"
  night-black: "oklch(0.13 0.02 260)"
  recess-grey: "oklch(0.17 0.015 260)"
  card-charcoal: "oklch(0.2 0.02 260)"
  raised-graphite: "oklch(0.25 0.015 260)"
  popover-graphite: "oklch(0.25 0.02 260)"
  chalk: "oklch(0.96 0.006 85)"
  pewter: "oklch(0.72 0.015 260)"
  light-grey: "oklch(0.96 0.004 260)"
  light-grey-ink: "oklch(0.16 0.02 260)"
  alert-red: "oklch(0.62 0.2 20)"
  hairline: "oklch(1 0 0 / 12%)"
  field-line: "oklch(1 0 0 / 16%)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: "28px"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-sm:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  price:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: "24px"
    fontFeature: "\"tnum\""
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
  wordmark:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
rounded:
  md: "0.6rem"
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
  3xl: "1.65rem"
  full: "9999px"
spacing:
  2xs: "8px"
  xs: "10px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.klasiq-red}"
    textColor: "{colors.klasiq-red-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: "36px"
    padding: "0 8px"
  button-primary-hover:
    backgroundColor: "oklch(0.56 0.2 25 / 90%)"
    textColor: "{colors.klasiq-red-ink}"
  button-on-red:
    backgroundColor: "{colors.light-grey}"
    textColor: "{colors.light-grey-ink}"
    rounded: "{rounded.xl}"
    height: "44px"
    padding: "0 24px"
  button-ghost-on-red:
    backgroundColor: "oklch(1 0 0 / 12%)"
    textColor: "oklch(1 0 0)"
    rounded: "{rounded.xl}"
    height: "44px"
    padding: "0 20px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.deal-red}"
    rounded: "{rounded.xl}"
    height: "48px"
  size-select:
    backgroundColor: "{colors.card-charcoal}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.lg}"
    height: "36px"
    padding: "0 10px"
  search-header:
    backgroundColor: "{colors.recess-grey}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.xl}"
    height: "40px"
    padding: "0 12px 0 40px"
  search-field:
    backgroundColor: "{colors.card-charcoal}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.2xl}"
    height: "52px"
    padding: "0 16px 0 48px"
  product-card:
    backgroundColor: "{colors.card-charcoal}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.2xl}"
    padding: "10px"
  school-card:
    backgroundColor: "{colors.card-charcoal}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.2xl}"
    padding: "12px"
  category-circle:
    backgroundColor: "{colors.raised-graphite}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.full}"
    size: "60px"
  category-circle-schools:
    backgroundColor: "{colors.klasiq-red}"
    textColor: "{colors.klasiq-red-ink}"
    rounded: "{rounded.full}"
    size: "60px"
  hero-panel:
    backgroundColor: "{colors.klasiq-red}"
    textColor: "{colors.klasiq-red-ink}"
    rounded: "{rounded.3xl}"
    padding: "24px 20px 8px"
  promo-banner-red:
    backgroundColor: "{colors.klasiq-red}"
    textColor: "{colors.klasiq-red-ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  promo-banner-ink:
    backgroundColor: "{colors.card-charcoal}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  promo-banner-soft:
    backgroundColor: "{colors.light-grey}"
    textColor: "{colors.light-grey-ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  discount-badge:
    backgroundColor: "{colors.klasiq-red}"
    textColor: "{colors.klasiq-red-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  count-badge:
    backgroundColor: "{colors.klasiq-red}"
    textColor: "{colors.klasiq-red-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: "20px"
  icon-tile:
    backgroundColor: "{colors.raised-graphite}"
    textColor: "{colors.deal-red}"
    rounded: "{rounded.lg}"
    size: "32px"
---

<!-- Recorded 2026-09-28 from the built storefront plus five owner changes that landed during this pass (drawer rebuilt as a plain list, help section removed, smaller buttons, --deal for small red text, "More to shop" merge). All five are built. -->

# Design System: Klasiq

## Overview

**Creative North Star: "The Family Counter, In Your Pocket"**

Klasiq is a thirty-year-old family shop, and its storefront is built like the shopping apps its customers already use every day. The owner chose that category standard on purpose: a Myntra/Flipkart-grade app with a pinned search bar, a row of round category tiles, a bold red hero, swipeable offer banners, and sideways rows of product cards. Being familiar is the point. A parent should know how to use this shop within a second, and the brand shows itself through its palette, its wordmark and its voice (Hinglish headlines, "30 saal ka bharosa") rather than an unusual layout.

The world is dark and uses black, red and grey only. That is the owner's rule. The page is near-black, every section sits on it as a dark-grey band, text is a warm light grey, and Klasiq Red is the one colour that means act, sale or brand. Density is retail-native: compact product cards, 8px gaps between bands, and every control at thumb height. Uniforms, shoes, bags, kurtis and jeans sit side by side in the same grey system, so no category looks like an afterthought, and "Schools" always leads the category row so the school-fit promise stays one tap away.

This replaces the earlier "Classic, Modernized" world: its light parchment, Marquee Gold accent, Fraunces headings and cinematic dark hero with a lone school search box. The admin panel keeps its own separate theme (`.admin-theme` and `.dark` in `src/app/globals.css`). It is out of scope and unchanged, and nothing in this file describes it.

**Key Characteristics:**
- Near-black page, dark-grey card bands, light-grey text, one red. There is no fourth hue.
- The category-standard shopping-app layout, by the owner's choice: pinned header search, category circles, red hero, banner carousel, product rails.
- Plus Jakarta Sans for everything, including headings. Fraunces appears only in the "Klasiq." wordmark.
- Depth comes from tonal steps (page, band, raised grey). Shadow appears only as a response to hover or press, or on true overlays.
- Soft rounded rectangles for containers, full circles for category tiles and icon discs.
- No bottom tab bar on phones. Navigation is the pinned header plus the left drawer.

## Colors

The palette is black, red and grey only: five near-black-to-graphite surface steps in a faintly cool grey (hue 260), a warm light-grey text colour, and one red in two lightnesses.

### Primary
- **Klasiq Red** (`klasiq-red`): the fill red. Used for primary buttons (Add, Add Complete Set), the hero panel, the red promo-banner tone, the "% off" badge, the bag count badge, the active desktop category underline, and the carousel's active dot. It always carries Klasiq Red Ink on top.
- **Klasiq Red Ink** (`klasiq-red-ink`): the near-white text and icons on any Klasiq Red fill.
- **Deal Red** (`deal-red`): the lighter red, used for small red *text and icons* on dark surfaces, such as "View all" links, "See all schools", footer and drawer icon tiles, the trust-strip icons, and "Only a few left". At 0.56 lightness, Klasiq Red is too dark to read as small type on charcoal. Deal Red is the same hue, lifted until it reads.

### Neutral
- **Night Black** (`night-black`): the page itself. It shows between bands as the 8–12px gaps that separate sections. It is also the header background (at 95% with backdrop blur) and the phone `theme-color` (`#0b0e14`).
- **Recess Grey** (`recess-grey`): the recessed step, used for the header search field at rest, empty-state panels, disabled buttons and hover fills on rows.
- **Card Charcoal** (`card-charcoal`): every section band, card, product card, school card and the footer.
- **Raised Graphite** (`raised-graphite`): the raised step on top of a card. Used for category circles, icon discs and tiles, the coupon code chip, the "Added" button state and the active row in search results.
- **Popover Graphite** (`popover-graphite`): the search suggestion dropdown and other floating panels.
- **Chalk** (`chalk`): default text and headings, warm (hue 85) against the cool greys.
- **Pewter** (`pewter`): secondary text, such as captions, city names, item counts, placeholders, MRP and helper copy.
- **Light Grey** (`light-grey`) and **Light Grey Ink** (`light-grey-ink`): the one light surface in the system. It is the button on a red field ("Shop now", red-banner CTAs) and the soft promo-banner tone. It is never a page or band colour.
- **Alert Red** (`alert-red`): errors and destructive actions only. It is never decorative and never stands in for Klasiq Red.
- **Hairline** (`hairline`) and **Field Line** (`field-line`): translucent white borders for cards and for inputs. They are translucent so they read correctly on any surface step.

The surface ramp is deliberate. Night Black (0.13) is lower than Recess Grey (0.17), which is lower than Card Charcoal (0.20), which is lower than Raised Graphite and Popover Graphite (0.25). Each step is a real lightness jump, so surfaces stay distinct without relying on the border. An earlier pass with steps of about 0.01 measured under 1.1:1 and read as flat.

### Named Rules
**The Three-Colour Rule.** The storefront is black, red and grey. Nothing else is allowed: no gold, no blue, no green, and no per-category tints. Categories share one grey circle and are told apart by their icon (`getCategoryTint` returns the same grey for every category).

**The Two Reds Rule.** Klasiq Red fills, Deal Red speaks. A red surface uses `klasiq-red` with near-white ink. Red text or a red icon on a dark surface uses `deal-red`. Never set small `klasiq-red` type on charcoal.

**The Grey-on-Red Rule.** On a red field, the primary action is Light Grey with dark ink, and the secondary action is a 12% white glass button with a 30% white ring. A red button never sits on red.

**The Solid Signature Rule.** On these dark surfaces, a translucent red tint with red text (`bg-primary/10 text-primary`) measured under 4:1. A selected or signature state is a solid red fill or a red ring, never a red wash behind red text.

## Typography

**Body and Heading Font:** Plus Jakarta Sans (with ui-sans-serif, system-ui fallback)
**Wordmark Font:** Fraunces (with ui-serif, Georgia fallback), used only for "Klasiq."
**Label/Mono Font:** ui-monospace, used only for coupon codes

**Character:** A single geometric-humanist sans handles every job. Hierarchy comes from weight (500 → 800) and tight tracking, not from a second family, which matches the shopping-app standard. The Fraunces wordmark, with its red full stop, is the one moment of heritage.

### Hierarchy
- **Display** (800, 30px → 36px at `sm` → 48px at `lg`, line-height 1.1, -0.02em, balanced): the hero headline only ("Poore parivaar ki shopping, ek hi jagah").
- **Headline** (700, 24px → 30px at `sm`, -0.025em): page titles, such as a category page `<h1>`, "Find your school" and search results.
- **Title** (700, 18px → 20px at `sm`, -0.025em): section and rail headings ("Offers for you", a category rail's name). The home schools heading runs one step larger (20px → 24px). Card titles such as promo banners and recommended sets use 18–20px bold.
- **Body** (400, 16px/24px): hero subcopy and running text. Inputs are always 16px so phones don't zoom on focus.
- **Body Small** (500–600, 14px/20px): product names (500, two-line clamp with a reserved two-line height), school names (600), row labels and button labels.
- **Price** (700, 16px, tabular numerals): the selling price. MRP sits beside it at 12px Pewter, struck through, and only when it is genuinely higher.
- **Label** (600, 12px/16px, sentence case): category-circle names, header icon labels ("Orders", "Bag") on phones, badges, the stock note and the dropdown group label.
- **Wordmark** (Fraunces 700, 24px, line-height 1, -0.02em): "Klasiq" in Chalk with a Klasiq Red full stop (60% white on a red field).

### Named Rules
**The Wordmark-Only Serif Rule.** Fraunces is loaded for the wordmark alone. Every heading, on every storefront surface, is Plus Jakarta Sans (`--font-heading: var(--font-sans)` in `:root, .storefront`). A serif heading is a regression to the retired world.

**The Weight Ladder Rule.** Hierarchy steps through weight and size: 800 for the hero only, 700 for page, section and card titles plus prices, 600 for labels and controls, 500 for product names, and 400 for body. Nothing is set uppercase with wide tracking.

## Layout

**The shell.** The shell has a sticky header, a `main` area and a footer. Content is centred in a `max-w-6xl` container (1152px) with a 16px gutter on phones and 24px from `sm`. Utility pages narrow further: the school directory uses `max-w-3xl`.

**The header** (sticky, z-30). On phones it has two pinned rows. The first holds the menu button, the wordmark, Orders and Bag (56px tall). The second is the full-width search box. From `md` the search moves inline and the header is a single 64px row. From `lg` the category links appear inline between the wordmark and search.

**Homepage order.** Category circles (the shop's categories, then Schools last), then the red hero, a trust strip (cash on delivery, delivery, pickup, "30 saal ka bharosa"), the promo-banner carousel, "Offers for you" coupon tickets, one product rail per category, a final "More to shop" section, and then the schools section (six school cards plus "See all N schools"). The site is a family store first, not school-only (owner's rule): schools stay one tap away but never lead the page. Any category with fewer than three products is merged into "More to shop" instead of getting a thin rail of its own.

**Sideways rows.** Sideways rows scroll with a hidden scrollbar and snap on phones, then become grids from `sm`. Product rails show 4 columns at `sm` and 5 at `lg`, and banners show 2–3 columns. The product grid on category and search pages is 2 columns on phones, 3 at `sm`, 4 at `lg` and 5 at `xl`, with 10px gaps on phones and 16px from `sm`.

**Rhythm.** Bands are separated by 8px (12px from `sm`). A band's internal vertical padding is 20–24px (up to 32px on the schools band at `sm`). Card internal padding is tight: 10–12px for product cards (12px from `sm`) and 12px for school cards. List gaps are 10–12px.

**Breakpoints** are Tailwind's defaults: `sm` 640px, `md` 768px, `lg` 1024px and `xl` 1280px.

### Named Rules
**The Band Rule.** Every homepage section is a full-width Card Charcoal band sitting on the Night Black page. The 8px of page showing between bands is the divider. Don't add rules, borders or extra headings between bands.

**The Peek Rule.** Sideways rows size their items so the next one is visibly cut off at the edge: banners at 86% width, rail cards at 44vw (capped at 224px), category circles at 76px. The cut is the "there's more" cue. Don't add arrows on phones.

**The No-Tab-Bar Rule.** Phones have no bottom tab bar, by the owner's decision. The pinned header (menu, Orders, Bag, search) and the left drawer carry all navigation. The only fixed bottom bars are the purchase bars on Product Detail, Bag and Checkout.

**The Thumb-Height Rule.** Header icons, drawer rows, footer rows, search results and school cards are at least 44px tall (search and footer rows 44–48px, school cards 80px). Hero buttons are 44px. On product cards, the size select and Add button are 36px, a density choice so cards stay compact.

## Elevation & Depth

Depth is tonal first. A surface reads as raised because it sits one lightness step above what's behind it: a band on the page, a graphite tile on a band. It also gets a translucent Hairline border where it needs an edge. Nothing casts a shadow at rest. The header uses backdrop blur over a 95% Night Black fill.

### Shadow Vocabulary
- **Card hover** (`box-shadow: 0 8px 24px -12px oklch(0.2 0.03 268 / 0.25)`): product cards on hover, paired with a 1.03 image zoom. It is a quiet, near-black ambient shadow.
- **Overlay** (`box-shadow: 0 12px 32px -8px oklch(0.2 0.03 268 / 0.25)`): the search suggestion dropdown on Popover Graphite.
- **On-red lift** (`box-shadow: 0 6px 16px -6px oklch(0.1 0.02 260 / 0.6)`): the Light Grey button on the red hero only.

### Named Rules
**The Tone-Before-Shadow Rule.** If a surface needs to look raised while at rest, step it up the grey ramp or give it a Hairline border. Shadows are reserved for hover, overlays, and the one button on red.

## Shapes

All shapes are soft rounded rectangles, plus circles. The base radius is 12px (`--radius: 0.75rem`), and containers scale up from it:
- **9.6px** (`md`): the "% off" badge.
- **12px** (`lg`): product-card controls, "View all", footer and drawer icon tiles, and banner CTAs.
- **16.8px** (`xl`): header icon buttons, hero buttons, drawer rows, the header search and "See all schools".
- **21.6px** (`2xl`): cards of every kind (product, school, banner, recommended set, coupon ticket), empty-state panels, the large search field and the suggestion dropdown.
- **26.4px** (`3xl`): the red hero panel.

Full circles are used for category tiles (60px, 72px from `sm`), icon discs (36–40px), the bag count badge and carousel dots (the active dot stretches to a 20px pill). The coupon ticket is the one dashed shape: a 2xl card with a dashed 60%-red border and a mono code chip with a red ring. School crests are shield silhouettes. Borders are always 1px Hairline, with no border-plus-shadow stacking at rest.

## Components

### Buttons
Buttons are compact, bold and tactile. They press to 97% scale (`active:scale-[0.97]`).
- **Primary** (`button-primary`): Klasiq Red fill with near-white ink, 12px radius, 600 weight at 14px. On product cards it is 36px tall and fills the space beside the size select, and its label stays literally "Add" so it survives two-column phone grids (`aria-label` carries the full action). Hover goes to 90% red. After adding, it shows "Added" with a check on Raised Graphite for about 1.4s. When out of stock it turns Recess Grey with Pewter text and can't be pressed.
- **On-red** (`button-on-red`): Light Grey with dark ink, 44px tall, bold, used for "Shop now" on the hero and for CTAs on red banners.
- **Ghost on red** (`button-ghost-on-red`): 25% black fill with a 40% white ring, 44px tall. Kept for a secondary action on red; the hero itself now has only "Shop now".
- **Outline** (`button-outline`): Hairline border, Deal Red bold label and chevron, full width, 48px tall ("See all N schools"). On hover it fills with Raised Graphite.
- **Text link** ("View all"): Deal Red 14px/600 with a chevron, at least 40px tall, with a Raised Graphite hover fill.
- **Focus:** every control shows a 3px ring in 50% Klasiq Red on `:focus-visible`.

### Chips / Badges
- **% off badge** (`discount-badge`): a solid red, 12px bold badge in the product image's top-left corner, shown only when the MRP is genuinely higher.
- **Count badge** (`count-badge`): a 20px red circle on the bag icon with a 2px Night Black ring, capped at "9+".
- **Coupon code chip:** a Raised Graphite chip in mono bold with wide tracking and a 50% red ring. This is the only use of mono type.

### Cards / Containers
- **Corner Style:** 21.6px (`2xl`) for every card.
- **Background:** Card Charcoal on the Night Black page. Cards inside a band keep the same Card Charcoal and take a Hairline border for their edge.
- **Shadow Strategy:** none at rest. See Elevation & Depth.
- **Border:** 1px Hairline.
- **Internal Padding:** 10–12px for product and school cards, 16–20px for recommended sets and banners.

### Inputs / Fields
- **Header search** (`search-header`): Recess Grey fill with no visible border, 40px tall, a 16px search icon on the left, 16px text. On focus it lifts to Card Charcoal with a 40% red border and the red focus ring. One box finds both schools and products: schools are listed first under a "Schools" group label, and the last row reads "See products for 'query'".
- **Large search** (`search-field`): Card Charcoal with a Hairline border, 52px tall, 21.6px radius. Used in the home schools section and as the school-directory filter.
- **Suggestion dropdown:** Popover Graphite with a 2xl radius and the overlay shadow, portalled to the body. Rows are at least 48px tall, with a 36px icon disc and an up-right arrow. The active row is Raised Graphite.
- **Size select** (`size-select`): Card Charcoal with a Hairline border, 12px radius and 36px height, showing the size in 14px semibold. Sizes that can't be ordered are disabled with "— out of stock".
- **Error / Disabled:** invalid fields take Alert Red. Disabled fields drop to 50–60% opacity.

### Navigation
- **Header:** icon-over-label buttons on phones (Orders, Bag; 12px semibold labels at 80% Chalk). They become icon-beside-label from `sm`, with a Recess Grey hover. Desktop category links are 14px semibold at 75% Chalk. The active link turns red with a 3px red underline bar.
- **Phone drawer** (left sheet, 86vw, max 384px, on Night Black): a plain list after the kirana-shop drawer. At the top are the wordmark and a close button. Next comes a "Categories" list, where each row has an icon tile, the category name and a chevron, and the current page's row is tinted. After a divider come rows for Find your school, Track order, Mera Khata, Your bag (with the count badge), Call the store and Get directions. There is no category-circle grid and no red header panel. Rows are full thumb height (at least 44px).
- **Footer** (the kirana-shop pattern): a Card Charcoal band. On the left is a brand block with the wordmark, the store description and the "backed by" line in Pewter. On the right is a short column of icon rows: phone number, Get directions, Track an order, Find your school. Each row has a 32px Raised Graphite icon tile with a Deal Red icon and 14px semibold text, and turns red on hover. A copyright line closes it. Search is not repeated in the footer.

### Category Circles (signature)
A sideways row of round tiles at the very top of the homepage. It is centred on desktop and snaps on phones. Each tile is a 60px circle (72px from `sm`) with a 28–32px line icon at stroke 1.75 and a two-line 12px semibold label under it. Every tile, "Schools" included, is Raised Graphite with a Chalk icon, and "Schools" comes last. Each category's icon is the one chosen in Admin → Categories (the icon picker, `CATEGORY_ICONS`), or "Auto", guessed from its name; Uniforms has its own shirt-and-tie drawing so it never matches Shirts. On hover a tile lifts 2px, and on press it shrinks to 95%.

### Red Hero (signature)
A Klasiq Red panel with a 26.4px radius, inside a Card Charcoal band. On the left are the Display headline, a line in full white listing the real category names, and one button: On-red "Shop now". On the right is a flat drawing (`HeroArt`) of a school shirt with a striped tie, a school bag, a kurti and a shoe, in black, grey and red only on soft white discs. On phones the drawing sits under the copy at 62% width. From `sm` it is anchored bottom-right at 88% of the panel's height. It is decorative and hidden from assistive tech.

### Promo Banner Card
The owner-managed homepage banners, shared exactly with the admin preview, which wraps them in `.storefront`. Each is a 2xl card at least 160px tall with 20px padding, a 20px bold title and 14px body copy. A large icon disc is tucked into the top-right corner, and the CTA sits at the bottom left (36px, 12px radius, trailing arrow). There are three tones and no others:
- **RED:** Klasiq Red, with a Light Grey CTA.
- **INK:** Card Charcoal with a Hairline ring, with a red CTA.
- **SOFT:** Light Grey, with a red CTA and a white disc holding a red icon.

On phones the carousel swipes with native scroll snap and shows dots (the active dot is a 20px red pill, the others are 6px at 20% Chalk). From `sm` it becomes a grid.

### Product Card (signature)
The storefront's one product card, used on category pages, search, school pages and home rails. It is compact like a shelf tag, not a small detail page. From top to bottom: a square picture (with the optional "% off" badge, and a 1.03 zoom on hover), a two-line name at 14px/500 that turns red on hover, the price at 16px bold tabular with the struck-through MRP beside it, and a stock note shown only when it matters ("Only a few left" in Deal Red, or out of stock). Last comes one row with the size select and the Add button, both 36px. The card is Card Charcoal with a 2xl radius and a Hairline border.

### Product Image Placeholder
Many products have no photo, and that is a permanent, expected state. The placeholder is a flat Raised Graphite panel with the category's line icon centred at stroke 1.25 and 80% opacity. It comes in three sizes: compact for line items, default for cards and large for Product Detail. It is never a stripe pattern, a circular badge or the word "placeholder".

### School Card and Crest
A school row is a single link at least 80px tall: a 2xl Card Charcoal card with a Hairline border and 12px padding. It holds the crest (44×52px), the school name at 14px semibold over the city in Pewter (demo schools show "Demo school · sample items" instead), and a trailing chevron. On hover the border goes to 40% red, and the name and chevron turn red. Without a logo, the crest is a shield in one of five red or grey fills picked by a hash of the name, with a 45% white inner keyline and the school's initials in white 700 sans. The full directory adds an instant filter and, from 12 schools up, sticky letter headers.

### Mobile Sticky Purchase Bar (Product Detail, Bag, Checkout)
Below `sm`, a fixed bottom bar (Card Charcoal at 95% with backdrop blur and a Hairline top border) keeps the price and purchase actions reachable. The page reserves bottom padding sized to the bar's measured height plus the safe area. It reuses the same action and loading state as the inline buttons. Don't put more than the price and the purchase actions into it.

## Do's and Don'ts

### Do:
- **Do** keep the storefront to black, red and grey: Night Black page, Card Charcoal bands, Raised Graphite tiles, Chalk text and Klasiq Red (see The Three-Colour Rule).
- **Do** fill with Klasiq Red and write with Deal Red. Small red text and icons on dark use `deal-red` (see The Two Reds Rule).
- **Do** use Light Grey with dark ink for the action on a red field (see The Grey-on-Red Rule).
- **Do** follow the category standard: pinned search, round category tiles led by Schools, red hero, banners, product rails. It is the owner's deliberate choice, and familiarity is the feature.
- **Do** set every heading in Plus Jakarta Sans, and keep Fraunces for the "Klasiq." wordmark only (see The Wordmark-Only Serif Rule).
- **Do** separate homepage sections as Card Charcoal bands with 8px of page between them (see The Band Rule).
- **Do** keep product cards compact (picture, name, price with MRP, a stock note only when it matters, size and Add in one row), with the Add label kept literally "Add".
- **Do** show a price's MRP and "% off" only when the MRP is genuinely higher than the price.

### Don't:
- **Don't** add a bottom tab bar on phones (see The No-Tab-Bar Rule).
- **Don't** bring back gold, blue, green or per-category colour tints. Categories differ by icon, not hue.
- **Don't** return to the dark "cinematic" hero with a lone school search box, or to serif headings. The owner retired both.
- **Don't** set small `klasiq-red` text on charcoal, and don't use a translucent red wash behind red text (see The Solid Signature Rule).
- **Don't** give a surface a shadow at rest to make it feel important. Step it up the grey ramp instead (see The Tone-Before-Shadow Rule).
- **Don't** widen the product card toward a detail-page layout to fix a spacing complaint. The fix belongs inside the compact card.
- **Don't** give a category with fewer than three products its own rail. It goes into "More to shop".
- **Don't** repeat search in the footer, or grow the footer beyond the brand block and a short list of icon rows.

### Search Suggestions (header)
Typing two letters in the header search opens a dropdown grouped as Categories (icon tile + name), Schools (crest disc + town) and Products (thumbnail, name, the school's name for a school's own item, and the from-price on the right), ending with "See all results for …". Enter searches everything. School-only uniform items are included everywhere products are listed (category pages, search, suggestions) and carry their school's name; category pages that have school items show a row of school chips ("All", then each school) to narrow the list.

### Bag and Checkout (after the kirana shop)
Both are stacks of Card Charcoal cards (2xl radius, hairline border): the bag's item list and summary; checkout's Contact, Delivery and Payment steps and a sticky Order summary card on desktop. The quantity stepper is a solid red pill. On phones each page ends in the same fixed red bar: 56px tall, 2xl radius, the item count or "Total" and the amount on the left, and the action ("Checkout" / "Place order") with an arrow on the right.
