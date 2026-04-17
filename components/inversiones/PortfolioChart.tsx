"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { TickerSummary } from "@/lib/data/portfolio";
import { fmtEUR as fmt } from "@/lib/utils/format";

// Muted professional palette — distinguishable but not garish
const COLORS = [
  "#3B5BDB", "#0CA678", "#F08C00", "#7048E8",
  "#1098AD", "#C2255C", "#5C940D", "#E67700",
  "#2B8A3E", "#1971C2", "#6741D9", "#D9480F",
];

interface Props {
  tickers: TickerSummary[];
  total: number;
}

const RADIAN = Math.PI / 180;

function InnerLabel({
  cx, cy, midAngle, innerRadius, outerRadius, name, pct,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number;
  name: string; pct: string;
}) {
  if (parseFloat(pct) < 6) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
      style={{ pointerEvents: "none" }} fill="white">
      <tspan x={x} dy="-0.4em" fontSize={11} fontWeight={700}>{name}</tspan>
      <tspan x={x} dy="1.4em" fontSize={10} fontWeight={400}>{pct}%</tspan>
    </text>
  );
}

export default function PortfolioChart({ tickers, total }: Props) {
  const data = tickers.map((t) => ({
    ticker: t.ticker,
    value: t.valorActual,
    pct: total > 0 ? ((t.valorActual / total) * 100).toFixed(1) : "0.0",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={36}
          outerRadius={128}
          paddingAngle={2}
          dataKey="value"
          nameKey="ticker"
          labelLine={false}
          label={(props) => (
            <InnerLabel
              cx={props.cx ?? 0}
              cy={props.cy ?? 0}
              midAngle={props.midAngle ?? 0}
              innerRadius={props.innerRadius ?? 0}
              outerRadius={props.outerRadius ?? 0}
              name={String(props.name ?? "")}
              pct={data[props.index]?.pct ?? "0"}
            />
          )}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const num = typeof value === "number" ? value : 0;
            const item = data.find((d) => d.ticker === String(name));
            return [`${fmt(num)} · ${item?.pct}%`, String(name)];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
