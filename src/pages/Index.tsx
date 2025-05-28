
import ItineraryPlanner from "@/components/ItineraryPlanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Travel Itinerary Planner</h1>
          <p className="text-gray-600 dark:text-gray-300">Plan your perfect trip with personalized recommendations</p>
        </header>
        <ItineraryPlanner />
      </div>
    </div>
  );
};

export default Index;
