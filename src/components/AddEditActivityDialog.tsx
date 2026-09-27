import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Clock, MapPinCheck } from "lucide-react";
import type { ItemType, ItineraryItem } from "@/types/trip";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import PlaceAutocomplete from "./PlaceAutocomplete";
import type { LatLng } from "@/lib/geo";
import { ITEM_TYPES } from "@/lib/itinerary";
import { newId } from "@/store/tripStore";

interface AddEditActivityDialogProps {
  day: number;
  item?: ItineraryItem;
  currency: string;
  onSave: (item: ItineraryItem) => void;
  isEdit?: boolean;
  /** Biases place search toward this point (usually the day's city). */
  near?: LatLng;
  /** Custom trigger; pass null when opening the dialog via `open`. */
  trigger?: React.ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const emptyForm = (item?: ItineraryItem) => ({
  activity: item?.activity ?? "",
  location: item?.location ?? "",
  time: item?.time ?? "09:00",
  estimatedCost: item?.estimatedCost ?? 0,
  type: item?.type ?? ("activity" as ItemType),
  duration: item?.duration ?? "",
  notes: item?.notes ?? "",
  coords: item?.lat !== undefined && item?.lng !== undefined
    ? { lat: item.lat, lng: item.lng }
    : undefined,
});

const AddEditActivityDialog = ({
  day,
  item,
  currency,
  onSave,
  isEdit = false,
  near,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: AddEditActivityDialogProps) => {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState(() => emptyForm(item));

  useEffect(() => {
    if (open) setFormData(emptyForm(item));
  }, [open, item]);

  const handleSave = () => {
    onSave({
      id: item?.id ?? newId(),
      day: item?.day ?? day,
      time: formData.time,
      activity: formData.activity,
      location: formData.location,
      estimatedCost: formData.estimatedCost,
      type: formData.type,
      duration: formData.duration === "" ? undefined : Number(formData.duration),
      notes: formData.notes.trim() || undefined,
      lat: formData.coords?.lat,
      lng: formData.coords?.lng,
    });
    setOpen(false);
  };

  const triggerButton =
    trigger !== undefined ? trigger :
    (isEdit ? (
      <button className="text-left">
        <div className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground">
          <Edit className="h-3 w-3" />
          <span>Edit</span>
        </div>
      </button>
    ) : (
      <Button variant="outline" size="sm" className="w-full mt-2 border-dashed">
        <Plus className="h-4 w-4 mr-2" />
        Add Activity
      </Button>
    ));

  const formContent = (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="activity">Activity</Label>
          <Input
            id="activity"
            value={formData.activity}
            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
            placeholder="e.g. Sunset at the pier"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location" className="flex items-center justify-between">
            Location
            {formData.coords && (
              <span className="flex items-center gap-1 text-xs font-normal text-primary">
                <MapPinCheck className="h-3.5 w-3.5" /> On the map
              </span>
            )}
          </Label>
          <PlaceAutocomplete
            id="location"
            mode="place"
            near={near}
            value={formData.location}
            onChange={(location) =>
              // Typing a new name invalidates the coordinates from a picked suggestion.
              setFormData((f) => ({ ...f, location, coords: undefined }))
            }
            onSelect={(place) =>
              setFormData((f) => ({
                ...f,
                location: place.name,
                coords: { lat: place.lat, lng: place.lng },
                activity: f.activity || place.name,
              }))
            }
            placeholder="Search a place"
          />
        </div>

        <div className="grid gap-4 grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <InputGroup>
              <InputGroupInput
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon>
                <Clock className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              step="15"
              placeholder={String(ITEM_TYPES[formData.type].defaultMinutes)}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="cost">Cost ({currency})</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: ItemType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ITEM_TYPES).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Booking reference, tips, what to order…"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!formData.activity || !formData.location}>
          {isEdit ? "Save Changes" : "Add Activity"}
        </Button>
      </div>
    </>
  );

  const title = isEdit ? "Edit Activity" : `Add Activity - Day ${day}`;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false} repositionInputs={false}>
        {triggerButton && <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[75vh] overflow-y-auto">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditActivityDialog;
