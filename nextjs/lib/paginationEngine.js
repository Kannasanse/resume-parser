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
 * Minimum space required to START `block` on the current page without
 * leaving an orphan heading.  Uses only the label/heading row plus the
 * first N children — never the full block height — so large sections are
 * never incorrectly treated as "doesn't fit on this page".
 *
 * Works with estimated heights (px or DXA) supplied by each block's
 * `.height` and `.children[n].height` fields.
 *
 * @param {object} block
 * @param {object} config  from buildLayoutConfig()
 * @returns {number}
 */
export function minStartSpace(block, config) {
  const { spacing, minBulletsWithHeading, minSkillRowsWithLabel } = config;
  if (block.type === BLOCK_TYPE.SECTION_LABEL) {
    const n      = Math.min(minSkillRowsWithLabel, (block.children || []).length);
    const childH = (block.children || []).slice(0, n).reduce((s, c) => s + c.height, 0);
    return block.height + spacing.betweenSectionLabelAndFirstEntry + childH;
  }
  if (block.type === BLOCK_TYPE.GROUP_ANCHOR) {
    const n       = Math.min(minBulletsWithHeading, (block.children || []).length);
    const bulletH = (block.children || []).slice(0, n).reduce((s, c) => s + c.height, 0);
    return block.height + spacing.betweenHeadingAndFirstBullet + bulletH;
  }
  return block.height;
}

/**
 * Decide whether `block` should be pushed to the next page.
 *
 * Never triggers when the page is empty (remaining === pageHeight) to
 * avoid infinite loops for blocks that exceed a full page height.
 *
 * @param {object} block
 * @param {number} remaining   px remaining on the current page
 * @param {number} pageHeight  full page height
 * @param {object} config
 * @returns {boolean}
 */
