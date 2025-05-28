
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddTaskDialog from "./AddTaskDialog";
import { Column as ColumnType, Task } from "./KanbanBoard";

interface ColumnProps {
  column: ColumnType;
  onAddTask: (columnId: string, task: Omit<Task, "id">) => void;
  onDeleteTask: (columnId: string, taskId: string) => void;
}

const Column = ({ column, onAddTask, onDeleteTask }: ColumnProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const getColumnColor = (columnId: string) => {
    switch (columnId) {
      case "todo":
        return "border-t-red-400 bg-red-50";
      case "in-progress":
        return "border-t-yellow-400 bg-yellow-50";
      case "review":
        return "border-t-blue-400 bg-blue-50";
      case "done":
        return "border-t-green-400 bg-green-50";
      default:
        return "border-t-gray-400 bg-gray-50";
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-t-4 ${getColumnColor(column.id)} min-h-[600px] flex flex-col`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 text-lg">{column.title}</h3>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          variant="outline"
          size="sm"
          className="w-full hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-4 space-y-3 transition-colors ${
              snapshot.isDraggingOver ? "bg-gray-50" : ""
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onDelete={() => onDeleteTask(column.id, task.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <AddTaskDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={(task) => onAddTask(column.id, task)}
        columnTitle={column.title}
      />
    </div>
  );
};

export default Column;
