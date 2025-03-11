/**
 * Formats a timestamp into a human-readable string.
 *
 * @param {number} timestamp - The timestamp to format.
 * @returns {string} The formatted timestamp.
 */
export const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  export function formatRelativeTime(timestamp) {
    if (!timestamp) return "Seen recently"; // Fallback if no timestamp
  
    const now = new Date();
    const readAt = new Date(timestamp);
    const diffMs = now - readAt; // Difference in milliseconds
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
  
    if (diffSeconds < 60) {
      return `Seen ${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`;
    } else if (diffMinutes < 60) {
      return `Seen ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    } else if (diffHours < 24) {
      return `Seen ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } else if (diffDays < 7) {
      return `Seen ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    } else {
      // For longer periods, you could return a date, e.g., "Seen on Jan 15"
      return `Seen on ${readAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
  }