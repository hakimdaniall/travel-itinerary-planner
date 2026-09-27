import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Pencil, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ITEM_TYPES, formatMoney } from "@/lib/itinerary";
import type { ItemType } from "@/types/trip";
import { useTripContext } from "./TripContext";

const BudgetOverview = () => {
  const { trip, actions } = useTripContext();
  const { tripData, itinerary } = trip;
  const [draft, setDraft] = useState(String(tripData.budget));
  const [editOpen, setEditOpen] = useState(false);

  const total = itinerary.reduce((sum, i) => sum + i.estimatedCost, 0);
  const remaining = tripData.budget - total;
  const over = remaining < 0;
  const pct = tripData.budget > 0 ? Math.min(100, (total / tripData.budget) * 100) : 0;

  // Fixed category order so colours never shift when a category is empty.
  const slices = useMemo(
    () =>
      (Object.keys(ITEM_TYPES) as ItemType[])
        .map((type) => ({
          type,
          label: ITEM_TYPES[type].label,
          color: ITEM_TYPES[type].color,
          value: itinerary.filter((i) => i.type === type).reduce((s, i) => s + i.estimatedCost, 0),
        }))
        .filter((s) => s.value > 0),
    [itinerary],
  );

  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" /> Estimated spend
            </p>
            <p className="font-display text-3xl font-semibold">
              {formatMoney(tripData.currency, total)}
            </p>
            <p className="text-sm text-muted-foreground">
              of {formatMoney(tripData.currency, tripData.budget)} budget ·{" "}
              {formatMoney(tripData.currency, total / Math.max(1, tripData.days))} / day
            </p>
          </div>
          {actions && (
            <Popover
              open={editOpen}
              onOpenChange={(open) => {
                setEditOpen(open);
                if (open) setDraft(String(tripData.budget));
              }}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit budget">
                  <Pencil className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = Number(draft);
                    if (value > 0) {
                      actions.setBudget(value);
                      setEditOpen(false);
                    }
                  }}
                >
                  <label className="text-sm font-medium" htmlFor="budget-edit">
                    Total budget ({tripData.currency})
                  </label>
                  <Input
                    id="budget-edit"
                    type="number"
                    min={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="w-full" disabled={!(Number(draft) > 0)}>
                    Save budget
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Budget used"
          >
            <motion.div
              className={over ? "h-full rounded-full bg-rose-600" : "h-full rounded-full bg-primary"}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm">
            {over ? (
              <>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="font-medium">Over budget</span>
                <span className="text-muted-foreground">
                  by {formatMoney(tripData.currency, -remaining)}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium">{formatMoney(tripData.currency, remaining)}</span>
                <span className="text-muted-foreground">left to spend</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {slices.length > 0 ? (
          <>
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="62%"
                    outerRadius="100%"
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                    isAnimationActive
                  >
                    {slices.map((s) => (
                      <Cell key={s.type} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${formatMoney(tripData.currency, value)} (${Math.round((value / total) * 100)}%)`,
                      name,
                    ]}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="min-w-0 flex-1 space-y-1 text-sm">
              {slices.map((s) => (
                <li key={s.type} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="ml-auto font-medium tabular-nums">
                    {formatMoney(tripData.currency, s.value)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add costs to your activities to see where your money goes.
          </p>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;
