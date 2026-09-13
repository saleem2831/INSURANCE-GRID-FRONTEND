export function Badge({ value }: { value?: string }) {
  const v = value || "-";
  const tone =
    ["MATCHED","IMPORTED","ACTIVE","VALIDATED","Yes"].includes(v) ? "success" :
    ["DECLINE","NO_BUSINESS","FAILED","Missing"].includes(v) ? "danger" :
    ["REPLACE","MANUAL_REVIEW","COUNCIL_CALL","NEEDS_INPUT","More input required","REVIEW_REQUIRED","VALIDATING"].includes(v) ? "warning" : "neutral";
  return <span className={`badge ${tone}`}>{v}</span>;
}
