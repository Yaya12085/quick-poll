"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CreatePollParams,
  JoinRoomParams,
  Poll,
  Room,
  User,
  Vote,
} from "@/types/client";
import { io, Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { SOCKET_CONFIG, STORAGE_KEYS } from "./socket-config";

// Mock socket implementation for local storage
class LocalSocket {
  private room: Room | null = null;
  private user: User | null = null;
  private listeners: Record<string, Array<(data: any) => void>> = {};
  private _connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = SOCKET_CONFIG.RECONNECT_ATTEMPTS;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.init();
  }

  public get connected(): boolean {
    return this._connected;
  }

  private async init() {
    try {
      // Load current user if exists
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }

      // Load current room if exists
      const storedRoom = localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM);
      if (storedRoom) {
        this.room = JSON.parse(storedRoom);
      }

      this._connected = true;
      this.emit("connect", {});
    } catch (error) {
      console.error("Error initializing local socket:", error);
      this.handleError("Failed to initialize socket");
    }
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  public off(event: string, callback?: (data: any) => void) {
    if (!callback) {
      delete this.listeners[event];
    } else if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  public emit(event: string, data: any) {
    setTimeout(async () => {
      try {
        switch (event) {
          case "create_room":
            await this.handleCreateRoom(data);
            break;
          case "join_room":
            await this.handleJoinRoom(data);
            break;
          case "create_poll":
            await this.handleCreatePoll(data);
            break;
          case "vote":
            await this.handleVote(data);
            break;
          case "leave_room":
            await this.handleLeaveRoom();
            break;
          default:
            console.warn(`Unhandled event: ${event}`);
            break;
        }
      } catch (error) {
        console.error(`Error handling event ${event}:`, error);
        this.handleError(`Failed to handle ${event} event`);
      }
    }, 100); // Simulate network delay
    return this;
  }

  private triggerEvent(event: string, data: any) {
    console.log(`LocalSocket: Triggering event ${event} with data:`, data);
    if (this.listeners[event]) {
      console.log(
        `LocalSocket: Found ${this.listeners[event].length} listeners for ${event}`
      );
      this.listeners[event].forEach((callback) => callback(data));
    } else {
      console.log(`LocalSocket: No listeners found for event ${event}`);
    }
  }

  private handleError(message: string) {
    this.triggerEvent("error", { message });
  }

  private async handleCreateRoom(data: { userName: string }) {
    try {
      console.log("LocalSocket: Starting room creation with data:", data);
      const roomId = uuid();
      const roomCode = this.generateRoomCode();
      const userId = uuid();

      const user: User = {
        id: userId,
        name: data.userName,
        isHost: true,
      };

      const newRoom: Room = {
        id: roomId,
        code: roomCode,
        hostId: userId,
        users: [user],
        activePoll: null,
        pollHistory: [],
      };

      console.log("LocalSocket: Created new room:", newRoom);

      // Save user to local storage
      this.user = user;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      console.log("LocalSocket: Saved user to storage:", user);

      // Save room to local storage
      this.room = newRoom;
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(newRoom));
      console.log("LocalSocket: Saved room to storage:", newRoom);

      // Update rooms in storage
      const storedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      const rooms = storedRooms ? JSON.parse(storedRooms) : {};
      rooms[roomId] = newRoom;
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      console.log("LocalSocket: Updated rooms in storage");

      // Emit room created event
      console.log("LocalSocket: Emitting room_created event");
      this.triggerEvent("room_created", { room: newRoom, user });
    } catch (error) {
      console.error("LocalSocket: Error creating room:", error);
      this.handleError("Failed to create room");
    }
  }

  private async handleJoinRoom(data: JoinRoomParams) {
    try {
      const { code, userName } = data;

      // Get rooms from storage
      const storedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      if (!storedRooms) {
        return this.handleError("Room not found");
      }

      const rooms = JSON.parse(storedRooms);
      const roomEntry = Object.entries(rooms).find(
        ([_, room]) => (room as Room).code === code
      );

      if (!roomEntry) {
        return this.handleError("Room not found");
      }

      const [roomId, room] = roomEntry as [string, Room];

      // Create new user
      const userId = uuid();
      const user: User = {
        id: userId,
        name: userName,
        isHost: false,
      };

      // Add user to room
      room.users.push(user);

      // Save user to local storage
      this.user = user;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      // Save room to local storage
      this.room = room;
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(room));

      // Update rooms in storage
      rooms[roomId] = room;
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));

      // Emit room joined event
      this.triggerEvent("room_joined", { room, user });

      // Notify everyone in the room that a new user has joined
      this.triggerEvent("user_joined", { room, user });
    } catch (error) {
      console.error("Error joining room:", error);
      this.handleError("Failed to join room");
    }
  }

  private async handleCreatePoll(data: {
    params: CreatePollParams;
    roomId: string;
  }) {
    try {
      if (!this.room || !this.user) {
        return this.handleError("Not in a room");
      }

      const { params, roomId } = data;

      // Create new poll
      const newPoll: Poll = {
        id: uuid(),
        title: params.title,
        options: params.options.map((opt) => ({
          id: uuid(),
          text: opt,
          votes: [],
        })),
        allowMultipleVotes: params.allowMultipleVotes,
        allowChangeVotes: params.allowChangeVotes,
        createdBy: this.user.id,
        createdAt: Date.now(),
      };

      // Get rooms from storage
      const storedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      if (!storedRooms) {
        return this.handleError("Room not found");
      }

      const rooms = JSON.parse(storedRooms);
      if (!rooms[roomId]) {
        return this.handleError("Room not found");
      }

      // Update room with new poll
      const room = rooms[roomId] as Room;
      room.activePoll = newPoll;
      room.pollHistory.push(newPoll); // Add to poll history
      this.room = room;

      // Save to storage
      rooms[roomId] = room;
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(room));

      // Emit poll created event
      this.triggerEvent("poll_created", { room, poll: newPoll });
    } catch (error) {
      console.error("Error creating poll:", error);
      this.handleError("Failed to create poll");
    }
  }

  private async handleVote(data: {
    pollId: string;
    optionId: string;
    roomId: string;
  }) {
    try {
      if (!this.room || !this.user) {
        return this.handleError("Not in a room");
      }

      const { pollId, optionId, roomId } = data;

      // Get rooms from storage
      const storedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      if (!storedRooms) {
        return this.handleError("Room not found");
      }

      const rooms = JSON.parse(storedRooms);
      if (!rooms[roomId]) {
        return this.handleError("Room not found");
      }

      // Update poll with new vote
      const room = rooms[roomId] as Room;
      if (!room.activePoll || room.activePoll.id !== pollId) {
        return this.handleError("Poll not found");
      }

      // Check if multiple votes are allowed
      if (!room.activePoll.allowMultipleVotes) {
        // Remove previous votes from this user
        room.activePoll.options.forEach((option) => {
          option.votes = option.votes.filter(
            (vote) => vote.userId !== this.user!.id
          );
        });
      }

      // Find the option and add the vote
      const optionToUpdate = room.activePoll.options.find(
        (opt) => opt.id === optionId
      );
      if (!optionToUpdate) {
        return this.handleError("Option not found");
      }

      const newVote: Vote = {
        userId: this.user.id,
        userName: this.user.name,
        optionId,
        timestamp: Date.now(),
      };

      optionToUpdate.votes.push(newVote);

      // Save to storage
      this.room = room;
      rooms[roomId] = room;
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(room));

      // Emit vote added event
      this.triggerEvent("vote_added", {
        room,
        poll: room.activePoll,
        vote: newVote,
      });
    } catch (error) {
      console.error("Error adding vote:", error);
      this.handleError("Failed to add vote");
    }
  }

  private async handleLeaveRoom() {
    try {
      if (!this.room || !this.user) {
        return;
      }

      // Get rooms from storage
      const storedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      if (!storedRooms) {
        return;
      }

      const rooms = JSON.parse(storedRooms);
      if (!rooms[this.room.id]) {
        return;
      }

      // Remove user from room
      const room = rooms[this.room.id] as Room;
      room.users = room.users.filter((u) => u.id !== this.user!.id);

      // If host left, assign a new host or remove the room
      if (this.user.isHost) {
        if (room.users.length > 0) {
          const newHost = room.users[0];
          newHost.isHost = true;
          room.hostId = newHost.id;
        } else {
          // If no users left, remove the room
          const roomId = this.room.id;
          delete rooms[roomId];
          localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));

          this.room = null;
          this.user = null;
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM);

          return this.triggerEvent("room_closed", { roomId });
        }
      }

      // Save to storage
      rooms[this.room.id] = room;
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));

      // Reset current state
      const oldRoomId = this.room.id;
      this.room = null;
      this.user = null;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM);

      // Emit user left event to other users
      this.triggerEvent("user_left", {
        room,
        userId: oldRoomId,
        roomId: oldRoomId,
      });
    } catch (error) {
      console.error("Error leaving room:", error);
      this.handleError("Failed to leave room");
    }
  }

  private generateRoomCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  public disconnect() {
    this.handleLeaveRoom();
    this._connected = false;
    this.listeners = {};
  }

  public get id() {
    return this.user?.id || "";
  }
}

