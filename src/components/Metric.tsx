export function Metric({ label, value }: { label: string; value: unknown }) {
  return <div className="metric"><span>{label}</span><b title={String(value ?? "-")}>{String(value ?? "-")}</b></div>;
}