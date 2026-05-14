/**
 * Shared layout configuration for the resume builder.
 * This is the single source of truth for all page dimensions, margins,
 * spacing, and pagination constants used by the live preview, PDF export,
 * and Word export surfaces.
 */

const clamp = (n, lo, hi, d) =>
  typeof n === 'number' && !isNaN(n) ? Math.max(lo, Math.min(hi, n)) : d;

const mmToPx = (mm) => mm * (96 / 25.4);

// Page dimensions in px at 96 dpi.
export const PAGE_DIMS = {
  a4:     { width: 794,  height: 1123 },
  letter: { width: 816,  height: 1056 },
};

/**
 * Build a fully-resolved layout config from user spacing/design settings.
 * All internal layout values are expressed in px.
 *
 * @param {object} spacingSettings  resume.spacing_settings
 * @param {object} designSettings   resume.design_settings
 * @returns {LayoutConfig}
 */
export function buildLayoutConfig(spacingSettings = {}, designSettings = {}) {
  const pageId = designSettings?.pageSize || 'a4';
  const { width, height } = PAGE_DIMS[pageId] ?? PAGE_DIMS.a4;

  const marginX = mmToPx(clamp(spacingSettings?.leftRightMargin, 5, 30, 15));
  const marginY = mmToPx(clamp(spacingSettings?.topBottomMargin, 5, 30, 15));

  return {
    page: {
      id: pageId,
      width,
      height,
      marginTop: marginY,
      marginBottom: marginY,
      marginLeft: marginX,
      marginRight: marginX,
    },
    header: {
      height: 0,
      bottomSpacing: 0,
    },
    footer: {
      height: 0,
      topSpacing: 0,
    },
    spacing: {
      betweenSectionLabelAndFirstEntry: 8,
      betweenEntries: 12,
      betweenHeadingAndFirstBullet: 4,
      betweenBullets: 3,
      betweenSkillRows: 4,
      afterLastItemInSection: 16,
      beforePageBreak: 0,
      afterPageBreak: 0,
    },
    orphanWidowMinLines: 2,
    minBulletsWithHeading: 2,
    minSkillRowsWithLabel: 2,
    debounceMs: 300,
  };
}

/**
 * The vertical space available for content on a single page.
 * Subtracts margins and header/footer zones.
 *
 * @param {LayoutConfig} config
 * @returns {number} px
 */
export function effectiveContentHeight(config) {
  const { page, header, footer } = config;
  return (
    page.height
    - page.marginTop
    - page.marginBottom
    - header.height
    - header.bottomSpacing
    - footer.height
    - footer.topSpacing
  );
}

// ── Unit conversion helpers ────────────────────────────────────────────────────

/** px → DXA (Word twips). DXA = px × 1440 / 96 */
export const pxToDxa = (px) => Math.round(px * 1440 / 96);

/** px → pt (PDF). pt = px × 72 / 96 */
export const pxToPt = (px) => px * 72 / 96;

/** mm → DXA */
export const mmToDxa = (mm) => Math.round(mm * 1440 / 25.4);

/** inch → DXA */
export const inToDxa = (inches) => Math.round(inches * 1440);
