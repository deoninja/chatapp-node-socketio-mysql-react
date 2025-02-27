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