import { Link } from "react-router-dom";
import { Compass, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";

const AppShell = ({
  children,
  showNewTrip = true,
}: {
  children: React.ReactNode;
  showNewTrip?: boolean;
}) => (
  <div className="min-h-screen flex flex-col bg-background">
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
            <Compass className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Travel Itinerary Planner</span>
          <span className="sm:hidden">Trip Planner</span>
        </Link>
        <div className="flex items-center gap-2">
          {showNewTrip && (
            <Button asChild size="sm">
              <Link to="/new">
                <Plus className="h-4 w-4 mr-1" />
                New trip
              </Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main className="flex-1">{children}</main>

    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Illuminext Solutions. Making travel
          planning effortless.
        </span>
        <a
          href="https://illuminext.my"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Built by <span className="font-semibold">Illuminext Solutions</span>
          <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </footer>
  </div>
);

export default AppShell;
