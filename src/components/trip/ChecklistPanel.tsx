import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardCheck, Luggage, Plus, X } from "lucide-react";
import confetti from "canvas-confetti";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/types/trip";
import { newId, useTripStore } from "@/store/tripStore";
import { useTripContext } from "./TripContext";

const Checklist = ({
  title,
  icon: Icon,
  list,
  items,
  placeholder,
}: {
  title: string;
  icon: typeof Luggage;
  list: "packingList" | "todoList";
  items: ChecklistItem[];
  placeholder: string;
}) => {
  const { trip, actions } = useTripContext();
  const [draft, setDraft] = useState("");
  const readOnly = !actions;
  const done = items.filter((i) => i.done).length;

  const save = (next: ChecklistItem[]) => {
    useTripStore.getState().setChecklist(trip.id, list, next);
    const nowDone = next.filter((i) => i.done).length;
    if (next.length > 0 && nowDone === next.length && done < next.length) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    }
  };

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    save([...items, { id: newId(), text, done: false }]);
    setDraft("");
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {done}/{items.length}
        </span>
      </div>
      <Progress value={items.length ? (done / items.length) * 100 : 0} className="mb-4 h-2" />
      <ul className="space-y-1">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60"
            >
              <Checkbox
                id={item.id}
                checked={item.done}
                disabled={readOnly}
                onCheckedChange={(checked) =>
                  save(items.map((i) => (i.id === item.id ? { ...i, done: !!checked } : i)))
                }
              />
              <label
                htmlFor={item.id}
                className={cn(
                  "flex-1 cursor-pointer text-sm transition-colors",
                  item.done && "text-muted-foreground line-through",
                )}
              >
                {item.text}
              </label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => save(items.filter((i) => i.id !== item.id))}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${item.text}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {!readOnly && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
          <Button type="submit" size="icon" variant="outline" aria-label="Add item" disabled={!draft.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
};

const ChecklistPanel = () => {
  const { trip } = useTripContext();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Checklist
        title="Before you go"
        icon={ClipboardCheck}
        list="todoList"
        items={trip.todoList ?? []}
        placeholder="Add a to-do…"
      />
      <Checklist
        title="Packing list"
        icon={Luggage}
        list="packingList"
        items={trip.packingList ?? []}
        placeholder="Add something to pack…"
      />
    </div>
  );
};

export default ChecklistPanel;
