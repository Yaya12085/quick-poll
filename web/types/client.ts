export interface User {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Vote {
  userId: string;
  userName: string;
  optionId: string;
  timestamp: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: Vote[];
}

export interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  allowMultipleVotes: boolean;
  allowChangeVotes: boolean;
  createdBy: string;
  createdAt: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  users: User[];
  activePoll: Poll | null;
  pollHistory: Poll[];
}

export interface CreatePollParams {
  title: string;
  options: string[];
  allowMultipleVotes: boolean;
  allowChangeVotes: boolean;
}

export interface JoinRoomParams {
  code: string;
  userName: string;
}

export interface SocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export type ModeType = "join" | "create";
