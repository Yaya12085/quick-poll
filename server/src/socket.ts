import type { DefaultEventsMap, Server } from "socket.io";
import { v4 as uuid } from "uuid";
import type { Poll, Room, User, Vote } from "./types.js";
import { generateRoomCode } from "./utils.js";

const rooms = new Map<string, Room>();

export const initializeSocket = (
  io: Server<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap
  >
) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Store user data in socket for easy access
    let currentUser: User | null = null;
    let currentRoom: Room | null = null;

    socket.on("create_room", ({ userName }) => {
      try {
        const roomId = uuid();
        const roomCode = generateRoomCode();
        const userId = uuid();

        const user: User = {
          id: userId,
          name: userName,
          isHost: true,
        };

        const room: Room = {
          id: roomId,
          code: roomCode,
          hostId: userId,
          users: [user],
          activePoll: null,
          pollHistory: [],
        };

        rooms.set(roomId, room);
        socket.join(roomId);

        // Store user data
        currentUser = user;
        currentRoom = room;

        socket.emit("room_created", { room, user });
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("error", { message: "Failed to create room" });
      }
    });

    socket.on("join_room", ({ code, userName }) => {
      try {
        const room = Array.from(rooms.values()).find((r) => r.code === code);

        if (!room) {
          return socket.emit("error", { message: "Room not found" });
        }

        const userId = uuid();
        const user: User = {
          id: userId,
          name: userName,
          isHost: false,
        };

        room.users.push(user);
        socket.join(room.id);

        // Store user data
        currentUser = user;
        currentRoom = room;

        socket.emit("room_joined", { room, user });
        socket.to(room.id).emit("user_joined", { room, user });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leave_room", () => {
      try {
        if (!currentRoom || !currentUser) {
          return socket.emit("error", { message: "Not in a room" });
        }

        const room = rooms.get(currentRoom.id);
        if (!room) {
          return socket.emit("error", { message: "Room not found" });
        }

        // Remove user from room
        room.users = room.users.filter((u) => u.id !== currentUser!.id);
        socket.leave(room.id);

        // If host is leaving
        if (currentUser.isHost) {
          if (room.users.length > 0) {
            // Assign new host
            const newHost = room.users[0];
            newHost.isHost = true;
            room.hostId = newHost.id;
            io.to(room.id).emit("host_changed", {
              room,
              newHostId: newHost.id,
            });
          } else {
            // Close room if no users left
            rooms.delete(room.id);
            io.to(room.id).emit("room_closed", { roomId: room.id });
          }
        } else {
          // Notify others that user left
          io.to(room.id).emit("user_left", { room, userId: currentUser.id });
        }

        // Clear user data
        currentUser = null;
        currentRoom = null;
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("error", { message: "Failed to leave room" });
      }
    });

    socket.on(
      "create_poll",
      ({
        params,
        roomId,
      }: {
        params: {
          title: string;
          options: string[];
          allowMultipleVotes: boolean;
          allowChangeVotes: boolean;
        };
        roomId: string;
      }) => {
        try {
          if (!currentUser) {
            return socket.emit("error", { message: "Not authenticated" });
          }

          const room = rooms.get(roomId);
          if (!room) {
            return socket.emit("error", { message: "Room not found" });
          }

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
            createdBy: currentUser.id,
            createdAt: Date.now(),
          };

          room.activePoll = newPoll;
          room.pollHistory.push(newPoll);

          io.to(roomId).emit("poll_created", { room, poll: newPoll });
        } catch (error) {
          console.error("Error creating poll:", error);
          socket.emit("error", { message: "Failed to create poll" });
        }
      }
    );

    socket.on("vote", ({ pollId, optionId, roomId }) => {
      try {
        console.log("Vote received:", {
          pollId,
          optionId,
          roomId,
          userId: currentUser?.id,
        });

        if (!currentUser) {
          console.error("Vote error: User not authenticated");
          return socket.emit("error", { message: "Not authenticated" });
        }

        const room = rooms.get(roomId);
        if (!room || !room.activePoll || room.activePoll.id !== pollId) {
          console.error("Vote error: Room or poll not found", {
            roomId,
            pollId,
          });
          return socket.emit("error", { message: "Poll not found" });
        }

        const option = room.activePoll.options.find(
          (opt) => opt.id === optionId
        );
        if (!option) {
          console.error("Vote error: Option not found", { optionId });
          return socket.emit("error", { message: "Option not found" });
        }

        // Since we've checked currentUser is not null above, we can safely use it
        const userId = currentUser.id;

        // Check if the poll allows vote changes
        if (room.activePoll.allowChangeVotes) {
          // If vote changes are allowed, multiple votes should not be allowed
          // Remove any existing votes from this user
          room.activePoll.options.forEach((opt) => {
            opt.votes = opt.votes.filter((vote) => vote.userId !== userId);
          });
        } else if (!room.activePoll.allowMultipleVotes) {
          // If neither vote changes nor multiple votes are allowed
          const hasVoted = room.activePoll.options.some((opt) =>
            opt.votes.some((vote) => vote.userId === userId)
          );

          if (hasVoted) {
            return socket.emit("error", {
              message: "You cannot change your vote in this poll",
            });
          }
        } else {
          // Multiple votes are allowed, but check if already voted for this option
          const alreadyVotedForOption = option.votes.some(
            (vote) => vote.userId === userId
          );

          if (alreadyVotedForOption) {
            return socket.emit("error", {
              message: "You've already voted for this option",
            });
          }
        }

        const vote: Vote = {
          userId: userId,
          userName: currentUser.name,
          optionId,
          timestamp: Date.now(),
        };

        option.votes.push(vote);
        console.log("Vote added successfully:", {
          userName: currentUser.name,
          optionText: option.text,
          totalVotes: option.votes.length,
        });

        // Update the room in the map to ensure state is preserved
        rooms.set(roomId, room);

        // Emit to all users in the room including the sender
        io.to(roomId).emit("vote_added", {
          room,
          poll: room.activePoll,
          vote,
        });
      } catch (error) {
        console.error("Error adding vote:", error);
        socket.emit("error", { message: "Failed to add vote" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      if (currentRoom && currentUser) {
        const room = rooms.get(currentRoom.id);
        if (room) {
          // Only remove user from active room users list
          room.users = room.users.filter((u) => u.id !== currentUser!.id);

          if (currentUser.isHost) {
            if (room.users.length > 0) {
              // Assign new host
              const newHost = room.users[0];
              newHost.isHost = true;
              room.hostId = newHost.id;
              io.to(room.id).emit("host_changed", {
                room,
                newHostId: newHost.id,
              });
            } else {
              io.to(room.id).emit("room_closed", { roomId: room.id });
            }
          } else {
            // Notify others that user disconnected (not left)
            io.to(room.id).emit("user_disconnected", {
              room,
              userId: currentUser.id,
            });
          }
        }
      }
    });
  });
};
