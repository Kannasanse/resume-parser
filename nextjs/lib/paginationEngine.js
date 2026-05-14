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

// ── Geometric adjustment engine (browser / live preview) ─────────────────────

/**
 * Compute section/entry adjustment map for the live preview using a direct
 * geometric measurement pass over the hidden DOM container.
 *
 * This is the authoritative page-break algorithm for the live preview surface.
 * It walks every `[data-section-id]` and `[data-entry-id]` element in DOM
 * order, measures their positions and heights with `getBoundingClientRect`,
 * and determines whether each element should be pushed to the next page.
 *
 * Key design points that fix the whitespace bug (§18):
 * ─ Section labels: minimum required space = heading height + spacing +
 *   first N children heights (NOT total section height).  Using total section
 *   height massively over-estimates and causes premature breaks.
 * ─ Entries are evaluated individually so a long section spanning multiple
 *   pages has per-entry breaks rather than being treated as a monolith.
 * ─ Cumulative adjustments carry forward correctly: after pushing block B by
 *   pushPx, every subsequent block's effective top is shifted by the same
 *   amount, so C's page-boundary check uses C's true post-adjustment position.
 * ─ Inter-section spacing is not added speculatively — it is only charged when
 *   the next block actually fits on the current page.
 *
 * Key design points that fix the resize bug (§19):
 * ─ This function is called only when content height changes (not on resize).
 *   The ResizeObserver split in ResumePreview ensures resize events only
 *   update the CSS scale transform.
 *
 * @param {Element} contentEl  contentRef.current — fixed-width measurement div
 * @param {object}  config     from buildLayoutConfig()
 * @returns {Record<string, number>}  blockId → marginTopPx
 */
export function computeGeometricAdjustments(contentEl, config) {
  if (!contentEl) return {};

  const containerRect = contentEl.getBoundingClientRect();
  const pageH  = config.page.height;
  const effH   = effectiveContentHeight(config);
  const { minBulletsWithHeading, minSkillRowsWithLabel, spacing } = config;

  const measureH = (el) => Math.max(1, el.getBoundingClientRect().height);

  /** Y position of the next page boundary after elTop (in content coordinates). */
  function pageBoundaryAfter(elTop) {
    if (elTop < pageH) return pageH;
    const n = Math.floor((elTop - pageH) / effH);
    return pageH + (n + 1) * effH;
  }

  /**
   * Minimum vertical space required to START el on the current page without
   * leaving an orphan heading.  Measures only the label/heading row plus the
   * first N immediate children — never the full element height.
   */
  function minStartSpace(el) {
    const headingEl = el.firstElementChild;
    const headingH  = headingEl ? measureH(headingEl) : 20;

    if (el.dataset.sectionId) {
      // Section label: needs label row + spacing + first N entry heights.
      // Never measures the full section (sections always span pages).
      const entryEls = Array.from(el.querySelectorAll('[data-entry-id]'));
      if (entryEls.length > 0) {
        const n = Math.min(minSkillRowsWithLabel, entryEls.length);
        const itemH = entryEls.slice(0, n).reduce((s, e) => s + measureH(e), 0);
        return headingH + spacing.betweenSectionLabelAndFirstEntry + itemH;
      }
      // Body-only section (skills, summary, languages…): label + first N rows.
      const bodyEl = el.children[1];
      const rows   = bodyEl ? Array.from(bodyEl.children) : [];
      if (rows.length > 0) {
        const n = Math.min(minSkillRowsWithLabel, rows.length);
        const itemH = rows.slice(0, n).reduce((s, r) => s + measureH(r), 0);
        return headingH + spacing.betweenSectionLabelAndFirstEntry + itemH;
      }
      // Atomic body (no measurable children) — just the heading row.
      return headingH;
    }

    // Entry heading: heading row + spacing + first bullet body height (capped).
    const bodyEl  = el.children[1] || el.children[2];
    const bulletH = bodyEl ? Math.min(measureH(bodyEl), 36) : 20; // ~2 lines
    return headingH + spacing.betweenHeadingAndFirstBullet + bulletH;
  }

  const adj      = {};
  let cumulative = 0;

  /** 0-based index of the page that contains the given adjusted top position. */
  function pageIdxFor(adjustedTop) {
    if (adjustedTop < pageH) return 0;
    return 1 + Math.floor((adjustedTop - pageH) / effH);
  }

  // blockPageIdx stores the page each block effectively lands on after all
  // cumulative adjustments.  Blocks that were never pushed still carry the
  // page index derived from their natural position in the measurement DOM.
  /** @type {Record<string, number>} */
  const blockPageIdx = {};

  contentEl.querySelectorAll('[data-section-id], [data-entry-id]').forEach((el) => {
    const rect    = el.getBoundingClientRect();
    const elTop   = rect.top - containerRect.top + cumulative;
    const key     = el.dataset.sectionId || el.dataset.entryId;

    const pageEnd   = pageBoundaryAfter(elTop);
    const remaining = pageEnd - elTop;

    if (remaining <= 0) {
      // Already sitting exactly at a page boundary — no push, keep position.
      blockPageIdx[key] = pageIdxFor(elTop);
      return;
    }

    // Push only when the minimum start space (label/heading + first N children)
    // does not fit in the remaining space on this page.
    if (remaining < minStartSpace(el)) {
      adj[key]    = remaining;
      cumulative += remaining;
      // Block now starts at the next page boundary (pageEnd).
      blockPageIdx[key] = pageIdxFor(pageEnd);
    } else {
      blockPageIdx[key] = pageIdxFor(elTop);
    }
  });

  // ── Bullet pass ──────────────────────────────────────────────────────────────
  // For each legacy bullet, if its bottom edge crosses the page boundary, push
  // it (and all subsequent bullets in the same entry) to the next page.
  // The entry heading itself is already placed above; only the bullet rows move.
  contentEl.querySelectorAll('[data-bullet-id]').forEach((el) => {
    const rect      = el.getBoundingClientRect();
    const elTop     = rect.top  - containerRect.top + cumulative;
    const elBottom  = rect.bottom - containerRect.top + cumulative;
    const key       = el.dataset.bulletId;

    const pageEnd   = pageBoundaryAfter(elTop);

    if (elBottom > pageEnd && elTop < pageEnd) {
      // Bullet straddles the boundary — push it to the next page.
      const push = pageEnd - elTop;
      adj[key]    = push;
      cumulative += push;
      blockPageIdx[key] = pageIdxFor(pageEnd);
    } else {
      blockPageIdx[key] = pageIdxFor(elTop);
    }
  });

  // ── Build page slices ────────────────────────────────────────────────────────
  // Assign each block to the page it naturally or forcibly lands on.
  // Using position-based page indices (blockPageIdx) instead of adj-presence
  // ensures blocks that naturally flow past a page boundary (no push needed)
  // are still assigned to the correct page slice.
  const orderedIds = [];
  contentEl.querySelectorAll('[data-section-id], [data-entry-id], [data-bullet-id]').forEach((el) => {
    orderedIds.push(el.dataset.sectionId || el.dataset.entryId || el.dataset.bulletId);
  });

  const totalPages = orderedIds.reduce((m, id) => Math.max(m, (blockPageIdx[id] || 0) + 1), 1);
  /** @type {string[][]} */
  const pageSlices = Array.from({ length: totalPages }, () => []);
  for (const id of orderedIds) {
    pageSlices[blockPageIdx[id] || 0].push(id);
  }

  return { adj, pageSlices };
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
