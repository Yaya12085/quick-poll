// Socket configuration
export const SOCKET_CONFIG = {
  // Set to true to use local storage implementation instead of real socket
  USE_LOCAL_SOCKET: false,

  // Server URL for real socket implementation
  SERVER_URL: "http://localhost:5000",

  // Reconnection settings
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  RECONNECT_DELAY_MAX: 5000,
  TIMEOUT: 20000,
};

// Storage keys
export const STORAGE_KEYS = {
  ROOMS: "rooms",
  CURRENT_USER: "currentUser",
  CURRENT_ROOM: "currentRoom",
};
