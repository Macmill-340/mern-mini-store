interface Props {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}

export function Pagination({ page, pages, onChange }: Props) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
      <span className="text-sm text-zinc-600">Page {page} of {pages}</span>
      <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
