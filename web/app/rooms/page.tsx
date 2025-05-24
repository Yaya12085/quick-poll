"use client";
import { Container } from "@/components/container";
import CreatePollForm from "@/components/CreatePollForm";
import LeaveRoomButton from "@/components/LeaveRoomButton";
import { NoResult } from "@/components/no-result";
import PollResults from "@/components/PollResults";
import RoomCode from "@/components/RoomCode";
import { Button } from "@/components/ui/button";
import UserList from "@/components/UserList";
import { useSocket } from "@/providers/socket-provider";
import { useRouter } from "next/navigation";

export default function RoomsPage() {
  const router = useRouter();
  const { currentRoom, currentUser, createPoll, vote, leaveRoom } = useSocket();

  if (!currentRoom || !currentUser) {
    return (
      <div className="flex flex-col items-center h-[100dvh] justify-center">
        <div className="flex flex-col gap-3">
          <NoResult message="You are not in a room" />
          <Button onClick={() => router.push("/")}>Go create a room</Button>
        </div>
      </div>
    );
  }

  return (
    <Container className="flex flex-col items-center ">
      <div className="max-w-2xl w-full flex flex-col gap-3 bg-white rounded-md p-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between">
            <p className="text-md md:text-xl text-black font-semibold">
              {currentUser.isHost ? "Your Room" : "Current Room"}
            </p>
            <LeaveRoomButton />
          </div>
          <RoomCode code={currentRoom.code} />
        </div>

        {currentUser.isHost && !currentRoom.activePoll && (
          <CreatePollForm onSubmit={createPoll} />
        )}

        {currentRoom.activePoll ? (
          <PollResults
            poll={currentRoom.activePoll}
            currentUser={currentUser}
            onVote={vote}
          />
        ) : (
          <NoResult message="No active poll at the moment" />
        )}
        <UserList users={currentRoom.users} currentUserId={currentUser.id} />
      </div>
    </Container>
  );
}
