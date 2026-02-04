/*
 * Client-side pagination for the News table (no page navigation).
 *
 * Behavior:
 * - If Liquid already limited the items (e.g. include.limit=true + announcements.limit), there is nothing to paginate.
 * - Otherwise, it paginates the rendered <tr.news-item> rows in-place.
 * - Stores current page in sessionStorage so back/forward keeps your place.
 */

(function () {
  'use strict';

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function initPager(root) {
    const rows = Array.from(root.querySelectorAll('tr.news-item'));
    const pagination = root.querySelector('.js-news-pagination');
    const prevBtn = root.querySelector('.js-news-prev');
    const nextBtn = root.querySelector('.js-news-next');
    const status = root.querySelector('.js-news-status');

    if (!pagination || !prevBtn || !nextBtn || !status) return;

    // If Liquid applied a limit, we only have the first N items on the page.
    // In that case, "previous/next" would be misleading since other items don't exist in DOM.
    const hasLiquidLimit = root.dataset.newsHasLiquidLimit === 'true';
    if (hasLiquidLimit) return;

    const pageSize = Math.max(1, parseInt(root.dataset.newsPageSize || '5', 10));
    if (!Number.isFinite(pageSize)) return;

    const totalItems = rows.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) return;

    const storageKey = 'newsPager.page';
    let page = 1;
    try {
      const saved = parseInt(sessionStorage.getItem(storageKey) || '1', 10);
      if (Number.isFinite(saved)) page = saved;
    } catch (_) {
      // ignore
    }

    function render() {
      page = clamp(page, 1, totalPages);

      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      rows.forEach((row, idx) => {
        row.hidden = !(idx >= start && idx < end);
      });

      prevBtn.disabled = page <= 1;
      nextBtn.disabled = page >= totalPages;
      status.textContent = `Page ${page} / ${totalPages}`;

      try {
        sessionStorage.setItem(storageKey, String(page));
      } catch (_) {
        // ignore
      }
    }

    prevBtn.addEventListener('click', () => {
      page -= 1;
      render();
    });

    nextBtn.addEventListener('click', () => {
      page += 1;
      render();
    });

    // Keyboard support when focus is within the news block.
    root.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      if (e.key === 'ArrowLeft') {
        if (!prevBtn.disabled) {
          page -= 1;
          render();
          e.preventDefault();
        }
      } else if (e.key === 'ArrowRight') {
        if (!nextBtn.disabled) {
          page += 1;
          render();
          e.preventDefault();
        }
      }
    });

    pagination.hidden = false;
    render();
  }

  function boot() {
    const roots = document.querySelectorAll('.js-news-pager');
    roots.forEach((root) => initPager(root));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
