import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ItineraryDisplay from "@/components/ItineraryDisplay";
import { TripData, ItineraryItem } from "@/types";

const DisplayPage = () => {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const loadingFlag = searchParams.get("loading");

    const checkData = async () => {
      if (loadingFlag === "true") {
        // Poll every 500ms to check if data is ready
        const interval = setInterval(() => {
          const loading = localStorage.getItem("loading");
          if (loading === "false") {
            const data = localStorage.getItem("tripData");
            const items = localStorage.getItem("itinerary");
            if (data && items) {
              setTripData(JSON.parse(data));
              setItinerary(JSON.parse(items));
              setStatus("ready");
            }
            clearInterval(interval);
          } else if (loading === "error") {
            setStatus("error");
            clearInterval(interval);
          }
        }, 500);
      }
    };

    checkData();
  }, [searchParams]);

  const reset = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const updateItinerary = (newItinerary: ItineraryItem[]) => {
    setItinerary(newItinerary);
    localStorage.setItem("itinerary", JSON.stringify(newItinerary));
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Generating Your Itinerary</h3>
          <p className="text-gray-600 dark:text-gray-400">This may take a few moments...</p>
        </div>
      </div>
    );
  }


  if (status === "error") {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 text-xl font-semibold">
        Failed to generate itinerary. Please try again.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-7xl mx-auto">
            <ItineraryDisplay
                tripData={tripData!}
                itinerary={itinerary}
                isGenerating={false}
                onReset={reset}
                onUpdateItinerary={updateItinerary}
            />
        </div>
     </div>
  );
};

export default DisplayPage;
