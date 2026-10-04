interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

/** 上一页 / 下一页分页控件。 */
export function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  const canGoPrevious = page > 1;
  const canGoNext = totalPages > 0 && page < totalPages;

  return (
    <nav className="pagination" aria-label="分页">
      <button type="button" disabled={!canGoPrevious} onClick={() => onChange(page - 1)}>
        上一页
      </button>

      <span className="pagination__status">
        第 {page} / {Math.max(totalPages, 1)} 页 · 共 {total} 条
      </span>

      <button type="button" disabled={!canGoNext} onClick={() => onChange(page + 1)}>
        下一页
      </button>
    </nav>
  );
}
