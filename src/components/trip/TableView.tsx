import { Fragment, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDayDate, formatMoney, groupByDay, itemTypeMeta } from "@/lib/itinerary";
import { useTripContext } from "./TripContext";

const TableView = () => {
  const { trip, actions } = useTripContext();
  const { tripData } = trip;
  const days = useMemo(
    () => groupByDay(trip.itinerary, tripData.days),
    [trip.itinerary, tripData.days],
  );

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Time</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            {actions && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {days.map((items, index) => (
            <Fragment key={index}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={6} className="py-3 font-semibold">
                  Day {index + 1} · {formatDayDate(tripData, index + 1)}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {items.length} activities
                  </span>
                </TableCell>
              </TableRow>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-5 text-center text-sm italic text-muted-foreground">
                    No activities planned for this day
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => {
                const meta = itemTypeMeta(item.type);
                const Icon = meta.icon;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.time}</TableCell>
                    <TableCell>
                      {item.activity}
                      <span className="block text-xs text-muted-foreground md:hidden">{item.location}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{item.location}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {item.estimatedCost > 0 ? formatMoney(tripData.currency, item.estimatedCost) : "Free"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={cn("gap-1", meta.badge)}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    {actions && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => actions.removeItem(item.id)}
                          aria-label={`Delete ${item.activity}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableView;
