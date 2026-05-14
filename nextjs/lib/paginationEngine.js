/**
 * Shared pagination engine for the resume builder.
 *
 * This module is the single implementation of the page-break algorithm used
 * by the live preview, PDF export, and Word export surfaces.  Each surface
 * supplies block heights measured in its own coordinate system; the algorithm
 * itself is surface-agnostic.
 *
 * Block types
 * -----------
 *  SECTION_LABEL  – Section heading (EXPERIENCE, SKILLS, …).
 *                   Must appear with at least minSkillRowsWithLabel children.
 *  GROUP_ANCHOR   – Job / education / project entry heading.
 *                   Must appear with at least minBulletsWithHeading children.
 *  BODY_BLOCK     – Paragraph-level content that flows under an anchor.
 *  ATOMIC         – Single indivisible line/bullet that cannot be split.
 */

import { effectiveContentHeight } from './layoutConfig.js';

export const BLOCK_TYPE = /** @type {const} */ ({
  SECTION_LABEL: 'section_label',
  GROUP_ANCHOR:  'group_anchor',
  BODY_BLOCK:    'body_block',
  ATOMIC:        'atomic',
});

/**
 * Compute page-break positions for an ordered list of blocks.
 *
 * Input blocks must carry measured heights.  Child arrays on SECTION_LABEL
 * and GROUP_ANCHOR blocks are used for orphan/widow checks (minimum items
 * that must accompany the heading on the same page).
 *
 * @param {Array<BlockInput>} blocks
 *   Each block: { id: string, type: BLOCK_TYPE, height: number, children?: BlockInput[] }
 * @param {import('./layoutConfig').LayoutConfig} config
 *
 * @returns {{ pageBreaks: Map<string, number>, pages: string[][] }}
 *   pageBreaks  – blockId → pushPx.  A block with a non-zero entry must be
 *                 shifted down by pushPx to start at the top of the next page.
 *   pages       – ordered list of block-id arrays, one array per page.
 */
export function paginateBlocks(blocks, config) {
  const pageHeight = effectiveContentHeight(config);
  const {
    spacing,
    minBulletsWithHeading,
    minSkillRowsWithLabel,
  } = config;

  /** @type {Map<string, number>} */
  const pageBreaks = new Map();
  /** @type {string[][]} */
  const pages = [[]];

  // Remaining px available on the current page.
  let available = pageHeight;

  // Infinite-loop guard: counts how many blocks have been pushed across all
  // pages.  If this exceeds 3× the block count the algorithm is stuck.
  let guardCount = 0;

  /** Start a new page. */
  function nextPage() {
    available = pageHeight;
    pages.push([]);
  }

  /** Record that `block` must be pushed to the next page. */
  function recordBreak(block) {
    const pushPx = available; // remaining space on current page
    pageBreaks.set(block.id, pushPx > 0 ? pushPx : 0);
    nextPage();
    if (++guardCount > blocks.length * 3) {
      console.warn('[paginationEngine] loop guard triggered — committing layout as-is');
      return false; // caller should stop iterating
    }
    return true;
  }

  /** Place a block on the current page and deduct its height. */
  function place(block, bottomSpacing = 0) {
    pages[pages.length - 1].push(block.id);
    available -= block.height + bottomSpacing;
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // ── Minimum space required to START this block on the current page ─────

    let minRequired;

    if (block.type === BLOCK_TYPE.SECTION_LABEL) {
      const n = Math.min(minSkillRowsWithLabel, (block.children || []).length);
      const childH = (block.children || [])
        .slice(0, n)
        .reduce((s, c) => s + c.height, 0);
      minRequired =
        block.height
        + spacing.betweenSectionLabelAndFirstEntry
        + childH;
    } else if (block.type === BLOCK_TYPE.GROUP_ANCHOR) {
      const n = Math.min(minBulletsWithHeading, (block.children || []).length);
      const bulletH = (block.children || [])
        .slice(0, n)
        .reduce((s, c) => s + c.height, 0);
      minRequired =
        block.height
        + spacing.betweenHeadingAndFirstBullet
        + bulletH;
    } else {
      minRequired = block.height;
    }

    // ── Break decision ─────────────────────────────────────────────────────

    // Only break if there is *some* content already on this page (available <
    // pageHeight) — avoids infinite looping when a single block exceeds the
    // full page height.
    const pageHasContent = available < pageHeight;

    if (minRequired > available && pageHasContent) {
      if (!recordBreak(block)) break;
    }

    place(block, 0);

    // If we over-filled the page, roll to the next one.
    if (available < 0 && i < blocks.length - 1) {
      nextPage();
    }
  }

  return { pageBreaks, pages };
}

// ── DOM-based block builder (browser only) ────────────────────────────────────

/**
 * Build a flat list of blocks from the hidden measurement container DOM.
 *
 * Queries `[data-section-id]` (SECTION_LABEL) and `[data-entry-id]`
 * (GROUP_ANCHOR) elements.  For each section, child entries are nested as
 * GROUP_ANCHOR children so the orphan check can use their heights.
 *
 * Heights are measured with `getBoundingClientRect().height` which correctly
 * handles subpixel rendering and CSS transforms.
 *
 * @param {Element} contentEl  The measurement container (contentRef.current)
 * @returns {BlockInput[]}
 */
