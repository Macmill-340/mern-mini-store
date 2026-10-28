import { Search } from 'lucide-react';
import { CATEGORIES, SORT_OPTIONS } from '../../utils/constants';

interface Props {
  keyword: string;
  category: string;
  sort: string;
  onKeyword: (v: string) => void;
  onCategory: (v: string) => void;
  onSort: (v: string) => void;
}

export function ProductFilters({ keyword, category, sort, onKeyword, onCategory, onSort }: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={keyword}
          onChange={(e) => onKeyword(e.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
          className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="flex gap-2">
        <select value={category} onChange={(e) => onCategory(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => onSort(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}
