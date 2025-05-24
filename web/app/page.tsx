"use client";
import { Container } from "@/components/container";
import { SelectionTabs } from "@/components/selection-tab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/providers/socket-provider";
import { Wifi, WifiOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { createRoom, joinRoom, connected, currentRoom } = useSocket();
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [mode, setMode] = useQueryState("mode", {
    defaultValue: "join",
    clearOnDefault: false,
  });

  useEffect(() => {
    if (currentRoom) {
      router.push("/rooms");
    }
  }, [currentRoom, router]);

  const handleAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userName) return;

    try {
      if (mode === "join") {
        if (!roomCode) return;
        joinRoom(roomCode, userName);
      } else {
        createRoom(userName);
      }
    } finally {
    }
  };

  const isJoinMode = mode === "join";
  const isActionDisabled = !connected || !userName || (isJoinMode && !roomCode);

  return (
    <div className="h-[100dvh] flex items-center justify-center">
      <Container className="flex items-center justify-center">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="space-y-2">
            <Image src={"/icon.png"} width={50} height={50} alt="logo" />
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-primary">
                Quick Poll
              </CardTitle>
              <div className="flex items-center gap-1 text-xs font-medium">
                {connected ? (
                  <>
                    <Wifi size={16} className="text-green-500" />
                    <span className="text-green-500">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-red-500" />
                    <span className="text-red-500">Disconnected</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Create or join a room to start voting in real-time
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <SelectionTabs
              options={[
                { key: "join", label: "Join" },
                { key: "create", label: "Create" },
              ]}
              currentTab="join"
              setCurrentTab={(tab) => setMode(tab)}
            />

            <form onSubmit={handleAction} className="space-y-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium text-slate-500  block">
                  Your Name
                </Label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={!connected}
                  className="bg-white"
                />
              </div>

              {isJoinMode && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-slate-500  block">
                    Room Code
                  </Label>
                  <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    disabled={!connected}
                  />
                </div>
              )}
              <Button
                disabled={isActionDisabled}
                className="w-full"
                size="lg"
                type="submit"
              >
                {isJoinMode ? "Join Room" : "Create New Room"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