export function buildBlocksFromDOM(contentEl) {
  if (!contentEl) return [];

  const containerRect = contentEl.getBoundingClientRect();
  const measureH = (el) => Math.max(1, el.getBoundingClientRect().height);

  // Collect all section elements (top-level blocks).
  const sectionEls = Array.from(
    contentEl.querySelectorAll('[data-section-id]'),
  );

  const blocks = sectionEls.map((secEl) => {
    const secId   = secEl.dataset.sectionId;
    const secType = secEl.dataset.type || '';

    // Child entries within this section.
    const entryEls = Array.from(secEl.querySelectorAll('[data-entry-id]'));
    const children = entryEls.map((entryEl) => ({
      id:       entryEl.dataset.entryId,
      type:     BLOCK_TYPE.GROUP_ANCHOR,
      height:   measureH(entryEl),
      children: [], // bullet-level granularity not yet available without deeper markup
      el:       entryEl,
    }));

    // Decide block type: sections with entry children are SECTION_LABELs;
    // skills / languages / summary etc. with only body text are also
    // SECTION_LABELs but their "children" are direct body rows, if any.
    let type = BLOCK_TYPE.SECTION_LABEL;
    let effectiveChildren = children;

    if (children.length === 0) {
      // No entry children — try body direct children as atomic rows (skills, etc.)
      const bodyEl = secEl.children[1];
      if (bodyEl) {
        effectiveChildren = Array.from(bodyEl.children).map((rowEl, idx) => ({
          id:       `${secId}-row-${idx}`,
          type:     BLOCK_TYPE.ATOMIC,
          height:   measureH(rowEl),
          children: [],
        }));
      }
    }

    return {
      id:       secId,
      type,
      height:   measureH(secEl),
      children: effectiveChildren,
      el:       secEl,
      secType,
    };
  });

  return { blocks, containerRect };
}

/**
 * Convert paginateBlocks() output to the section-adjustment map format used
 * by ResumePreview's template components.
 *
 * Each entry in the map is: blockId → marginTopPx.  A positive value means
 * "shift this block down by N px" which pushes it (and all subsequent content)
 * to the next page.
 *
 * @param {Map<string, number>} pageBreaks  from paginateBlocks()
 * @returns {Record<string, number>}
 */
export function pageBreaksToAdjustments(pageBreaks) {
  const adj = {};
  pageBreaks.forEach((pushPx, id) => {
    if (pushPx > 0) adj[id] = pushPx;
  });
  return adj;
}

// ── Word-export block builder (server-side) ───────────────────────────────────

/**
 * Estimate block heights for Word export using character-count heuristics.
 * All values are in DXA (Word's twip unit; 1pt = 20 DXA, 1px = 15 DXA).
 *
 * @param {object[]} sections   Ordered, enabled resume sections
 * @param {object}   config     from buildLayoutConfig()
 * @returns {BlockInput[]}
 */
export function buildBlocksForWord(sections, config) {
  const { page } = config;

  // Content width in pt (A4 @ 0.75in margins ≈ 481pt; Letter ≈ 468pt)
  const contentWidthPt = (page.width - page.marginLeft - page.marginRight) * (72 / 96);

  // Font metrics (Calibri 10pt body text)
  const fontSizePt      = 10;
  const lineHeightDxa   = Math.round(fontSizePt * 1.5 * 20); // 300 DXA
  const charsPerLine    = Math.max(40, Math.round(contentWidthPt / (fontSizePt * 0.5)));

  const headingDxa      = Math.round(fontSizePt * 1.2 * 20 * 1.4); // heading line + spacing
  const sectionGapDxa   = 200; // spacing.before on section heading paragraph
  const entryGapDxa     = 120; // spacing.before on entry header paragraph

  function textHeightDxa(text, extraLines = 0) {
    if (!text) return lineHeightDxa;
    const lines = Math.ceil(text.length / charsPerLine) + extraLines;
    return Math.max(1, lines) * lineHeightDxa;
  }

  const blocks = [];

  for (const sec of sections) {
    if (sec.enabled === false) continue;
    const c    = sec.content || {};
    const type = sec.type;

    // Section heading block height: one heading line + hr
    const secHeight = headingDxa + sectionGapDxa;
    const children  = [];

    if (type === 'work_experience' || type === 'projects') {
      for (const e of (c.entries || [])) {
        const headerLines  = 2; // title line + dates/location line
        const bodyText     = e.description || (e.bullets || []).join(' ');
        const entryHeight  =
          headerLines * lineHeightDxa
          + textHeightDxa(bodyText)
          + entryGapDxa;
        children.push({
          id:       `${sec.id}-entry-${children.length}`,
          type:     BLOCK_TYPE.GROUP_ANCHOR,
          height:   entryHeight,
          children: [],
        });
      }
    } else if (type === 'education') {
      for (const e of (c.entries || [])) {
        const entryHeight = 2 * lineHeightDxa + entryGapDxa; // school + degree
        children.push({
          id:       `${sec.id}-entry-${children.length}`,
          type:     BLOCK_TYPE.GROUP_ANCHOR,
          height:   entryHeight,
          children: [],
        });
      }
    } else if (type === 'skills') {
      // One block per skill row (approximately)
      for (const e of (c.entries || [])) {
        children.push({
          id:       `${sec.id}-skill-${children.length}`,
          type:     BLOCK_TYPE.ATOMIC,
          height:   lineHeightDxa,
          children: [],
        });
      }
    } else if (type === 'certifications') {
      for (const e of (c.entries || [])) {
        children.push({
          id:       `${sec.id}-cert-${children.length}`,
          type:     BLOCK_TYPE.ATOMIC,
          height:   lineHeightDxa,
          children: [],
        });
      }
    } else {
      // summary, languages, hobbies, references, custom
      const bodyH = textHeightDxa(c.text || '', 0);
      if (bodyH > 0) {
        children.push({
          id:     `${sec.id}-body`,
          type:   BLOCK_TYPE.BODY_BLOCK,
          height: bodyH,
          children: [],
        });
      }
    }

    blocks.push({
      id:       sec.id,
      type:     BLOCK_TYPE.SECTION_LABEL,
      height:   secHeight,
      children,
      secType:  type,
    });
  }

  return blocks;
}
