import { format } from "date-fns";
import type { Trip } from "@/types/trip";
import { serializeTrip } from "@/store/tripStore";
import { groupByDay, itemMinutes, itemStart, formatDayDate } from "./itinerary";

const slug = (s: string) => s.trim().replace(/\s+/g, "-").toLowerCase();

export const defaultFileBase = (trip: Trip) =>
  `${format(new Date(), "yyyyMMdd")}-itinerary-${slug(trip.tripData.destinations[0] ?? "trip")}`;

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadTripJson = (trip: Trip, createdBy: string) => {
  const fileName = `${defaultFileBase(trip)}-by-${slug(createdBy)}.json`;
  downloadBlob(
    new Blob([JSON.stringify(serializeTrip(trip, createdBy), null, 2)], {
      type: "application/json",
    }),
    fileName,
  );
  return fileName;
};

export const downloadTripPdf = async (trip: Trip, fileBase: string) => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const { tripData, itinerary } = trip;
  const totalCost = itinerary.reduce((sum, i) => sum + i.estimatedCost, 0);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Travel Itinerary", 14, 20);
  doc.setFontSize(11);
  doc.text(
    tripData.fromDestination
      ? `Route: ${tripData.fromDestination} > ${tripData.destinations.join(" > ")}`
      : `Destinations: ${tripData.destinations.join(", ")}`,
    14,
    30,
  );
  doc.text(
    `Duration: ${tripData.days} days (${format(tripData.startDate, "MMM dd")} - ${format(tripData.endDate, "MMM dd, yyyy")})`,
    14,
    36,
  );
  doc.text(`Budget: ${tripData.currency} ${tripData.budget}`, 14, 42);
  doc.text(`Total Cost: ${tripData.currency} ${totalCost}`, 14, 48);
  doc.text(`Remaining: ${tripData.currency} ${tripData.budget - totalCost}`, 14, 54);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  groupByDay(itinerary, tripData.days).forEach((items, i) => {
    rows.push([
      {
        content: `Day ${i + 1} · ${formatDayDate(tripData, i + 1)}`,
        colSpan: 5,
        styles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: "bold" },
      },
    ]);
    if (items.length === 0) rows.push(["", "No activities planned", "", "", ""]);
    for (const item of items) {
      rows.push([
        item.time,
        item.notes ? `${item.activity}\n${item.notes}` : item.activity,
        item.location,
        item.estimatedCost > 0 ? `${tripData.currency} ${item.estimatedCost}` : "Free",
        item.type.charAt(0).toUpperCase() + item.type.slice(1),
      ]);
    }
  });

  autoTable(doc, {
    head: [["Time", "Activity", "Location", "Cost", "Type"]],
    body: rows,
    startY: 60,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 41, 55] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 60 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
    },
  });

  const fileName = `${fileBase}.pdf`;
  doc.save(fileName);
  return fileName;
};

/** Exports every item as a calendar event (Google Calendar, Apple Calendar, Outlook). */
export const downloadTripIcs = async (trip: Trip) => {
  const { createEvents } = await import("ics");
  const { tripData } = trip;
  const { error, value } = createEvents(
    trip.itinerary.map((item) => {
      const start = itemStart(tripData, item);
      return {
        title: item.activity,
        location: item.location,
        description: item.notes,
        start: [
          start.getFullYear(),
          start.getMonth() + 1,
          start.getDate(),
          start.getHours(),
          start.getMinutes(),
        ] as [number, number, number, number, number],
        startInputType: "local" as const,
        startOutputType: "local" as const,
        duration: { minutes: itemMinutes(item) },
        ...(item.lat !== undefined && item.lng !== undefined
          ? { geo: { lat: item.lat, lon: item.lng } }
          : {}),
        categories: [item.type],
      };
    }),
  );
  if (error || !value) throw error ?? new Error("Could not create calendar file");
  const fileName = `${defaultFileBase(trip)}.ics`;
  downloadBlob(new Blob([value], { type: "text/calendar" }), fileName);
  return fileName;
};
