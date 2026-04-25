import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface MatchSlice {
  name: string;
  value: number;
  color: string;
}

export function MatchPie({ data }: { data: MatchSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="h-full min-h-[120px] grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
      <div className="h-full min-h-[110px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="var(--surface)"
              strokeWidth={2}
            >
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 11,
                padding: "4px 8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-xl font-display font-bold leading-none">{total}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Candidates</div>
        </div>
      </div>
      <div className="flex flex-wrap sm:flex-col gap-x-3 gap-y-2 sm:pr-2 justify-center">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.name} className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold leading-tight">{d.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{d.value} · {pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
