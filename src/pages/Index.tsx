import ItineraryPlanner from "@/components/ItineraryPlanner";
import { Sparkles, ExternalLink, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8 text-center">
          {/* <div className="flex justify-end mb-4">
            <Link to="/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </div> */}
          <h1 className="text-5xl font-light tracking-tight text-slate-900 dark:text-slate-50 mb-3">
            Travel Itinerary Planner
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Plan your perfect trip with personalized recommendations
          </p>
        </header>
        <ItineraryPlanner />
      </div>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Sparkles className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="text-sm">
                Crafted with passion for travelers worldwide
              </span>
            </div>

            <a
              href="https://illuminext.my"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-200"
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
