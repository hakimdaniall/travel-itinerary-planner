import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { chatEdit, type ChatTurn } from "@/api/groqApi";
import { useTripStore } from "@/store/tripStore";
import { useTripContext } from "./TripContext";

const SUGGESTIONS = [
  "Add a rooftop bar on the last night",
  "Make day 2 more relaxed",
  "Swap one dinner for a famous street-food spot",
  "What's the best way to get around?",
  "Find ways to cut costs",
];

const AiAssistant = () => {
  const { trip, actions } = useTripContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content: `Hi! I can tweak your ${trip.tripData.destinations[0]} trip. Ask me to add, move or replace things, or ask anything about the destination.`,
    },
  ]);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  if (!actions) return null;

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    const history = messages.slice(1);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const latest = useTripStore.getState().trips[trip.id];
      const result = await chatEdit(latest.tripData, latest.itinerary, message, history);
      if (result.changed > 0) {
        actions.replaceWithUndo(
          result.itinerary,
          `AI made ${result.changed} change${result.changed > 1 ? "s" : ""}`,
        );
      }
      setMessages((m) => [...m, { role: "assistant", content: result.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-5 right-5 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      >
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className="rounded-full shadow-xl h-12 px-5"
        >
          <Sparkles className="h-5 w-5 mr-2" /> Ask AI
        </Button>
      </motion.div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 text-left">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Trip assistant
            </SheetTitle>
            <SheetDescription>Changes apply instantly. Every change can be undone.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted",
                  )}
                >
                  {m.content}
                </motion.div>
              ))}
            </AnimatePresence>
            {busy && (
              <div className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
            {messages.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottom} />
          </div>

          <form
            className="flex items-end gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="e.g. Add a cooking class on day 3"
              className="max-h-32 min-h-[44px] resize-none"
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!input.trim() || busy} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AiAssistant;