// Real socket implementation that connects to the server
class RealSocket {
  private socket: Socket;
  private room: Room | null = null;
  private user: User | null = null;
  private listeners: Record<string, Array<(data: any) => void>> = {};
  private _connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = SOCKET_CONFIG.RECONNECT_ATTEMPTS;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    console.log(
      "RealSocket: Initializing with server URL:",
      SOCKET_CONFIG.SERVER_URL
    );
    this.socket = io(SOCKET_CONFIG.SERVER_URL, {
      transports: ["websocket"],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: SOCKET_CONFIG.RECONNECT_DELAY,
      reconnectionDelayMax: SOCKET_CONFIG.RECONNECT_DELAY_MAX,
      timeout: SOCKET_CONFIG.TIMEOUT,
    });

    // Add more detailed connection logging
    this.socket.on("connect_error", (error: Error) => {
      console.error("RealSocket: Connection error details:", {
        message: error.message,
        stack: error.stack,
      });
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("RealSocket: Reconnection attempt:", attemptNumber);
    });

    this.socket.on("reconnect_error", (error: Error) => {
      console.error("RealSocket: Reconnection error:", error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("RealSocket: Failed to reconnect after all attempts");
    });

    this.setupSocketListeners();
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const storedUser =
        typeof localStorage !== "undefined" &&
        localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const storedRoom =
        typeof localStorage !== "undefined" &&
        localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM);

      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.user = user;
        console.log("RealSocket: Loaded user from storage:", user.id);
      }

      if (storedRoom) {
        const room = JSON.parse(storedRoom);
        this.room = room;
        console.log("RealSocket: Loaded room from storage:", room.id);
      }
    } catch (error) {
      console.error("RealSocket: Error loading from storage:", error);
    }
  }

  private setupSocketListeners() {
    this.socket.on("connect", () => {
      console.log("RealSocket: Connected successfully");
      this._connected = true;
      this.reconnectAttempts = 0;
      this.triggerEvent("connect", {});
    });

    this.socket.on("disconnect", () => {
      console.log("RealSocket: Disconnected");
      this._connected = false;
      this.triggerEvent("disconnect", {});
    });

    this.socket.on("connect_error", (error) => {
      console.error("RealSocket: Connection error:", error);
      this.handleError(`Connection error: ${error.message}`);
    });

    // Room events
    this.socket.on("room_created", (data) => {
      console.log("RealSocket: Room created:", data.room.id);
      this.room = data.room;
      this.user = data.user;
      this.saveToStorage();
      this.triggerEvent("room_created", data);
    });

    this.socket.on("room_joined", (data) => {
      console.log("RealSocket: Room joined:", data.room.id);
      this.room = data.room;
      this.user = data.user;
      this.saveToStorage();
      this.triggerEvent("room_joined", data);
    });

    this.socket.on("user_joined", (data) => {
      console.log("RealSocket: User joined room:", data.room.id);
      if (this.room && this.room.id === data.room.id) {
        this.room = data.room;
        this.saveToStorage();
      }
      this.triggerEvent("user_joined", data);
    });

    this.socket.on("user_left", (data) => {
      console.log("RealSocket: User left room:", data.room.id);
      if (this.room && this.room.id === data.room.id) {
        this.room = data.room;
        this.saveToStorage();
      }
      this.triggerEvent("user_left", data);
    });

    this.socket.on("host_changed", (data) => {
      if (this.room && this.room.id === data.room.id) {
        this.room = data.room;
        this.saveToStorage();
      }
      this.triggerEvent("host_changed", data);
    });

    this.socket.on("room_closed", (data) => {
      if (this.room && this.room.id === data.roomId) {
        this.room = null;
        this.user = null;
        this.clearStorage();
      }
      this.triggerEvent("room_closed", data);
    });

    // Poll events
    this.socket.on("poll_created", (data) => {
      if (this.room && this.room.id === data.room.id) {
        this.room = data.room;
        this.saveToStorage();
      }
      this.triggerEvent("poll_created", data);
    });

    this.socket.on("vote_added", (data) => {
      if (this.room && this.room.id === data.room.id) {
        this.room = data.room;
        this.saveToStorage();
      }
      this.triggerEvent("vote_added", data);
    });
  }

  private async saveToStorage() {
    try {
      if (this.user) {
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_USER,
          JSON.stringify(this.user)
        );
      }
      if (this.room) {
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_ROOM,
          JSON.stringify(this.room)
        );
      }
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  }

  private async clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM);
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  public off(event: string, callback?: (data: any) => void) {
    if (!callback) {
      delete this.listeners[event];
    } else if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  public emit(event: string, data: any) {
    if (!this._connected) {
      console.error("Socket is not connected. Cannot emit event:", event);
      this.handleError("Not connected to server");
      return this;
    }
    console.log(`Emitting event: ${event}`, data);
    this.socket.emit(event, data);
    return this;
  }

  private triggerEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }

  private handleError(message: string) {
    this.triggerEvent("error", { message });
  }

  public disconnect() {
    this.socket.disconnect();
    this._connected = false;
    this.listeners = {};
  }

  public get id() {
    return this.socket.id;
  }
}

// Create a singleton socket instance
let socket: Socket | LocalSocket | RealSocket | null = null;

export const initializeSocket = (
  useLocalSocket = SOCKET_CONFIG.USE_LOCAL_SOCKET
) => {
  // Only create a new socket if one doesn't exist or if the type needs to change
  if (
    !socket ||
    (useLocalSocket && !(socket instanceof LocalSocket)) ||
    (!useLocalSocket && !(socket instanceof RealSocket))
  ) {
    console.log(
      "Creating new socket instance, useLocalSocket:",
      useLocalSocket
    );

    // Disconnect existing socket if it exists
    if (socket) {
      socket.disconnect();
    }

    if (useLocalSocket) {
      socket = new LocalSocket();
    } else {
      socket = new RealSocket();
    }
  }
  return socket;
};

export const getSocket = (): Socket | LocalSocket | RealSocket => {
  if (!socket) {
    socket = initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
