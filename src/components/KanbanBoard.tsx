import { useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import Column from "./Column";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assignee?: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const KanbanBoard = () => {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: "todo",
      title: "To Do",
      tasks: [
        {
          id: "task-1",
          title: "Design user interface",
          description: "Create mockups for the new dashboard",
          priority: "high",
          assignee: "John Doe",
        },
        {
          id: "task-2",
          title: "Set up database",
          description: "Configure PostgreSQL database with initial schema",
          priority: "medium",
          assignee: "Jane Smith",
        },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: [
        {
          id: "task-3",
          title: "Implement authentication",
          description: "Add login and registration functionality",
          priority: "high",
          assignee: "Mike Johnson",
        },
      ],
    },
    {
      id: "review",
      title: "Review",
      tasks: [
        {
          id: "task-4",
          title: "Code review for API endpoints",
          description: "Review and test all REST API endpoints",
          priority: "medium",
          assignee: "Sarah Wilson",
        },
      ],
    },
    {
      id: "done",
      title: "Done",
      tasks: [
        {
          id: "task-5",
          title: "Project planning",
          description: "Define project scope and requirements",
          priority: "low",
          assignee: "Tom Brown",
        },
      ],
    },
  ]);

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

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destinationColumn = columns.find(
      (col) => col.id === destination.droppableId,
    );

    if (!sourceColumn || !destinationColumn) {
      return;
    }

    const task = sourceColumn.tasks.find((task) => task.id === draggableId);
    if (!task) {
      return;
    }

    const newColumns = columns.map((column) => {
      if (column.id === source.droppableId) {
        const newTasks = [...column.tasks];
        newTasks.splice(source.index, 1);
        return { ...column, tasks: newTasks };
      }
      if (column.id === destination.droppableId) {
        const newTasks = [...column.tasks];
        newTasks.splice(destination.index, 0, task);
        return { ...column, tasks: newTasks };
      }
      return column;
    });

    setColumns(newColumns);
    toast.success(`"${task.title}" moved to ${destinationColumn.title}`);
  };

  const addTask = (columnId: string, task: Omit<Task, "id">) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
    };

    const newColumns = columns.map((column) => {
      if (column.id === columnId) {
        return { ...column, tasks: [...column.tasks, newTask] };
      }
      return column;
    });

    setColumns(newColumns);
    toast.success(
      `"${task.title}" has been added to ${columns.find((c) => c.id === columnId)?.title}`,
    );
  };

  const deleteTask = (columnId: string, taskId: string) => {
    const newColumns = columns.map((column) => {
      if (column.id === columnId) {
        return {
          ...column,
          tasks: column.tasks.filter((task) => task.id !== taskId),
        };
      }
      return column;
    });

    const deletedTask = columns
      .find((c) => c.id === columnId)
      ?.tasks.find((t) => t.id === taskId);

    setColumns(newColumns);
    toast.error(`"${deletedTask?.title}" has been removed`);
  };

  return (
    <div className="w-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
