
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, User } from "lucide-react";
import { Task } from "./KanbanBoard";

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete: () => void;
}

const TaskCard = ({ task, index, onDelete }: TaskCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
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
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-gray-900 text-sm leading-tight">
                {task.title}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
              {task.description}
            </p>
            
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={`text-xs ${getPriorityColor(task.priority)}`}
              >
                {task.priority}
              </Badge>
              
              {task.assignee && (
                <div className="flex items-center text-xs text-gray-500">
                  <User className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-20">{task.assignee}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default TaskCard;
