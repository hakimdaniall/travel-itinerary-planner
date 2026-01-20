# Travel Itinerary Planner - New Features

## PDF Download

- Click the **"Download PDF"** button to export your itinerary as a PDF file
- The PDF includes a formatted table with all activities organized by day
- Shows trip details, budget information, and total costs
- File is automatically named with destination and date

## Save Itinerary

- Click the **"Save Itinerary"** button to save your current itinerary as a JSON file
- The saved file includes:
  - Trip data (destinations, dates, budget, etc.)
  - All activities and their details
  - Version information and timestamp
- Files are named automatically: `itinerary-[destination]-[date].json`

## Load Itinerary

- Load previously saved itineraries from either:
  1. **Main Screen**: Click "Load Saved Itinerary" button in the header
  2. **Itinerary View**: Click "Load Itinerary" button in the action bar
- Select a `.json` file that was previously saved
- All trip data and activities will be restored exactly as they were saved
- Perfect for revisiting old plans or reusing trip templates

## File Format

The saved JSON files contain:

```json
{
  "version": "1.0",
  "savedAt": "2026-01-20T...",
  "tripData": {
    "destinations": [...],
    "startDate": "...",
    "endDate": "...",
    "days": 5,
    "budget": 5000,
    "currency": "USD",
    ...
  },
  "itinerary": [
    {
      "id": "...",
      "day": 1,
      "time": "09:00",
      "activity": "...",
      "location": "...",
      "estimatedCost": 100,
      "type": "activity"
    },
    ...
  ]
}
```

## Use Cases

- **Save Work in Progress**: Save your itinerary while planning and return to it later
- **Reuse Templates**: Save a well-planned trip and modify it for similar future trips
- **Share Plans**: Export and share your itinerary files with travel companions
- **Backup**: Keep backup copies of your important travel plans
- **Print**: Generate professional PDF documents for offline reference
- **Flexible Planning**: Add more days as your trip plans evolve
- **Easy Reorganization**: Drag and drop to quickly adjust your schedule

## Add Days (NEW)

- Click the **"Add Day"** button (located next to the Kanban/Table tabs)
- Extends your trip by adding a new day column
- The trip data is automatically updated to reflect the new duration
- You can immediately start adding activities to the new day
- Perfect for when your travel plans expand

## Drag & Drop Days (NEW)

- **Reorder Day Columns**: Grab any day header (look for the grip icon ⋮⋮) and drag to reorder days
- All activities within each day move together with the column
- Visual feedback shows when you're dragging a column (slight rotation and opacity)
- Perfect for rearranging your trip schedule without manually moving activities
- Works seamlessly in Kanban Board view

## Drag & Drop Activities (ENHANCED)

- **Move Activities Between Days**: Drag any activity card to a different day column
- Activities can be reordered within the same day
- Visual feedback shows valid drop zones with background color changes
- Great for adjusting your schedule on the fly
- Activities maintain all their details when moved
