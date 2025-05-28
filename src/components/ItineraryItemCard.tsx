
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Plane, Bed, Utensils, Car, Trash2 } from "lucide-react";
import { ItineraryItem } from "./ItineraryPlanner";
import AddEditActivityDialog from "./AddEditActivityDialog";

interface ItineraryItemCardProps {
  item: ItineraryItem;
  index: number;
  currency: string;
  onUpdateItem: (item: ItineraryItem) => void;
  onRemoveItem: (itemId: string) => void;
}

const ItineraryItemCard = ({ item, index, currency, onUpdateItem, onRemoveItem }: ItineraryItemCardProps) => {
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
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800";
      case "accommodation":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800";
      case "meal":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800";
      case "transport":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${
            snapshot.isDragging ? "shadow-lg rotate-2 scale-105" : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getTypeColor(item.type)}>
                    {getTypeIcon(item.type)}
                    <span className="ml-1 capitalize">{item.type}</span>
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{item.time}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {item.activity}
              </h4>
              
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{item.location}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {item.estimatedCost > 0 ? `${currency} ${item.estimatedCost}` : 'Free'}
                </span>
                
                <AddEditActivityDialog
                  day={item.day}
                  item={item}
                  currency={currency}
                  onSave={onUpdateItem}
                  isEdit={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default ItineraryItemCard;
