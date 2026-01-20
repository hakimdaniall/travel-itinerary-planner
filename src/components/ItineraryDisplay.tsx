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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [loadedCreatorName, setLoadedCreatorName] = useState<string | null>(
    initialCreatorName || null,
  );

  const addOrUpdateActivity = (item: ItineraryItem) => {
    const existingIndex = itinerary.findIndex((i) => i.id === item.id);

    if (existingIndex >= 0) {
      // Update existing item
      const newItinerary = [...itinerary];
      newItinerary[existingIndex] = item;
      onUpdateItinerary(newItinerary);
      toast({
        title: "Activity updated",
        description: `"${item.activity}" has been updated`,
      });
    } else {
      // Add new item
      const newItinerary = [...itinerary, item];
      onUpdateItinerary(newItinerary);
      toast({
        title: "Activity added",
        description: `"${item.activity}" has been added to Day ${item.day}`,
      });
    }
  };

  const removeActivity = (itemId: string) => {
    const item = itinerary.find((i) => i.id === itemId);
    const newItinerary = itinerary.filter((i) => i.id !== itemId);
    onUpdateItinerary(newItinerary);
    toast({
      title: "Activity removed",
      description: item
        ? `"${item.activity}" has been removed`
        : "Activity removed",
    });
  };

  const clearAllActivities = () => {
    onUpdateItinerary([]);
    toast({
      title: "All activities cleared",
      description: "All activities have been removed from your itinerary",
    });
  };

  const addDay = () => {
    const newTripData = {
      ...tripData,
      days: tripData.days + 1,
    };
    onUpdateTripData(newTripData);
    toast({
      title: "Day added",
      description: `Day ${tripData.days + 1} has been added to your itinerary`,
    });
  };

  const downloadPDF = () => {
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
    const fileName = `${format(new Date(), "yyyyMMdd")}-itinerary-${tripData.destinations[0].replace(/\s+/g, "-").toLowerCase()}.pdf`;
    doc.save(fileName);

    toast({
      title: "PDF Downloaded",
      description: `Your itinerary has been saved as ${fileName}`,
    });
  };

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const saveItinerary = () => {
    if (!creatorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before saving",
        variant: "destructive",
      });
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

    toast({
      title: "Itinerary Saved",
      description: `Your itinerary has been saved as ${fileName}`,
    });
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
    toast({
      title: "Activity moved",
      description: `"${item.activity}" moved to Day ${destinationDay}`,
    });
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
    toast({
      title: "Days reordered",
      description: "Your itinerary days have been reordered",
    });
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
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300";
      case "accommodation":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300";
      case "meal":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300";
      case "transport":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const totalCost = itinerary.reduce(
    (sum, item) => sum + item.estimatedCost,
    0,
  );
  const remainingBudget = tripData.budget - totalCost;

  const groupedByDay = itinerary.reduce(
    (acc, item) => {
      if (!acc[item.day]) {
        acc[item.day] = [];
      }
      acc[item.day].push(item);
      return acc;
    },
    {} as Record<number, ItineraryItem[]>,
  );

  // Create columns for all days in the trip
  const dayColumns = Array.from({ length: tripData.days }, (_, index) => {
    const dayNumber = index + 1;
    return {
      day: dayNumber,
      items: groupedByDay[dayNumber] || [],
    };
  });

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
          <Button onClick={downloadPDF} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
          <Button
            onClick={handleSaveClick}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
          <Button
            onClick={loadItinerary}
            variant="outline"
            className="flex-1 sm:flex-none"
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Cost
                  </p>
                  <p className="text-lg font-semibold">
                    {tripData.currency} {totalCost}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Budget
                  </p>
                  <p className="text-lg font-semibold">
                    {tripData.currency} {tripData.budget}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign
                  className={`h-5 w-5 ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}
                />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remaining
                  </p>
                  <p
                    className={`text-lg font-semibold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {tripData.currency} {remainingBudget}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kanban" className="w-full">
          <div className="flex items-center justify-between mb-4">
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
                direction="horizontal"
                type="COLUMN"
              >
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex gap-6 overflow-x-auto pb-4"
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
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-t-4 border-t-blue-400 bg-blue-50 dark:bg-blue-900/20 min-h-[500px] flex flex-col flex-shrink-0 w-[320px] ${
                              snapshot.isDragging ? "opacity-75 rotate-2" : ""
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="p-4 border-b border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                                    Day {column.day}
                                  </h3>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                  {column.items.length}
                                </Badge>
                              </div>
                            </div>

                            <Droppable droppableId={column.day.toString()}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`flex-1 p-4 space-y-3 transition-colors overflow-y-auto ${
                                    snapshot.isDraggingOver
                                      ? "bg-gray-50 dark:bg-gray-700"
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
              <CardHeader>
                <CardTitle>Itinerary Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Cost ({tripData.currency})</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayColumns.map((dayColumn) => (
                        <>
                          <TableRow
                            key={`day-${dayColumn.day}`}
                            className="bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800"
                          >
                            <TableCell colSpan={6} className="py-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                  Day {dayColumn.day}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-800 dark:text-blue-200"
                                >
                                  {dayColumn.items.length} activities
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>

                          {dayColumn.items.length === 0 ? (
                            <TableRow key={`day-${dayColumn.day}-empty`}>
                              <TableCell
                                colSpan={6}
                                className="py-6 text-center text-gray-500 dark:text-gray-400 italic"
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
                                  <TableCell className="font-medium">
                                    {item.time}
                                  </TableCell>
                                  <TableCell>{item.activity}</TableCell>
                                  <TableCell>{item.location}</TableCell>
                                  <TableCell>
                                    {item.estimatedCost > 0
                                      ? `${tripData.currency} ${item.estimatedCost}`
                                      : "Free"}
                                  </TableCell>
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
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeActivity(item.id)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="h-4 w-4" />
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
