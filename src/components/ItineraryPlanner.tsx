
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TripForm from "./TripForm";
import ItineraryDisplay from "./ItineraryDisplay";
import { fetchItineraryFromGroq } from "./../api/groqApi";
export interface TripData {
  destinations: string[];
  startDate: Date;
  endDate: Date;
  days: number;
  includeFlights: boolean;
  budget: number;
  currency: string;
}

export interface ItineraryItem {
  id: string;
  day: number;
  time: string;
  activity: string;
  location: string;
  estimatedCost: number;
  type: "flight" | "accommodation" | "activity" | "meal" | "transport";
}

const ItineraryPlanner = () => {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateItinerary = async (data: TripData) => {
    setIsGenerating(true);
    setTripData(data);
    
    try {
      const result = await fetchItineraryFromGroq(data);
      setItinerary(result);
    } catch (err) {
      console.error("Error generating itinerary:", err);
      alert("Failed to generate itinerary. Please try again.");
      setItinerary([]);
      setTripData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateItinerary = (newItinerary: ItineraryItem[]) => {
    setItinerary(newItinerary);
  };

  const resetPlanner = () => {
    setTripData(null);
    setItinerary([]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {!tripData ? (
        <Card>
          <CardHeader>
            <CardTitle>Plan Your Trip</CardTitle>
          </CardHeader>
          <CardContent>
            <TripForm onSubmit={generateItinerary} />
          </CardContent>
        </Card>
      ) : (
        <ItineraryDisplay 
          tripData={tripData}
          itinerary={itinerary}
          isGenerating={isGenerating}
          onReset={resetPlanner}
          onUpdateItinerary={updateItinerary}
        />
      )}
    </div>
  );
};

export default ItineraryPlanner;
