## restAPI formats

Currently running on [https://nus-backtracking-timetabler.onrender.com](https://nus-backtracking-timetabler.onrender.com)  
Try [this](https://nus-backtracking-timetabler.onrender.com/nusmodsURL?mods=CS2100,CS2101&sem=1&acadYear=2025-2026&breaksByDay=%5B%7B"day"%3A"Monday"%2C"startTime"%3A"12%3A00"%2C"endTime"%3A"13%3A00"%7D%2C%7B"day"%3A"Wednesday"%2C"startTime"%3A"15%3A30"%2C"endTime"%3A"16%3A00"%7D%5D)!

### Breaks
```js
// Example user input
const breaksByDay = [
  { day: "Monday", startTime: "12:00", endTime: "13:00" },
  { day: "Wednesday", startTime: "15:30", endTime: "16:00" }
];

// converting to API callable format
const url = `http://localhost:3000/nusmodsURL?mods=CS2100,CS2101&sem=1&acadYear=2025-2026&breaksByDay=${encodeURIComponent(JSON.stringify(breaksByDay))}`;
console.log(url);
```

# /nusmodsURL API Endpoint

This endpoint generates a NUSMods-compatible URL based on provided module codes, semester, academic year, and optional breaks. Access it via a GET request.

## Example Request

GET http://localhost:3000/nusmodsURL?mods=CS2100,CS2101&sem=1&acadYear=2025-2026&breaksByDay=%5B%7B%22day%22%3A%22Monday%22%2C%22startTime%22%3A%2212%3A00%22%2C%22endTime%22%3A%2213%3A00%22%7D%2C%7B%22day%22%3A%22Wednesday%22%2C%22startTime%22%3A%2215%3A30%22%2C%22endTime%22%3A%2216%3A00%22%7D%5D

## Query Parameters

| Name          | Type    | Required | Example Value                                      | Description                                                                                 |
|---------------|---------|----------|----------------------------------------------------|---------------------------------------------------------------------------------------------|
| mods          | String  | Yes      | CS2100,CS2101                                      | Comma-separated list of module codes.                                                       |
| sem           | Integer | Yes      | 1                                                  | Semester number (1 for Semester 1, 2 for Semester 2).                                      |
| acadYear      | String  | Yes      | 2025-2026                                          | Academic year in YYYY-YYYY format.                                                          |
| breaksByDay   | String  | No       | [{"day":"Monday","startTime":"12:00","endTime":"13:00"},{"day":"Wednesday","startTime":"15:30","endTime":"16:00"}] | (Optional) JSON array (URL-encoded) of break objects. Each object must have day, startTime, and endTime keys. |

## breaksByDay Format

- Type: URL-encoded JSON array of objects.
- Each object:
  - day: Day of the week ("Monday", "Tuesday", etc.)
  - startTime: Start time in "HH:MM" (24-hour) format.
  - endTime: End time in "HH:MM" (24-hour) format.

### Example JavaScript for Encoding

const breaksByDay = [
  { day: "Monday", startTime: "12:00", endTime: "13:00" },
  { day: "Wednesday", startTime: "15:30", endTime: "16:00" }
];
const url = `http://localhost:3000/nusmodsURL?mods=CS2100,CS2101&sem=1&acadYear=2025-2026&breaksByDay=${encodeURIComponent(JSON.stringify(breaksByDay))}`;
console.log(url);

## Example Usage

Request:
GET http://localhost:3000/nusmodsURL?mods=CS2100,CS2101&sem=1&acadYear=2025-2026&breaksByDay=%5B%7B%22day%22%3A%22Monday%22%2C%22startTime%22%3A%2212%3A00%22%2C%22endTime%22%3A%2213%3A00%22%7D%2C%7B%22day%22%3A%22Wednesday%22%2C%22startTime%22%3A%2215%3A30%22%2C%22endTime%22%3A%2216%3A00%22%7D%5D

Server-side Parsing Example (Express):

const breaksByDay = JSON.parse(req.query.breaksByDay);

## Notes

- All parameters are case-sensitive.
- Ensure breaksByDay is properly URL-encoded.
- The endpoint responds with a JSON object containing the generated NUSMods URL or an error message if parameters are invalid.
