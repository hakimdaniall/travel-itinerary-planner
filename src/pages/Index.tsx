import ItineraryPlanner from "@/components/ItineraryPlanner";
import { Sparkles, ExternalLink } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Travel Itinerary Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Plan your perfect trip with personalized recommendations
          </p>
        </header>
        <ItineraryPlanner />
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
              <span className="text-sm">
                Crafted with passion for travelers worldwide
              </span>
            </div>

            <a
              href="https://illuminext.my"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="text-sm">Built by</span>
              <span className="font-bold">Illuminext Solutions</span>
              <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Illuminext Solutions. Making travel
            planning effortless.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
