import { useState } from "react";
import { CalendarClock, ClipboardList, Columns3, Map as MapIcon, Table2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Trip } from "@/types/trip";
import type { TripActions } from "@/hooks/useTripActions";
import { TripProvider } from "./TripContext";
import TripHero from "./TripHero";
import BudgetOverview from "./BudgetOverview";
import PlanView from "./PlanView";
import BoardView from "./BoardView";
import TimelineView from "./TimelineView";
import TableView from "./TableView";
import ChecklistPanel from "./ChecklistPanel";
import AiAssistant from "./AiAssistant";

const VIEWS = [
  { value: "plan", label: "Map", icon: MapIcon },
  { value: "board", label: "Board", icon: Columns3 },
  { value: "timeline", label: "Timeline", icon: CalendarClock },
  { value: "table", label: "Table", icon: Table2 },
  { value: "checklist", label: "Checklist", icon: ClipboardList },
];

const VIEW_KEY = "tripplanner-view";

const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) ?? "plan";
  } catch {
    return "plan";
  }
};

/** The full trip page body. Pass no `actions` for a read-only view. */
const TripWorkspace = ({ trip, actions }: { trip: Trip; actions?: TripActions }) => {
  const [view, setView] = useState(readView);

  const changeView = (next: string) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Preference only.
    }
  };

  return (
    <TripProvider trip={trip} actions={actions}>
      <div className="space-y-6">
        <TripHero />
        <BudgetOverview />
        <Tabs value={view} onValueChange={changeView}>
          <TabsList className="h-auto w-full justify-start overflow-x-auto no-scrollbar sm:w-auto">
            {VIEWS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5 px-3 py-1.5">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="plan" className="mt-5">
            <PlanView />
          </TabsContent>
          <TabsContent value="board" className="mt-5">
            <BoardView />
          </TabsContent>
          <TabsContent value="timeline" className="mt-5">
            <TimelineView />
          </TabsContent>
          <TabsContent value="table" className="mt-5">
            <TableView />
          </TabsContent>
          <TabsContent value="checklist" className="mt-5">
            <ChecklistPanel />
          </TabsContent>
        </Tabs>
      </div>
      <AiAssistant />
    </TripProvider>
  );
};

export default TripWorkspace;
