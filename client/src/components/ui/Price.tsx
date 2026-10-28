import { formatINR } from '../../utils/format';

export function Price({ value, className }: { value: number; className?: string }) {
  return <span className={className}>{formatINR(value)}</span>;
}
