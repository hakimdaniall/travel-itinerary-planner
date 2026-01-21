import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  DollarSign,
  Download,
  Trash2,
  Plane,
  Bed,
  Utensils,
  Car,
  MapPin,
  Save,
  Upload,
  Plus,
  GripVertical,
  X,
  Edit2,
  Edit,
  ArrowRightLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useRef, useMemo, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { TripData, ItineraryItem } from "./ItineraryPlanner";
import ItineraryItemCard from "./ItineraryItemCard";
import AddEditActivityDialog from "./AddEditActivityDialog";
import ThemeToggle from "./ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ItineraryDisplayProps {
  tripData: TripData;
  itinerary: ItineraryItem[];
  isGenerating: boolean;
  onReset: () => void;
  onUpdateItinerary: (newItinerary: ItineraryItem[]) => void;
  onUpdateTripData: (newTripData: TripData) => void;
  initialCreatorName?: string | null;
}

const ItineraryDisplay = ({
  tripData,
  itinerary,
  isGenerating,
  onReset,
  onUpdateItinerary,
  onUpdateTripData,
  initialCreatorName,
}: ItineraryDisplayProps) => {
  const isMobile = useIsMobile();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [loadedCreatorName, setLoadedCreatorName] = useState<string | null>(
    initialCreatorName || null,
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetValue, setBudgetValue] = useState(tripData.budget.toString());
  const [deleteDayNumber, setDeleteDayNumber] = useState<number | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");

  const handleBudgetEdit = useCallback(() => {
    setShowBudgetDialog(true);
    setBudgetValue(tripData.budget.toString());
  }, [tripData.budget]);

  const handleBudgetSave = useCallback(() => {
    const newBudget = Number(budgetValue);
    if (newBudget > 0) {
      onUpdateTripData({ ...tripData, budget: newBudget });
      setShowBudgetDialog(false);
      toast.success(`Budget set to ${tripData.currency} ${newBudget}`);
    } else {
      toast.error("Budget must be greater than 0");
    }
  }, [budgetValue, tripData, onUpdateTripData]);

  const handleBudgetCancel = useCallback(() => {
    setShowBudgetDialog(false);
    setBudgetValue(tripData.budget.toString());
  }, [tripData.budget]);

  const addOrUpdateActivity = useCallback(
    (item: ItineraryItem) => {
      const existingIndex = itinerary.findIndex((i) => i.id === item.id);

      if (existingIndex >= 0) {
        // Update existing item
        const newItinerary = [...itinerary];
        newItinerary[existingIndex] = item;
        onUpdateItinerary(newItinerary);
        toast.success(`"${item.activity}" has been updated`);
      } else {
        // Add new item
        const newItinerary = [...itinerary, item];
        onUpdateItinerary(newItinerary);
        toast.success(`"${item.activity}" has been added to Day ${item.day}`);
      }
    },
    [itinerary, onUpdateItinerary, toast],
  );

  const removeActivity = useCallback(
    (itemId: string) => {
      const item = itinerary.find((i) => i.id === itemId);
      const newItinerary = itinerary.filter((i) => i.id !== itemId);
      onUpdateItinerary(newItinerary);
      toast.success(
        item ? `"${item.activity}" has been removed` : "Activity removed",
      );
    },
    [itinerary, onUpdateItinerary],
  );

  const moveItemToDay = useCallback(
    (itemId: string, newDay: number) => {
      const item = itinerary.find((i) => i.id === itemId);
      if (!item) return;

      const updatedItem = { ...item, day: newDay };
      const newItinerary = itinerary.map((i) =>
        i.id === itemId ? updatedItem : i,
      );

      onUpdateItinerary(newItinerary);
      toast.success(`"${item.activity}" moved to Day ${newDay}`);
    },
    [itinerary, onUpdateItinerary, toast],
  );

  const moveDayToPosition = (fromDay: number, toPosition: number) => {
    if (fromDay === toPosition) return;

    const newDayOrder = Array.from({ length: tripData.days }, (_, i) => i + 1);

    const fromIndex = fromDay - 1;
    const toIndex = toPosition - 1;

    const [removed] = newDayOrder.splice(fromIndex, 1);
    newDayOrder.splice(toIndex, 0, removed);

    reorderDays(newDayOrder);
  };

  const clearAllActivities = () => {
    setShowClearAllDialog(true);
  };

  const confirmClearAll = () => {
    onUpdateItinerary([]);
    toast.success("All activities have been removed from your itinerary");
    setShowClearAllDialog(false);
  };

  const addDay = () => {
    const newTripData = {
      ...tripData,
      days: tripData.days + 1,
    };
    onUpdateTripData(newTripData);
    toast.success(`Day ${tripData.days + 1} has been added to your itinerary`);

    // Scroll to the rightmost position after a short delay to allow render
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollWidth,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const deleteDay = (dayNumber: number) => {
    setDeleteDayNumber(dayNumber);
  };

  const confirmDeleteDay = () => {
    if (deleteDayNumber === null) return;

    // Remove all activities for this day
    const newItinerary = itinerary.filter(
      (item) => item.day !== deleteDayNumber,
    );

    // Renumber remaining days
    const renumberedItinerary = newItinerary.map((item) => ({
      ...item,
      day: item.day > deleteDayNumber ? item.day - 1 : item.day,
    }));

    // Update trip data
    const newTripData = {
      ...tripData,
      days: tripData.days - 1,
    };

    onUpdateItinerary(renumberedItinerary);
    onUpdateTripData(newTripData);

    toast.success(
      `Day ${deleteDayNumber} has been removed from your itinerary`,
    );

    setDeleteDayNumber(null);
  };

  const downloadPDF = () => {
    const defaultName = `${format(new Date(), "yyyyMMdd")}-itinerary-${tripData.destinations[0].replace(/\s+/g, "-").toLowerCase()}`;
    setPdfFileName(defaultName);
    setShowPdfDialog(true);
  };

  const confirmDownloadPDF = () => {
    if (!pdfFileName.trim()) {
      toast.error("Please enter a filename for your PDF");
      return;
    }

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Travel Itinerary", 14, 20);

    // Add trip details
    doc.setFontSize(11);
    const destinationText = tripData.fromDestination
      ? `Route: ${tripData.fromDestination} > ${tripData.destinations.join(" > ")}`
      : `Destinations: ${tripData.destinations.join(", ")}`;
    doc.text(destinationText, 14, 30);
    doc.text(
      `Duration: ${tripData.days} days (${format(tripData.startDate, "MMM dd")} - ${format(tripData.endDate, "MMM dd, yyyy")})`,
      14,
      36,
    );
    doc.text(`Budget: ${tripData.currency} ${tripData.budget}`, 14, 42);
    doc.text(`Total Cost: ${tripData.currency} ${totalCost}`, 14, 48);
    doc.text(`Remaining: ${tripData.currency} ${remainingBudget}`, 14, 54);

    // Prepare table data
    const tableData: any[] = [];

    dayColumns.forEach((dayColumn) => {
      // Add day header
      tableData.push([
        {
          content: `Day ${dayColumn.day}`,
          colSpan: 5,
          styles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
        },
      ]);

      // Add activities for this day
      if (dayColumn.items.length === 0) {
        tableData.push(["", "No activities planned", "", "", ""]);
      } else {
        dayColumn.items
          .sort((a, b) => a.time.localeCompare(b.time))
          .forEach((item) => {
            tableData.push([
              item.time,
              item.activity,
              item.location,
              item.estimatedCost > 0
                ? `${tripData.currency} ${item.estimatedCost}`
                : "Free",
              item.type.charAt(0).toUpperCase() + item.type.slice(1),
            ]);
          });
      }
    });

    // Add table
    autoTable(doc, {
      head: [["Time", "Activity", "Location", "Cost", "Type"]],
      body: tableData,
      startY: 60,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 41, 55] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
      },
    });

    // Save the PDF
    const fileName = `${pdfFileName.trim()}.pdf`;
    doc.save(fileName);

    toast.success(`Your itinerary has been saved as ${fileName}`);

    setShowPdfDialog(false);
    setPdfFileName("");
  };

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const saveItinerary = () => {
    if (!creatorName.trim()) {
      toast.error("Please enter your name before saving");
      return;
    }

    const dataToSave = {
      version: "1.0",
      savedAt: new Date().toISOString(),
      createdBy: creatorName.trim(),
      tripData: {
        ...tripData,
        startDate: tripData.startDate.toISOString(),
        endDate: tripData.endDate.toISOString(),
      },
      itinerary: itinerary,
    };

    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const creatorSlug = creatorName.trim().replace(/\s+/g, "-").toLowerCase();
    const fileName = `${format(new Date(), "yyyyMMdd")}-itinerary-${tripData.destinations[0].replace(/\s+/g, "-").toLowerCase()}-by-${creatorSlug}.json`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowSaveDialog(false);
    setLoadedCreatorName(creatorName.trim());
    setCreatorName("");

    toast.success(`Your itinerary has been saved as ${fileName}`);
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

            // Update both trip data and itinerary
            onUpdateTripData(loadedTripData);
            onUpdateItinerary(data.itinerary);

            // Store creator name if available
            if (data.createdBy) {
              setLoadedCreatorName(data.createdBy);
            }

            toast.success("Your saved itinerary has been loaded successfully");
          } catch (error) {
            toast.error(
              "The file could not be loaded. Please make sure it's a valid itinerary file.",
            );
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle day column reordering
    if (type === "COLUMN") {
      const newDayOrder = Array.from(
        { length: tripData.days },
        (_, i) => i + 1,
      );
      const [removed] = newDayOrder.splice(source.index, 1);
      newDayOrder.splice(destination.index, 0, removed);

      reorderDays(newDayOrder);
      return;
    }

    // Handle activity dragging between days
    const sourceDay = parseInt(source.droppableId);
    const destinationDay = parseInt(destination.droppableId);

    const item = itinerary.find((item) => item.id === draggableId);
    if (!item) {
      return;
    }

    // Update the item's day
    const updatedItem = { ...item, day: destinationDay };

    // Create new itinerary with updated item
    const newItinerary = itinerary.map((i) =>
      i.id === draggableId ? updatedItem : i,
    );

    onUpdateItinerary(newItinerary);
    toast.success(`"${item.activity}" moved to Day ${destinationDay}`);
  };

  const reorderDays = (newDayOrder: number[]) => {
    const dayMapping: Record<number, number> = {};
    newDayOrder.forEach((oldDay, index) => {
      dayMapping[oldDay] = index + 1;
    });

    const newItinerary = itinerary.map((item) => ({
      ...item,
      day: dayMapping[item.day],
    }));

    onUpdateItinerary(newItinerary);
    toast.success("Your itinerary days have been reordered");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "flight":
        return <Plane className="h-4 w-4" />;
      case "accommodation":
        return <Bed className="h-4 w-4" />;
      case "meal":
        return <Utensils className="h-4 w-4" />;
      case "transport":
        return <Car className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "flight":
        return "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800";
      case "accommodation":
        return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800";
      case "meal":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "transport":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  const totalCost = useMemo(
    () => itinerary.reduce((sum, item) => sum + item.estimatedCost, 0),
    [itinerary],
  );

  const remainingBudget = useMemo(
    () => tripData.budget - totalCost,
    [tripData.budget, totalCost],
  );

  const groupedByDay = useMemo(
    () =>
      itinerary.reduce(
        (acc, item) => {
          if (!acc[item.day]) {
            acc[item.day] = [];
          }
          acc[item.day].push(item);
          return acc;
        },
        {} as Record<number, ItineraryItem[]>,
      ),
    [itinerary],
  );

  // Create columns for all days in the trip
  const dayColumns = useMemo(
    () =>
      Array.from({ length: tripData.days }, (_, index) => {
        const dayNumber = index + 1;
        return {
          day: dayNumber,
          items: groupedByDay[dayNumber] || [],
        };
      }),
    [tripData.days, groupedByDay],
  );

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">
            Generating Your Itinerary
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This may take a few moments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <Drawer
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          shouldScaleBackground={false}
          repositionInputs={false}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Save Project</DrawerTitle>
              <DrawerDescription>
                Enter your name to save this itinerary project
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="creator-name">Your Name</Label>
                <Input
                  id="creator-name"
                  placeholder="Enter your name"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveItinerary();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setCreatorName("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveItinerary}>Save Project</Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Project</DialogTitle>
              <DialogDescription>
                Enter your name to save this itinerary project
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="creator-name">Your Name</Label>
                <Input
                  id="creator-name"
                  placeholder="Enter your name"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveItinerary();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setCreatorName("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveItinerary}>Save Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isMobile ? (
        <Drawer
          open={showBudgetDialog}
          onOpenChange={setShowBudgetDialog}
          shouldScaleBackground={false}
          repositionInputs={false}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Edit Budget</DrawerTitle>
              <DrawerDescription>Update your trip budget</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="budget-amount">Budget Amount</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {tripData.currency}
                  </span>
                  <Input
                    id="budget-amount"
                    type="number"
                    min="1"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBudgetSave();
                      if (e.key === "Escape") handleBudgetCancel();
                    }}
                    placeholder="Enter budget amount"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleBudgetCancel}>
                  Cancel
                </Button>
                <Button onClick={handleBudgetSave}>Save Budget</Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>Update your trip budget</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="budget-amount">Budget Amount</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {tripData.currency}
                  </span>
                  <Input
                    id="budget-amount"
                    type="number"
                    min="1"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBudgetSave();
                      if (e.key === "Escape") handleBudgetCancel();
                    }}
                    placeholder="Enter budget amount"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleBudgetCancel}>
                Cancel
              </Button>
              <Button onClick={handleBudgetSave}>Save Budget</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={deleteDayNumber !== null}
        onOpenChange={(open) => !open && setDeleteDayNumber(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Day {deleteDayNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete Day {deleteDayNumber} and all its
              activities. Remaining days will be renumbered. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDay}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showClearAllDialog}
        onOpenChange={setShowClearAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Activities?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all activities from all days in your
              itinerary. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isMobile ? (
        <Drawer
          open={showPdfDialog}
          onOpenChange={setShowPdfDialog}
          shouldScaleBackground={false}
          repositionInputs={false}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Download PDF</DrawerTitle>
              <DrawerDescription>
                Enter a filename for your itinerary PDF
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pdf-filename">Filename</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pdf-filename"
                    placeholder="Enter filename"
                    value={pdfFileName}
                    onChange={(e) => setPdfFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmDownloadPDF();
                      if (e.key === "Escape") setShowPdfDialog(false);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">.pdf</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPdfDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmDownloadPDF}>Download</Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Download PDF</DialogTitle>
              <DialogDescription>
                Enter a filename for your itinerary PDF
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pdf-filename">Filename</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pdf-filename"
                    placeholder="Enter filename"
                    value={pdfFileName}
                    onChange={(e) => setPdfFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmDownloadPDF();
                      if (e.key === "Escape") setShowPdfDialog(false);
                    }}
                    autoFocus
                  />
                  <span className="text-sm text-muted-foreground">.pdf</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPdfDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmDownloadPDF}>Download</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onReset}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Plan New Trip
            </Button>
            <ThemeToggle />
          </div>

          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tripData.destinations.join(" → ")} • {tripData.days} days
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {format(tripData.startDate, "MMM dd")} -{" "}
              {format(tripData.endDate, "MMM dd, yyyy")}
            </p>
            {loadedCreatorName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Created by:{" "}
                <span className="font-medium uppercase">
                  {loadedCreatorName}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={downloadPDF}
            className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900"
          >
            <Download className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
          <Button
            onClick={handleSaveClick}
            variant="outline"
            className="flex-1 sm:flex-none border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
          <Button
            onClick={loadItinerary}
            variant="outline"
            className="flex-1 sm:flex-none border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <Upload className="h-4 w-4 mr-2" />
            Load Project
          </Button>
          <Button
            variant="destructive"
            onClick={clearAllActivities}
            className="flex-1 sm:flex-none"
            disabled={itinerary.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardContent className={isMobile ? "p-4" : "p-6"}>
              <div className="flex items-center space-x-3">
                <div
                  className={`rounded-lg bg-emerald-100 dark:bg-emerald-900/30 ${isMobile ? "p-2" : "p-3"}`}
                >
                  <DollarSign
                    className={
                      isMobile
                        ? "h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        : "h-5 w-5 text-emerald-600 dark:text-emerald-400"
                    }
                  />
                </div>
                <div>
                  <p
                    className={`text-slate-500 dark:text-slate-400 mb-1 ${isMobile ? "text-xs" : "text-sm"}`}
                  >
                    Total Cost
                  </p>
                  <p
                    className={`font-semibold text-slate-900 dark:text-slate-50 ${isMobile ? "text-lg" : "text-2xl"}`}
                  >
                    {tripData.currency} {totalCost}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800">
            <CardContent className={`relative ${isMobile ? "p-4" : "p-6"}`}>
              <div className="flex items-center space-x-3">
                <div
                  className={`rounded-lg bg-blue-100 dark:bg-blue-900/30 ${isMobile ? "p-2" : "p-3"}`}
                >
                  <DollarSign
                    className={
                      isMobile
                        ? "h-4 w-4 text-blue-600 dark:text-blue-400"
                        : "h-5 w-5 text-blue-600 dark:text-blue-400"
                    }
                  />
                </div>
                <div>
                  <p
                    className={`text-slate-500 dark:text-slate-400 mb-1 ${isMobile ? "text-xs" : "text-sm"}`}
                  >
                    Budget
                  </p>
                  <p
                    className={`font-semibold text-slate-900 dark:text-slate-50 ${isMobile ? "text-lg" : "text-2xl"}`}
                  >
                    {tripData.currency} {tripData.budget}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleBudgetEdit}
                className={`absolute hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 ${isMobile ? "h-5 w-5 top-3 right-3" : "h-6 w-6 top-4 right-4"}`}
              >
                <Edit className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800">
            <CardContent className={isMobile ? "p-4" : "p-6"}>
              <div className="flex items-center space-x-3">
                <div
                  className={`rounded-lg ${isMobile ? "p-2" : "p-3"} ${remainingBudget >= 0 ? "bg-teal-100 dark:bg-teal-900/30" : "bg-rose-100 dark:bg-rose-900/30"}`}
                >
                  <DollarSign
                    className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} ${remainingBudget >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-slate-500 dark:text-slate-400 mb-1 ${isMobile ? "text-xs" : "text-sm"}`}
                  >
                    Remaining
                  </p>
                  <p
                    className={`font-semibold ${isMobile ? "text-lg" : "text-2xl"} ${remainingBudget >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"}`}
                  >
                    {tripData.currency} {remainingBudget}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kanban" className="w-full">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            <Button onClick={addDay} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Day
            </Button>
          </div>

          <TabsContent value="kanban" className="space-y-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable
                droppableId="all-columns"
                direction={isMobile ? "vertical" : "horizontal"}
                type="COLUMN"
              >
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={(el) => {
                      provided.innerRef(el);
                      scrollContainerRef.current = el;
                    }}
                    className={
                      isMobile ? "space-y-4" : "flex gap-6 overflow-x-auto pb-4"
                    }
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {dayColumns.map((column, columnIndex) => (
                      <Draggable
                        key={column.day}
                        draggableId={`day-${column.day}`}
                        index={columnIndex}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col flex-shrink-0 ${
                              isMobile
                                ? "w-full min-h-[300px]"
                                : "min-h-[500px] w-[320px]"
                            } ${
                              snapshot.isDragging ? "opacity-75 rotate-2" : ""
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className={`border-b border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-slate-900/50 ${
                                isMobile ? "p-3" : "p-4"
                              }`}
                            >
                              <div
                                className={`flex items-center justify-between ${
                                  isMobile ? "mb-2" : "mb-3"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <GripVertical
                                    className={
                                      isMobile
                                        ? "h-4 w-4 text-slate-400 dark:text-slate-600"
                                        : "h-5 w-5 text-slate-400 dark:text-slate-600"
                                    }
                                  />
                                  <h3
                                    className={`font-semibold text-slate-900 dark:text-slate-50 ${
                                      isMobile ? "text-base" : "text-lg"
                                    }`}
                                  >
                                    Day {column.day}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 ${
                                      isMobile ? "text-xs px-1.5 py-0.5" : ""
                                    }`}
                                  >
                                    {column.items.length}
                                  </Badge>
                                  {tripData.days > 1 && (
                                    <>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 ${
                                              isMobile ? "h-6 w-6" : "h-7 w-7"
                                            }`}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <ArrowRightLeft
                                              className={
                                                isMobile ? "h-3 w-3" : "h-4 w-4"
                                              }
                                            />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align="end"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {Array.from(
                                            { length: tripData.days },
                                            (_, i) => i + 1,
                                          )
                                            .filter((d) => d !== column.day)
                                            .map((dayNum) => (
                                              <DropdownMenuItem
                                                key={dayNum}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  moveDayToPosition(
                                                    column.day,
                                                    dayNum,
                                                  );
                                                }}
                                              >
                                                Move to day {dayNum}
                                              </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`p-0 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 ${
                                          isMobile ? "h-6 w-6" : "h-7 w-7"
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteDay(column.day);
                                        }}
                                      >
                                        <X
                                          className={
                                            isMobile ? "h-3 w-3" : "h-4 w-4"
                                          }
                                        />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Droppable droppableId={column.day.toString()}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`flex-1 space-y-3 transition-colors overflow-y-auto ${
                                    isMobile ? "p-3" : "p-4"
                                  } ${
                                    snapshot.isDraggingOver
                                      ? "bg-slate-50 dark:bg-slate-800/50"
                                      : ""
                                  }`}
                                >
                                  {column.items.map((item, index) => (
                                    <ItineraryItemCard
                                      key={item.id}
                                      item={item}
                                      index={index}
                                      currency={tripData.currency}
                                      onUpdateItem={addOrUpdateActivity}
                                      onRemoveItem={removeActivity}
                                      totalDays={tripData.days}
                                      onMoveToDay={moveItemToDay}
                                    />
                                  ))}
                                  {provided.placeholder}

                                  <AddEditActivityDialog
                                    day={column.day}
                                    currency={tripData.currency}
                                    onSave={addOrUpdateActivity}
                                  />
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </TabsContent>
          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader className={isMobile ? "p-4" : "p-6"}>
                <CardTitle className={isMobile ? "text-base" : "text-lg"}>
                  Itinerary Details
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? "p-0" : "p-6"}>
                <div
                  className={isMobile ? "overflow-x-auto" : "overflow-x-auto"}
                >
                  <Table className={isMobile ? "relative" : ""}>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className={isMobile ? "text-xs py-2 px-2" : ""}
                        >
                          Time
                        </TableHead>
                        <TableHead
                          className={isMobile ? "text-xs py-2 px-2" : ""}
                        >
                          Activity
                        </TableHead>
                        <TableHead
                          className={isMobile ? "text-xs py-2 px-2" : ""}
                        >
                          Location
                        </TableHead>
                        <TableHead
                          className={isMobile ? "text-xs py-2 px-2" : ""}
                        >
                          Cost ({tripData.currency})
                        </TableHead>
                        {!isMobile && <TableHead>Type</TableHead>}
                        <TableHead
                          className={
                            isMobile
                              ? "w-[50px] text-xs py-2 px-2 sticky right-0 bg-white dark:bg-slate-950 z-10"
                              : "w-[100px]"
                          }
                        >
                          {isMobile ? "" : "Actions"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayColumns.map((dayColumn) => (
                        <>
                          <TableRow
                            key={`day-${dayColumn.day}`}
                            className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800"
                          >
                            <TableCell
                              colSpan={isMobile ? 4 : 5}
                              className={isMobile ? "py-3 px-2" : "py-4"}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <h3
                                    className={`font-semibold text-slate-900 dark:text-slate-50 ${isMobile ? "text-sm" : "text-lg"}`}
                                  >
                                    Day {dayColumn.day}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className={`bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 ${isMobile ? "text-xs px-1.5 py-0.5" : ""}`}
                                  >
                                    {dayColumn.items.length}{" "}
                                    {isMobile ? "" : "activities"}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell
                              className={
                                isMobile
                                  ? "py-3 px-2 sticky right-0 bg-slate-50 dark:bg-slate-900/50"
                                  : "py-4"
                              }
                            >
                              {tripData.days > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 ${isMobile ? "h-7 w-7 p-0" : ""}`}
                                  onClick={() => deleteDay(dayColumn.day)}
                                >
                                  <X
                                    className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                                  />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>

                          {dayColumn.items.length === 0 ? (
                            <TableRow key={`day-${dayColumn.day}-empty`}>
                              <TableCell
                                colSpan={isMobile ? 5 : 6}
                                className={`text-center text-gray-500 dark:text-gray-400 italic ${isMobile ? "py-4 text-xs px-2" : "py-6"}`}
                              >
                                No activities planned for this day
                              </TableCell>
                            </TableRow>
                          ) : (
                            dayColumn.items
                              .sort((a, b) => a.time.localeCompare(b.time))
                              .map((item, index) => (
                                <TableRow
                                  key={item.id}
                                  className={`${index === dayColumn.items.length - 1 ? "border-b-4 border-gray-200 dark:border-gray-700" : ""}`}
                                >
                                  <TableCell
                                    className={`font-medium ${isMobile ? "text-xs py-2 px-2" : ""}`}
                                  >
                                    {item.time}
                                  </TableCell>
                                  <TableCell
                                    className={
                                      isMobile ? "text-xs py-2 px-2" : ""
                                    }
                                  >
                                    {item.activity}
                                  </TableCell>
                                  <TableCell
                                    className={
                                      isMobile ? "text-xs py-2 px-2" : ""
                                    }
                                  >
                                    {item.location}
                                  </TableCell>
                                  <TableCell
                                    className={
                                      isMobile ? "text-xs py-2 px-2" : ""
                                    }
                                  >
                                    {item.estimatedCost > 0
                                      ? isMobile
                                        ? item.estimatedCost
                                        : `${tripData.currency} ${item.estimatedCost}`
                                      : "Free"}
                                  </TableCell>
                                  {!isMobile && (
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={getTypeColor(item.type)}
                                      >
                                        {getTypeIcon(item.type)}
                                        <span className="ml-1 capitalize">
                                          {item.type}
                                        </span>
                                      </Badge>
                                    </TableCell>
                                  )}
                                  <TableCell
                                    className={
                                      isMobile
                                        ? "py-2 px-2 sticky right-0 bg-white dark:bg-slate-950"
                                        : ""
                                    }
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeActivity(item.id)}
                                      className={`p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ${isMobile ? "h-6 w-6" : "h-8 w-8"}`}
                                    >
                                      <Trash2
                                        className={
                                          isMobile ? "h-3 w-3" : "h-4 w-4"
                                        }
                                      />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ItineraryDisplay;
