import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TripForm from "./TripForm";
import { fetchItineraryFromGroq } from "@/api/groqApi";
import { v4 as uuidv4 } from "uuid";
import { TripData, ItineraryItem } from "@/types";

const ItineraryPlanner = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const generateItinerary = async (data: TripData) => {
    setIsGenerating(true);
    navigate("/itinerary?loading=true");

    try {
      const result = await fetchItineraryFromGroq(data);
      const withUUIDs = result.map((item) => ({ ...item, tempId: uuidv4() }));

      localStorage.setItem("tripData", JSON.stringify(data));
      localStorage.setItem("itinerary", JSON.stringify(withUUIDs));
      localStorage.setItem("loading", "false");
    } catch (error) {
      console.error("Error:", error);
      localStorage.setItem("loading", "error");
    }
  };


  return (
    <div className="w-full max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Plan Your Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <TripForm onSubmit={generateItinerary} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ItineraryPlanner;
