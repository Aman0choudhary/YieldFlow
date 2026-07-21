import { useAnimatedNumber, useFlashOnChange, usePrefersReducedMotion } from "../../animation-utils";
import { formatMoney } from "../../utils";
import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: number | null;
  display?: string;
  hint?: string;
  accent?: boolean;
  suffix?: string;
  digits?: number;
  badge?: ReactNode;
};

export function MetricCard({
  label,
  value,
  display,
  hint,
  accent,
  suffix,
  digits = 0,
  badge,
}: MetricCardProps) {
  const reduced = usePrefersReducedMotion();
  const animated = useAnimatedNumber(value ?? 0, reduced ? 0 : 700);
  const flash = useFlashOnChange(value ?? 0);
  const shown =
    display ??
    (value == null
      ? "--"
      : digits > 0
        ? formatMoney(animated, digits)
        : Math.round(animated).toLocaleString("en-US"));

  return (
    <article className={`metric-card${accent ? " accent" : ""}${flash ? " value-pulse" : ""}`}>
      <div className="metric-top">
        <span>{label}</span>
        {badge}
      </div>
      <strong>
        {shown}
        {suffix ? <small className="metric-suffix">{suffix}</small> : null}
      </strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}
