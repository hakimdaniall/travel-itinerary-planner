import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TripData } from "./ItineraryPlanner";

const tripSchema = z.object({
  fromDestination: z.string().min(1, "From destination is required"),
  destinations: z
    .array(z.string())
    .min(1, "At least one destination is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  includeFlights: z.boolean(),
  budget: z.number().min(1, "Budget must be greater than 0"),
  currency: z.string(),
});

interface TripFormProps {
  onSubmit: (data: TripData) => void;
  onCustomCreate: (data: TripData) => void;
}

const TripForm = ({ onSubmit, onCustomCreate }: TripFormProps) => {
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [errors, setErrors] = useState<{
    fromDestination?: string;
    destinations?: string;
    startDate?: string;
    endDate?: string;
    budget?: string;
  }>({});

  const form = useForm<z.infer<typeof tripSchema>>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      fromDestination: "",
      destinations: [""],
      includeFlights: true,
      budget: 1000,
      currency: "MYR",
    },
  });

  const addDestination = () => {
    setDestinations([...destinations, ""]);
  };

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      const newDestinations = destinations.filter((_, i) => i !== index);
      setDestinations(newDestinations);
    }
  };

  const updateDestination = (index: number, value: string) => {
    const newDestinations = [...destinations];
    newDestinations[index] = value;
    setDestinations(newDestinations);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    const formData = new FormData(e.target as HTMLFormElement);
    const fromDestination = (formData.get("fromDestination") as string)?.trim();
    const budget = Number(formData.get("budget"));

    // Validate from destination
    if (!fromDestination) {
      newErrors.fromDestination = "From destination is required";
    }

    // Validate destinations
    const filteredDestinations = destinations.filter(
      (dest) => dest.trim() !== "",
    );
    if (filteredDestinations.length === 0) {
      newErrors.destinations = "At least one destination is required";
    }

    // Validate dates
    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!endDate) {
      newErrors.endDate = "End date is required";
    }

    // Validate budget
    if (!budget || budget <= 0) {
      newErrors.budget = "Budget must be greater than 0";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const days =
      Math.ceil(
        (endDate!.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const currency = formData.get("currency") as string;
    const includeFlights = formData.get("includeFlights") === "on";

    const tripData: TripData = {
      fromDestination,
      destinations: filteredDestinations,
      startDate: startDate!,
      endDate: endDate!,
      days,
      includeFlights,
      budget,
      currency,
    };
    console.log("Trip Data:", tripData);
    onSubmit(tripData);
  };

  const handleCustomCreate = (e: React.MouseEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    const form = document.querySelector("form") as HTMLFormElement;
    const formData = new FormData(form);
    const fromDestination = (formData.get("fromDestination") as string)?.trim();
    const budget = Number(formData.get("budget"));

    // Validate from destination
    if (!fromDestination) {
      newErrors.fromDestination = "From destination is required";
    }

    // Validate destinations
    const filteredDestinations = destinations.filter(
      (dest) => dest.trim() !== "",
    );
    if (filteredDestinations.length === 0) {
      newErrors.destinations = "At least one destination is required";
    }

    // Validate dates
    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!endDate) {
      newErrors.endDate = "End date is required";
    }

    // Validate budget
    if (!budget || budget <= 0) {
      newErrors.budget = "Budget must be greater than 0";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const days =
      Math.ceil(
        (endDate!.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const currency = formData.get("currency") as string;
    const includeFlights = formData.get("includeFlights") === "on";

    const tripData: TripData = {
      fromDestination,
      destinations: filteredDestinations,
      startDate: startDate!,
      endDate: endDate!,
      days,
      includeFlights,
      budget,
      currency,
    };
    onCustomCreate(tripData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base font-semibold">From</Label>
        <Input
          id="fromDestination"
          name="fromDestination"
          className="!mt-4 capitalize"
          placeholder="Enter destination"
        />
        {errors.fromDestination && (
          <p className="text-sm text-red-500 mt-1">{errors.fromDestination}</p>
        )}
      </div>
      <div className="space-y-4">
        <Label className="text-base font-semibold">Destinations</Label>
        {destinations.map((destination, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => updateDestination(index, e.target.value)}
              className="flex-1 capitalize"
              required={index === 0}
            />
            {destinations.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeDestination(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {errors.destinations && (
          <p className="text-sm text-red-500 mt-1">{errors.destinations}</p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={addDestination}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Destination
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) =>
                  date < new Date() || (startDate && date < startDate)
                }
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            placeholder="1000"
            min="1"
            defaultValue="1000"
          />
          {errors.budget && (
            <p className="text-sm text-red-500">{errors.budget}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select name="currency" defaultValue="MYR">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MYR">MYR (MYR)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="JPY">JPY (¥)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="includeFlights" name="includeFlights" defaultChecked />
        <Label htmlFor="includeFlights">
          Include flight tickets in itinerary
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button type="submit" className="w-full" size="lg">
          <Sparkles className="h-5 w-5 mr-2" />
          Generate with AI
        </Button>
        <Button
          type="button"
          onClick={handleCustomCreate}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Wrench className="h-5 w-5 mr-2" />
          Build Custom Itinerary
        </Button>
      </div>
    </form>
  );
};

export default TripForm;
