import { format, set } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, Download, Trash2, Plane, Bed, Utensils, Car, MapPin } from "lucide-react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { TripData, ItineraryItem } from "./../types";
import ItineraryItemCard from "./ItineraryItemCard";
import AddEditActivityDialog from "./AddEditActivityDialog";
import ThemeToggle from "./ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { createPlan } from "@/api/PlanApi";

interface ItineraryDisplayProps {
  tripData: TripData;
  itinerary: ItineraryItem[];
  isGenerating: boolean;
  onReset: () => void;
  onUpdateItinerary: (newItinerary: ItineraryItem[]) => void;
}

const ItineraryDisplay = ({ 
  tripData, 
  itinerary, 
  isGenerating, 
  onReset,
  onUpdateItinerary 
}: ItineraryDisplayProps) => {
  const { toast } = useToast();

  const addOrUpdateActivity = (item: ItineraryItem) => {
    const existingIndex = itinerary.findIndex(i => i.tempId === item.tempId);
    
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
    const item = itinerary.find(i => i.tempId === itemId);
    const newItinerary = itinerary.filter(i => i.tempId !== itemId);
    onUpdateItinerary(newItinerary);
    toast({
      title: "Activity removed",
      description: item ? `"${item.activity}" has been removed` : "Activity removed",
    });
  };

  const clearAllActivities = () => {
    onUpdateItinerary([]);
    toast({
      title: "All activities cleared",
      description: "All activities have been removed from your itinerary",
    });
  };

  const downloadPDF = async () => {
    const payload = {
      title: "Trip to Random",
      itinerary_items: itinerary
    }
    try {
      const result = await createPlan(payload);
      toast({
        title: "Successfully generated PDF",
        description: `${result.title} has been generated successfully.`
      })
      console.log("PDF generated successfully:", result);
    } catch (err) {
      console.error("Error generating itinerary:", err);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceDay = parseInt(source.droppableId);
    const destinationDay = parseInt(destination.droppableId);
    
    const item = itinerary.find(item => item.tempId === draggableId);
    if (!item) {
      return;
    }

    // Update the item's day
    const updatedItem = { ...item, day: destinationDay };
    
    // Create new itinerary with updated item
    const newItinerary = itinerary.map(i => 
      i.tempId === draggableId ? updatedItem : i
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

    const newItinerary = itinerary.map(item => ({
      ...item,
      day: dayMapping[item.day]
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

  const totalCost = itinerary.reduce((sum, item) => sum + item.estimatedCost, 0);
  const remainingBudget = tripData.budget - totalCost;

  const groupedByDay = itinerary.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  // Create columns for all days in the trip
  const dayColumns = Array.from({ length: tripData.days }, (_, index) => {
    const dayNumber = index + 1;
    return {
      day: dayNumber,
      items: groupedByDay[dayNumber] || []
    };
  });

  if (isGenerating) {
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

  return (
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
            {format(tripData.startDate, "MMM dd")} - {format(tripData.endDate, "MMM dd, yyyy")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={downloadPDF} className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Save and Download
        </Button>
        <Button 
          variant="destructive" 
          onClick={clearAllActivities}
          className="flex-1 sm:flex-none"
          disabled={itinerary.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Activities
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                <p className="text-lg font-semibold">{tripData.currency} {totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                <p className="text-lg font-semibold">{tripData.currency} {tripData.budget.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className={`h-5 w-5 ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                <p className={`text-lg font-semibold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tripData.currency} {remainingBudget.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

       <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dayColumns.map((column) => (
                <div key={column.day} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-t-4 border-t-blue-400 bg-blue-50 dark:bg-blue-900/20 min-h-[400px] flex flex-col">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Day {column.day}</h3>
                      <Badge variant="outline" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {column.items.length}
                      </Badge>
                    </div>
                  </div>

                  <Droppable droppableId={column.day.toString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-4 space-y-3 transition-colors ${
                          snapshot.isDraggingOver ? "bg-gray-50 dark:bg-gray-700" : ""
                        }`}
                      >
                        {column.items.map((item, index) => (
                          <ItineraryItemCard
                            key={item.tempId}
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
              ))}
            </div>
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
                        <TableRow key={`day-${dayColumn.day}`} className="bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800">
                          <TableCell colSpan={6} className="py-4">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                Day {dayColumn.day}
                              </h3>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-800 dark:text-blue-200">
                                {dayColumn.items.length} activities
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {dayColumn.items.length === 0 ? (
                          <TableRow key={`day-${dayColumn.day}-empty`}>
                            <TableCell colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400 italic">
                              No activities planned for this day
                            </TableCell>
                          </TableRow>
                        ) : (
                          dayColumn.items
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map((item, index) => (
                              <TableRow 
                                key={item.tempId} 
                                className={`${index === dayColumn.items.length - 1 ? 'border-b-4 border-gray-200 dark:border-gray-700' : ''}`}
                              >
                                <TableCell className="font-medium">{item.time}</TableCell>
                                <TableCell>{item.activity}</TableCell>
                                <TableCell>{item.location}</TableCell>
                                <TableCell>
                                  {item.estimatedCost > 0 ? `${tripData.currency} ${item.estimatedCost}` : 'Free'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={getTypeColor(item.type)}>
                                    {getTypeIcon(item.type)}
                                    <span className="ml-1 capitalize">{item.type}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeActivity(item.tempId)}
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
  );
};

export default ItineraryDisplay;
