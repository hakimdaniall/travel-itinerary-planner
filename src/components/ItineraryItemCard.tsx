import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  MapPin,
  Plane,
  Bed,
  Utensils,
  Car,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";
import { ItineraryItem } from "./ItineraryPlanner";
import AddEditActivityDialog from "./AddEditActivityDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItineraryItemCardProps {
  item: ItineraryItem;
  index: number;
  currency: string;
  onUpdateItem: (item: ItineraryItem) => void;
  onRemoveItem: (itemId: string) => void;
  totalDays: number;
  onMoveToDay?: (itemId: string, newDay: number) => void;
}

const ItineraryItemCard = ({
  item,
  index,
  currency,
  onUpdateItem,
  onRemoveItem,
  totalDays,
  onMoveToDay,
}: ItineraryItemCardProps) => {
  const isMobile = useIsMobile();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "flight":
        return <Plane className={isMobile ? "h-3 w-3" : "h-4 w-4"} />;
      case "accommodation":
        return <Bed className={isMobile ? "h-3 w-3" : "h-4 w-4"} />;
      case "meal":
        return <Utensils className={isMobile ? "h-3 w-3" : "h-4 w-4"} />;
      case "transport":
        return <Car className={isMobile ? "h-3 w-3" : "h-4 w-4"} />;
      default:
        return <MapPin className={isMobile ? "h-3 w-3" : "h-4 w-4"} />;
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
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className={isMobile ? "space-y-2" : "space-y-3"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={`${getTypeColor(item.type)} ${isMobile ? "text-xs px-1.5 py-0.5" : ""}`}
                  >
                    {getTypeIcon(item.type)}
                    <span
                      className={`ml-1 capitalize ${isMobile ? "hidden" : ""}`}
                    >
                      {item.type}
                    </span>
                  </Badge>
                  <div
                    className={`flex items-center space-x-1 text-gray-600 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
                  >
                    <Clock className={isMobile ? "h-3 w-3" : "h-3 w-3"} />
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
                  className={`p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ${isMobile ? "h-5 w-5" : "h-6 w-6"}`}
                >
                  <Trash2 className={isMobile ? "h-3 w-3" : "h-3 w-3"} />
                </Button>
              </div>

              <h4
                className={`font-medium text-gray-900 dark:text-gray-100 leading-tight ${isMobile ? "text-xs" : "text-sm"}`}
              >
                {item.activity}
              </h4>

              <div
                className={`flex items-center space-x-1 text-gray-600 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
              >
                <MapPin
                  className={isMobile ? "h-3 w-3 flex-shrink-0" : "h-3 w-3"}
                />
                <span className="truncate">{item.location}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span
                  className={`font-medium ${isMobile ? "text-xs" : "text-sm"}`}
                >
                  {item.estimatedCost > 0
                    ? `${currency} ${item.estimatedCost}`
                    : "Free"}
                </span>

                <div className="flex items-center gap-3">
                  {onMoveToDay && totalDays > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-left">
                          <div className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            <ArrowRightLeft className="h-3 w-3" />
                            <span>Move</span>
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Array.from({ length: totalDays }, (_, i) => i + 1)
                          .filter((day) => day !== item.day)
                          .map((day) => (
                            <DropdownMenuItem
                              key={day}
                              onClick={() => onMoveToDay(item.id, day)}
                            >
                              Move to Day {day}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <AddEditActivityDialog
                    day={item.day}
                    item={item}
                    currency={currency}
                    onSave={onUpdateItem}
                    isEdit={true}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default ItineraryItemCard;
