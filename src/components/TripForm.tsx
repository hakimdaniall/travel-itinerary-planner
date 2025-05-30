
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TripData } from "@/types";

const tripSchema = z.object({
  fromDestination: z.string().min(1, "From destination is required"),
  destinations: z.array(z.string()).min(1, "At least one destination is required"),
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
}

const TripForm = ({ onSubmit }: TripFormProps) => {
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

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
    
    if (!startDate || !endDate) {
      return;
    }

    const filteredDestinations = destinations.filter(dest => dest.trim() !== "");
    if (filteredDestinations.length === 0) {
      return;
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const budget = Number(formData.get("budget"));
    const fromDestination = formData.get("fromDestination") as string;
    const currency = formData.get("currency") as string;
    const includeFlights = formData.get("includeFlights") === "on";

    const tripData: TripData = {
      fromDestination,
      destinations: filteredDestinations,
      startDate,
      endDate,
      days,
      includeFlights,
      budget,
      currency,
    };
    console.log("Trip Data:", tripData);
    onSubmit(tripData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Label className="text-base font-semibold">From</Label>
      <Input
        id="fromDestination"
        name="fromDestination"
        className="!mt-4 capitalize"
        placeholder="Enter destination"
        required
      />
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
                  !startDate && "text-muted-foreground"
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
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
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
                disabled={(date) => date < new Date() || (startDate && date < startDate)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
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
            required
          />
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
        <Label htmlFor="includeFlights">Include flight tickets in itinerary</Label>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Generate Itinerary
      </Button>
    </form>
  );
};

export default TripForm;
