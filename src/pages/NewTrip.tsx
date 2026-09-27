import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import TripWizard from "@/components/wizard/TripWizard";
import { useTripStore } from "@/store/tripStore";
import type { TripData } from "@/types/trip";

const NewTrip = () => {
  const navigate = useNavigate();
  const createTrip = useTripStore((s) => s.createTrip);

  const start = (tripData: TripData, generate: boolean) => {
    const id = createTrip(tripData);
    navigate(`/trip/${id}${generate ? "?generate=1" : ""}`, { replace: true });
  };

  return (
    <AppShell showNewTrip={false}>
      <div className="container mx-auto px-4 py-10 sm:py-16">
        <TripWizard
          onGenerate={(data) => start(data, true)}
          onCustom={(data) => start(data, false)}
        />
      </div>
    </AppShell>
  );
};

export default NewTrip;
