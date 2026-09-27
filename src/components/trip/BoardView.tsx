import { useMemo, useRef } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { ChevronLeft, ChevronRight, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCityCoords, useTripWeather } from "@/hooks/useTripMedia";
import { destinationForDay, formatDayDate, formatMoney, groupByDay } from "@/lib/itinerary";
import AddEditActivityDialog from "@/components/AddEditActivityDialog";
import ActivityCard from "./ActivityCard";
import { DayMenu, WeatherBadge } from "./DayTools";
import { dayColor } from "./TripMap";
import { useTripContext } from "./TripContext";

const AddToDay = ({ day }: { day: number }) => {
  const { trip, actions } = useTripContext();
  const { data: near } = useCityCoords(destinationForDay(trip.tripData, day));
  if (!actions) return null;
  return (
    <AddEditActivityDialog
      day={day}
      currency={trip.tripData.currency}
      onSave={actions.upsertItem}
      near={near ?? undefined}
      trigger={
        <Button variant="ghost" size="sm" className="w-full border border-dashed text-muted-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add activity
        </Button>
      }
    />
  );
};

const BoardView = () => {
  const { trip, actions } = useTripContext();
  const { tripData } = trip;
  const isMobile = useIsMobile();
  const weather = useTripWeather(tripData);
  const scroller = useRef<HTMLDivElement | null>(null);
  const columns = useMemo(
    () => groupByDay(trip.itinerary, tripData.days),
    [trip.itinerary, tripData.days],
  );

  const onDragEnd = ({ destination, source, draggableId, type }: DropResult) => {
    if (!actions || !destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (type === "COLUMN") {
      const order = Array.from({ length: tripData.days }, (_, i) => i + 1);
      const [moved] = order.splice(source.index, 1);
      order.splice(destination.index, 0, moved);
      actions.reorderDays(order);
      return;
    }
    const toDay = Number(destination.droppableId);
    if (toDay !== Number(source.droppableId)) actions.moveItemToDay(draggableId, toDay);
  };

  const scrollBy = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <div>
      {!isMobile && tripData.days > 3 && (
        <div className="mb-3 flex justify-end gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollBy(-340)} aria-label="Scroll left">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollBy(340)} aria-label="Scroll right">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction={isMobile ? "vertical" : "horizontal"} type="COLUMN">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={(el) => {
                provided.innerRef(el);
                scroller.current = el;
              }}
              className={isMobile ? "space-y-4" : "flex gap-4 overflow-x-auto pb-4"}
            >
              {columns.map((items, index) => {
                const day = index + 1;
                const cost = items.reduce((s, i) => s + i.estimatedCost, 0);
                return (
                  <Draggable
                    key={day}
                    draggableId={`day-${day}`}
                    index={index}
                    isDragDisabled={!actions}
                  >
                    {(colProvided, colSnapshot) => (
                      <div
                        ref={colProvided.innerRef}
                        {...colProvided.draggableProps}
                        className={cn(
                          "flex shrink-0 flex-col rounded-2xl border bg-muted/40",
                          isMobile ? "w-full" : "w-[320px] min-h-[480px]",
                          colSnapshot.isDragging && "rotate-1 shadow-xl",
                        )}
                      >
                        <div
                          {...colProvided.dragHandleProps}
                          className="flex items-center gap-2 border-b p-3 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span
                            className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white"
                            style={{ background: dayColor(day) }}
                          >
                            {day}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold leading-tight">{formatDayDate(tripData, day)}</p>
                            <p className="text-xs text-muted-foreground">
                              {items.length} stops{cost > 0 && ` · ${formatMoney(tripData.currency, cost)}`}
                            </p>
                          </div>
                          <WeatherBadge weather={weather[index]} />
                          <DayMenu day={day} />
                        </div>
                        <Droppable droppableId={String(day)}>
                          {(dropProvided, dropSnapshot) => (
                            <div
                              ref={dropProvided.innerRef}
                              {...dropProvided.droppableProps}
                              className={cn(
                                "flex-1 space-y-2 p-3 transition-colors",
                                dropSnapshot.isDraggingOver && "bg-primary/5",
                              )}
                            >
                              {items.map((item, i) => (
                                <Draggable
                                  key={item.id}
                                  draggableId={item.id}
                                  index={i}
                                  isDragDisabled={!actions}
                                >
                                  {(itemProvided, itemSnapshot) => (
                                    <div
                                      ref={itemProvided.innerRef}
                                      {...itemProvided.draggableProps}
                                      {...itemProvided.dragHandleProps}
                                      className={cn(itemSnapshot.isDragging && "rotate-2")}
                                    >
                                      <ActivityCard item={item} compact />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {dropProvided.placeholder}
                              <AddToDay day={day} />
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {actions && !isMobile && (
                <button
                  type="button"
                  onClick={actions.addDay}
                  className="flex w-[200px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Plus className="h-6 w-6" /> Add day
                </button>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default BoardView;
