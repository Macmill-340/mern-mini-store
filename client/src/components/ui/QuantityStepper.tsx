interface Props {
  value: number;
  max: number;
  onChange: (n: number) => void;
}

export function QuantityStepper({ value, max, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-300">
      <button type="button" aria-label="Decrease quantity" className="px-3 py-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40" disabled={value <= 1} onClick={() => onChange(value - 1)}>-</button>
      <span className="min-w-[2.5rem] text-center text-sm">{value}</span>
      <button type="button" aria-label="Increase quantity" className="px-3 py-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
