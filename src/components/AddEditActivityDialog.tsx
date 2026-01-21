import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Clock } from "lucide-react";
import { ItineraryItem } from "./ItineraryPlanner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface AddEditActivityDialogProps {
  day: number;
  item?: ItineraryItem;
  currency: string;
  onSave: (item: ItineraryItem) => void;
  isEdit?: boolean;
}

const AddEditActivityDialog = ({
  day,
  item,
  currency,
  onSave,
  isEdit = false,
}: AddEditActivityDialogProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    activity: item?.activity || "",
    location: item?.location || "",
    time: item?.time || "09:00",
    estimatedCost: item?.estimatedCost || 0,
    type: item?.type || ("activity" as const),
  });

  const handleSave = () => {
    const newItem: ItineraryItem = {
      id: item?.id || `${Date.now()}-${Math.random()}`,
      day,
      time: formData.time,
      activity: formData.activity,
      location: formData.location,
      estimatedCost: formData.estimatedCost,
      type: formData.type,
    };

    onSave(newItem);
    setOpen(false);

    if (!isEdit) {
      setFormData({
        activity: "",
        location: "",
        time: "09:00",
        estimatedCost: 0,
        type: "activity",
      });
    }
  };

  const triggerButton = isEdit ? (
    <button className="text-left">
      <div className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700">
        <Edit className="h-3 w-3" />
        <span>Edit</span>
      </div>
    </button>
  ) : (
    <Button variant="outline" size="sm" className="w-full mt-2 border-dashed">
      <Plus className="h-4 w-4 mr-2" />
      Add Activity
    </Button>
  );

  const formContent = (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="activity">Activity</Label>
          <Input
            id="activity"
            value={formData.activity}
            onChange={(e) =>
              setFormData({ ...formData, activity: e.target.value })
            }
            placeholder="Enter activity name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Enter location"
          />
        </div>

        <div
          className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}
        >
          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <InputGroup>
              <InputGroupInput
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon>
                <Clock className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cost">Cost ({currency})</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              value={formData.estimatedCost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimatedCost: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activity">Activity</SelectItem>
              <SelectItem value="meal">Meal</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="accommodation">Accommodation</SelectItem>
              <SelectItem value="flight">Flight</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!formData.activity || !formData.location}
        >
          {isEdit ? "Save Changes" : "Add Activity"}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {isEdit ? "Edit Activity" : `Add Activity - Day ${day}`}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Activity" : `Add Activity - Day ${day}`}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditActivityDialog;
