/**
 * Formats an ISO datetime string into a human-readable string.
 *
 * @param {string} datetime - The ISO datetime string to format (e.g., "2025-03-12T10:30:00Z").
 * @returns {string} The formatted datetime.
 */
export const formatTimestamp = (datetime) => {
  if (!datetime) return "Unknown time"; // Fallback for invalid or missing datetime
  const date = new Date(datetime);
  if (isNaN(date.getTime())) return "Invalid time"; // Handle invalid datetime strings
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Formats an ISO datetime string into an exact time for "Seen" status.
 *
 * @param {string} datetime - The ISO datetime string when the message was read (e.g., "2025-03-12T10:30:00Z").
 * @returns {string} A human-readable exact time string with date.
 */
export function formatRelativeTime(datetime) {
  if (!datetime) return "Seen"; // Fallback for no datetime

  const readAt = new Date(datetime);
  if (isNaN(readAt.getTime())) return "Seen"; // Handle invalid datetime strings

  // Return exact time with date for clarity
  return readAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}