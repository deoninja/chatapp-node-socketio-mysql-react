/**
 * Formats a JavaScript Date object to MySQL datetime format
 * @param {Date} date - Date object to format (defaults to current date/time if not provided)
 * @returns {string} Formatted date string in 'YYYY-MM-DD HH:MM:SS' format
 */
const formatDateForMySQL = (date = new Date()) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  /**
   * Formats a JavaScript Date object to a custom format with options for different outputs
   * @param {Date} date - Date object to format (defaults to current date/time if not provided)
   * @param {string} format - Output format ('mysql', 'date-only', 'time-only', or 'full')
   * @returns {string} Formatted date string
   */
  const formatDate = (date = new Date(), format = 'mysql') => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    switch (format) {
      case 'mysql':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      case 'date-only':
        return `${year}-${month}-${day}`;
      case 'time-only':
        return `${hours}:${minutes}:${seconds}`;
      case 'full':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      default:
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  };
  
  module.exports = {
    formatDateForMySQL,
    formatDate
  };