export function shouldPushBlock(block, remaining, pageHeight, config) {
  if (remaining >= pageHeight) return false; // page is empty — never push
  return minStartSpace(block, config) > remaining;
}

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

    // ── Break decision via shared shouldPushBlock ──────────────────────────
    if (shouldPushBlock(block, available, pageHeight, config)) {
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

  // scrollHeight is never clipped by ancestor overflow:hidden — always the full
  // layout height. Fall back to getBoundingClientRect().height if scrollHeight
  // is 0 (display:none or not yet laid out).
  const measureH = (el) => Math.max(1, el.scrollHeight || el.getBoundingClientRect().height);

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
    const headingH  = headingEl ? measureH(headingEl) : 24;

    // ── Section label (WORK EXPERIENCE, SKILLS, EDUCATION …) ─────────────────
    if (el.dataset.sectionId) {
      const entryEls = Array.from(el.querySelectorAll('[data-entry-id]'));

      if (entryEls.length > 0) {
        // Measure only the heading row of each entry — use data-entry-heading when
        // present (reliable for grid layouts), fall back to firstElementChild.
        const n = Math.min(minSkillRowsWithLabel ?? 2, entryEls.length);
        const entryHeadingH = entryEls.slice(0, n).reduce((sum, entryEl) => {
          const headingRow = entryEl.querySelector('[data-entry-heading]') ?? entryEl.firstElementChild;
          return sum + (headingRow ? measureH(headingRow) : 24);
        }, 0);
        return headingH + spacing.betweenSectionLabelAndFirstEntry + entryHeadingH;
      }

      // Skills / flat list style — rows without data-entry-id.
      const bodyEl = el.children[1];
      const rows   = bodyEl ? Array.from(bodyEl.children) : [];
      if (rows.length > 0) {
        const n = Math.min(minSkillRowsWithLabel ?? 2, rows.length);
        const itemH = rows.slice(0, n).reduce((s, r) => s + measureH(r), 0);
        return headingH + spacing.betweenSectionLabelAndFirstEntry + itemH;
      }

      // Atomic body (summary, languages, hobbies…) — just the heading row.
      return headingH;
    }

    // ── Entry heading (job title + company + dates + location) ───────────────
    if (el.dataset.entryId) {
      // Use data-entry-heading when present — reliable across all layout variants
      // (grid, stacked, inline). Falls back to firstElementChild.
      const entryHeadingEl = el.querySelector('[data-entry-heading]') ?? el.firstElementChild;
      const entryHeadingH  = entryHeadingEl ? measureH(entryHeadingEl) : 24;

      // Query bullets directly from the entry element — works regardless of DOM
      // depth (grid columns, nested wrappers, etc.).
      const bulletEls = Array.from(el.querySelectorAll('[data-bullet-id]'));
      if (bulletEls.length > 0) {
        const n = Math.min(minBulletsWithHeading ?? 2, bulletEls.length);
        const firstNH = bulletEls.slice(0, n).reduce((sum, b) => sum + measureH(b), 0);
        return entryHeadingH + spacing.betweenHeadingAndFirstBullet + firstNH;
      }
      return entryHeadingH + spacing.betweenHeadingAndFirstBullet + 24;
    }

    return headingH;
  }

  // Reserve bottom margin + safe buffer so content never runs to the physical
  // page edge.  Blocks that would land past PAGE_CONTENT_END are pushed early.
  const MARGIN_SAFE  = 16;
  const bottomBuffer = (config.page.marginBottom || 0) + MARGIN_SAFE;

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

    // Push when the minimum start space does not fit in the remaining space
    // after reserving the bottom margin + safe buffer.
    //
    // Push bullet-free entries (education rows, references) when their full height
    // would land in the overlap zone.  Entries with bullets are NOT pushed here —
    // the bullet pass below handles them individually, which produces less whitespace
    // than pushing the whole entry block.
    const hasBullets = el.dataset.entryId && !!el.querySelector('[data-bullet-id]');
    const fullH = el.dataset.entryId && !hasBullets ? measureH(el) : 0;
    const entryOverflows = el.dataset.entryId
      && !hasBullets
      && fullH <= effH
      && (elTop + fullH) > (pageEnd - bottomBuffer);

    // Compact sections (skills, languages, summary, etc.) have no per-row IDs.
    // If the section fits on one page but its bottom edge would cross into the
    // overlap zone, push the whole section to the next page.
    const COMPACT_TYPES = new Set(['skills', 'certifications', 'languages', 'summary', 'hobbies', 'references', 'custom']);
    const sectionFullH = el.dataset.sectionId && COMPACT_TYPES.has(el.dataset.type) ? measureH(el) : 0;
    const sectionOverflows = sectionFullH > 0
      && sectionFullH <= effH
      && (elTop + sectionFullH) > (pageEnd - bottomBuffer);

    // Detect compact sections landing just PAST a page boundary (elTop > B_n by a
    // small float amount due to cumulative pushes). pageBoundaryAfter returns B_{n+2}
    // in this case, so sectionOverflows never fires. If elTop is within marginTop pts
    // past a boundary, the section is in the "start overlap zone" and appears in both
    // the previous page's bottom margin and the current page's top — push it clear.
    const recentBoundary = elTop > pageH
      ? pageH + Math.floor((elTop - pageH) / effH) * effH
      : pageH;
    const inStartOverlapZone = sectionFullH > 0
      && elTop > recentBoundary
      && elTop < recentBoundary + config.page.marginTop;

    if (remaining - bottomBuffer < minStartSpace(el) || entryOverflows || sectionOverflows) {
      // For compact sections pushed to a boundary beyond the first (pageEnd > pageH),
      // the destination B_n sits inside the previous page's overlap zone — the heading
      // appears at the bottom of that page AND the top of the next page.  Push an extra
      // marginTop so the section clears the overlap zone entirely.
      const dest = sectionFullH > 0 && pageEnd > pageH
        ? pageEnd + config.page.marginTop
        : pageEnd;
      const push = dest - elTop;
      adj[key]    = push;
      cumulative += push;
      blockPageIdx[key] = pageIdxFor(dest);
    } else if (inStartOverlapZone) {
      const push = recentBoundary + config.page.marginTop - elTop;
      adj[key]    = push;
      cumulative += push;
      blockPageIdx[key] = pageIdxFor(recentBoundary + config.page.marginTop);
    } else {
      blockPageIdx[key] = pageIdxFor(elTop);
    }
  });

  // ── Bullet pass ──────────────────────────────────────────────────────────────
  // For each bullet, if its bottom edge crosses the page boundary, push it to
  // the next page.  The entry heading is already placed by the pass above.
  //
  // elBottom is computed as elTop + rect.height rather than rect.bottom -
  // containerRect.top to avoid any margin/overflow interference on rect.bottom.
  contentEl.querySelectorAll('[data-bullet-id]').forEach((el) => {
    const rect     = el.getBoundingClientRect();
    // scrollHeight for the same reason as measureH — unaffected by overflow clipping
    const elHeight = Math.max(1, el.scrollHeight || rect.height);
    const elTop    = rect.top - containerRect.top + cumulative;
    const elBottom = elTop + elHeight;
    const key      = el.dataset.bulletId;

    const pageEnd  = pageBoundaryAfter(elTop);

    // Bullet naturally in the start overlap zone (just past a boundary within marginTop).
    // pageBoundaryAfter returns B_{n+2} in this case so the overflow check misses it.
    const bulletRecentBoundary = elTop > pageH
      ? pageH + Math.floor((elTop - pageH) / effH) * effH
      : pageH;
    const bulletInStartOverlapZone = elTop > bulletRecentBoundary
      && elTop < bulletRecentBoundary + config.page.marginTop;

    if (elBottom > pageEnd - bottomBuffer && elTop < pageEnd) {
      // Same overlap-zone fix as the section pass: for non-first boundaries, the push
      // destination B_n is inside the overlap zone — push past it.
      const dest = pageEnd > pageH ? pageEnd + config.page.marginTop : pageEnd;
      const push = dest - elTop;
      adj[key]    = push;
      cumulative += push;
      blockPageIdx[key] = pageIdxFor(dest);
    } else if (bulletInStartOverlapZone) {
      const dest = bulletRecentBoundary + config.page.marginTop;
      const push = dest - elTop;
      adj[key]    = push;
      cumulative += push;
      blockPageIdx[key] = pageIdxFor(dest);
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

  // Deduplicate — each block ID must appear on exactly one page slice.
  // Floating-point boundary conditions can occasionally assign the same ID
  // to two adjacent pages; keep only the first occurrence.
  const seenIds = new Set();
  const deduplicatedSlices = pageSlices.map(slice =>
    slice.filter(id => {
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    })
  );

  return { adj, pageSlices: deduplicatedSlices };
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
