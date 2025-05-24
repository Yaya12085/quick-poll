"use client";
import { useSocket } from "@/providers/socket-provider";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Modal } from "./modal";
import { Button } from "./ui/button";

export default function LeaveRoomButton() {
  const { currentUser, leaveRoom } = useSocket();

  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handlePress = () => {
    setIsAlertOpen(true);
  };

  const message = currentUser?.isHost
    ? "Are you sure you want to leave? As the host, leaving will close the room for all participants."
    : "Are you sure you want to leave this room?";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePress}
        className="text-destructive"
      >
        <LogOut size={20} className="mr-2" />
        Leave Room
      </Button>

      <Modal
        title="Leave Room"
        description={message}
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        onConfirm={leaveRoom}
        confirmText="Leave"
      />
    </>
  );
}
