import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TripForm from "./TripForm";
import ItineraryDisplay from "./ItineraryDisplay";
import { fetchItineraryFromGroq } from "./../api/groqApi";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface TripData {
  fromDestination: string;
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
  const { toast } = useToast();

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

  const createCustomItinerary = (data: TripData) => {
    setTripData(data);
    setItinerary([]);
    toast({
      title: "Custom Itinerary Created",
      description: "Start building your trip by adding activities to each day",
    });
  };

  const updateItinerary = (newItinerary: ItineraryItem[]) => {
    setItinerary(newItinerary);
  };

  const updateTripData = (newTripData: TripData) => {
    setTripData(newTripData);
  };

  const resetPlanner = () => {
    setTripData(null);
    setItinerary([]);
  };

  const loadItinerary = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);

            // Validate the data structure
            if (!data.tripData || !data.itinerary) {
              throw new Error("Invalid itinerary file format");
            }

            // Convert date strings back to Date objects
            const loadedTripData = {
              ...data.tripData,
              startDate: new Date(data.tripData.startDate),
              endDate: new Date(data.tripData.endDate),
            };

            // Update the state
            setTripData(loadedTripData);
            setItinerary(data.itinerary);

            toast({
              title: "Itinerary Loaded",
              description: "Your saved itinerary has been loaded successfully",
            });
          } catch (error) {
            toast({
              title: "Error Loading File",
              description:
                "The file could not be loaded. Please make sure it's a valid itinerary file.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {!tripData ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plan Your Trip</CardTitle>
              <Button onClick={loadItinerary} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Load Saved Itinerary
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TripForm
              onSubmit={generateItinerary}
              onCustomCreate={createCustomItinerary}
            />
          </CardContent>
        </Card>
      ) : (
        <ItineraryDisplay
          tripData={tripData}
          itinerary={itinerary}
          isGenerating={isGenerating}
          onReset={resetPlanner}
          onUpdateItinerary={updateItinerary}
          onUpdateTripData={updateTripData}
        />
      )}
    </div>
  );
};

export default ItineraryPlanner;
