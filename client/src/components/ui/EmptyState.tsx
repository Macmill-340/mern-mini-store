import type { ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
      {icon}
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      {description && <p className="max-w-md text-sm text-zinc-500">{description}</p>}
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
