import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import TripWorkspace from "@/components/trip/TripWorkspace";
import { fetchSharedTrip } from "@/api/shareApi";
import { newId, useTripStore } from "@/store/tripStore";
import { defaultPackingList, defaultTodoList } from "@/data/checklists";
import type { Trip } from "@/types/trip";

const SharedTrip = () => {
  const { shareId = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shared-trip", shareId],
    queryFn: () => fetchSharedTrip(shareId),
    retry: false,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="grid place-items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-semibold mb-2">This link doesn't work</h1>
          <p className="text-muted-foreground mb-6">The shared trip may have been removed.</p>
          <Button asChild>
            <Link to="/">Plan your own trip</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const trip: Trip = {
    id: `shared-${shareId}`,
    tripData: data.tripData,
    itinerary: data.itinerary,
    createdBy: data.createdBy,
    createdAt: "",
    updatedAt: "",
    packingList: data.packingList ?? defaultPackingList(data.tripData),
    todoList: data.todoList ?? defaultTodoList(data.tripData),
  };

  const copyToMyTrips = () => {
    const id = useTripStore.getState().createTrip(
      data.tripData,
      data.itinerary.map((item) => ({ ...item, id: newId() })),
      { createdBy: data.createdBy, packingList: trip.packingList, todoList: trip.todoList },
    );
    toast.success("Copied to your trips. It's yours to edit now.");
    navigate(`/trip/${id}`);
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-primary/10 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            <span className="font-semibold">
              {data.createdBy ? `${data.createdBy} shared this trip with you.` : "A trip shared with you."}
            </span>{" "}
            You're viewing a read-only copy.
          </p>
          <Button size="sm" onClick={copyToMyTrips}>
            <Copy className="h-4 w-4 mr-2" /> Copy to my trips
          </Button>
        </div>
        <TripWorkspace trip={trip} />
      </div>
    </AppShell>
  );
};

export default SharedTrip;
