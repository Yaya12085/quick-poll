"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SOCKET_CONFIG, STORAGE_KEYS } from "@/lib/socket-config";
import { initializeSocket } from "@/lib/socketService";
import { Poll, Room, User } from "@/types/server";

import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

interface SocketContextType {
  connected: boolean;
  currentRoom: Room | null;
  currentUser: User | null;
  createRoom: (userName: string) => void;
  joinRoom: (code: string, userName: string) => void;
  createPoll: (
    title: string,
    options: string[],
    allowMultipleVotes: boolean,
    allowChangeVotes: boolean
  ) => void;
  vote: (optionId: string) => void;
  leaveRoom: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
  useLocalSocket?: boolean;
}

export const SocketProvider = ({
  children,
  useLocalSocket = SOCKET_CONFIG.USE_LOCAL_SOCKET,
}: SocketProviderProps) => {
  const router = useRouter();
  const [socket] = useState(() => initializeSocket(useLocalSocket));
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Effect to initialize socket and set up event listeners
  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
      toast.error("Disconnected from server");
    };

    const handleError = (error: { message?: string }) => {
      toast.error(error?.message || "An error occurred");
    };

    const handleRoomCreated = (data: { room: Room; user: User }) => {
      setCurrentRoom(data.room);
      setCurrentUser(data.user);
      router.push("/rooms");
    };

    const handleRoomJoined = (data: { room: Room; user: User }) => {
      setCurrentRoom(data.room);
      setCurrentUser(data.user);
      router.push("/rooms");
    };

    const handleUserJoined = ({ room, user }: { room: Room; user: User }) => {
      if (currentRoom?.id === room.id) {
        setCurrentRoom(room);
        toast.info(`${user.name} joined the room`);
      }
    };

    const handleUserLeft = ({
      room,
      userId,
    }: {
      room: Room;
      userId: string;
    }) => {
      if (currentRoom?.id === room.id) {
        const leftUser = currentRoom.users.find((u) => u.id === userId);
        setCurrentRoom(room);
        if (leftUser) {
          toast.info(`${leftUser.name} left the room`);
        }
      }
    };

    const handleUserDisconnected = ({
      room,
      userId,
    }: {
      room: Room;
      userId: string;
    }) => {
      if (currentRoom?.id === room.id) {
        const disconnectedUser = currentRoom.users.find((u) => u.id === userId);
        setCurrentRoom(room);
        if (disconnectedUser) {
          toast.warning(`${disconnectedUser.name} disconnected from the room`);
        }
      }
    };

    const handleHostChanged = ({ room }: { room: Room; newHostId: string }) => {
      if (currentRoom?.id === room.id) {
        setCurrentRoom(room);
        if (currentUser && room.hostId === currentUser.id) {
          setCurrentUser({ ...currentUser, isHost: true });
          toast.info("You are now the host of this room");
        }
      }
    };

    const handleRoomClosed = ({ roomId }: { roomId: string }) => {
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
        setCurrentUser(null);
        router.push("/");
      }
    };

    const handlePollCreated = ({ room }: { room: Room; poll: Poll }) => {
      if (currentRoom?.id === room.id) {
        setCurrentRoom(room);
      }
    };

    const handleVoteAdded = ({
      room,
    }: {
      room: Room;
      poll: Poll;
      vote: { optionId: string };
    }) => {
      if (currentRoom?.id === room.id) {
        setCurrentRoom(room);
      }
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("error", handleError);
    socket.on("room_created", handleRoomCreated);
    socket.on("room_joined", handleRoomJoined);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("user_disconnected", handleUserDisconnected);
    socket.on("host_changed", handleHostChanged);
    socket.on("room_closed", handleRoomClosed);
    socket.on("poll_created", handlePollCreated);
    socket.on("vote_added", handleVoteAdded);

    // Check initial connection state
    if ((socket as any)._connected) {
      setConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("error", handleError);
      socket.off("room_created", handleRoomCreated);
      socket.off("room_joined", handleRoomJoined);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("user_disconnected", handleUserDisconnected);
      socket.off("host_changed", handleHostChanged);
      socket.off("room_closed", handleRoomClosed);
      socket.off("poll_created", handlePollCreated);
      socket.off("vote_added", handleVoteAdded);
    };
  }, [socket, router, currentRoom?.id, currentUser]);

  const createRoom = useCallback(
    (userName: string) => {
      if (!connected) {
        toast.error("Not connected to server");
        return;
      }

      if (!userName.trim()) {
        toast.error("Please enter a valid username");
        return;
      }

      try {
        socket.emit("create_room", { userName: userName.trim() });
      } catch (error) {
        console.error("SocketProvider: Error creating room:", error);
        toast.error("Failed to create room");
      }
    },
    [socket, connected]
  );

  const joinRoom = useCallback(
    (code: string, userName: string) => {
      if (!connected) {
        toast.error("Not connected to server");
        return;
      }

      if (!userName.trim()) {
        toast.error("Please enter a valid username");
        return;
      }
      if (!code.trim()) {
        toast.error("Please enter a valid room code");
        return;
      }

      try {
        socket.emit("join_room", {
          code: code.trim(),
          userName: userName.trim(),
        });
      } catch (error) {
        console.error("SocketProvider: Error joining room:", error);
        toast.error("Failed to join room");
      }
    },
    [socket, connected]
  );

  const createPoll = useCallback(
    (
      title: string,
      options: string[],
      allowMultipleVotes: boolean,
      allowChangeVotes: boolean
    ) => {
      if (!currentRoom) {
        toast.error("Not in a room");
        return;
      }
      socket.emit("create_poll", {
        params: { title, options, allowMultipleVotes, allowChangeVotes },
        roomId: currentRoom.id,
      });
    },
    [socket, currentRoom]
  );

  const vote = useCallback(
    (optionId: string) => {
      if (!currentRoom || !currentRoom.activePoll) {
        toast.error("No active poll");
        return;
      }
      socket.emit("vote", {
        pollId: currentRoom.activePoll.id,
        optionId,
        roomId: currentRoom.id,
      });
    },
    [socket, currentRoom]
  );

  const leaveRoom = useCallback(async () => {
    if (!currentRoom || !currentUser) {
      toast.error("Not in a room");
      return;
    }

    try {
      // Clear local state first
      setCurrentRoom(null);
      setCurrentUser(null);

      // Clear storage
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM);

      // Emit leave room event
      socket.emit("leave_room", {});

      // Navigate back to home
      router.push("/");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.error("Failed to leave room");
    }
  }, [socket, currentRoom, currentUser, router]);

  const value = {
    connected,
    currentRoom,
    currentUser,
    createRoom,
    joinRoom,
    createPoll,
    vote,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
