"use client";

import { Poll, User } from "@/types/client";
import { useMemo } from "react";
import PollOption from "./PollOption";

interface PollResultsProps {
  poll: Poll;
  currentUser: User;
  onVote: (optionId: string) => void;
}

export default function PollResults({
  poll,
  currentUser,
  onVote,
}: PollResultsProps) {
  // Calculate the total number of votes using useMemo
  const totalVotes = useMemo(
    () => poll.options.reduce((sum, option) => sum + option.votes.length, 0),
    [poll.options]
  );

  // Check if the current user has already voted for a specific option
  const hasUserVotedForOption = useMemo(
    () => (optionId: string) => {
      const option = poll.options.find((o) => o.id === optionId);
      return (
        option?.votes.some((vote) => vote.userId === currentUser.id) || false
      );
    },
    [poll.options, currentUser.id]
  );

  // Check if the user has voted at all
  const hasUserVoted = useMemo(
    () =>
      poll.options.some((option) =>
        option.votes.some((vote) => vote.userId === currentUser.id)
      ),
    [poll.options, currentUser.id]
  );

  // Determine if voting should be disabled
  const isVotingDisabled =
    !poll.allowMultipleVotes && hasUserVoted && !poll.allowChangeVotes;

  const handleVote = (optionId: string) => {
    onVote(optionId);
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xl text-gray-800">{poll.title}</h2>

      <p className="text-sm text-muted-foreground">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"} •
        {poll.allowMultipleVotes
          ? " Multiple votes allowed"
          : " One vote per person"}{" "}
        •
        {poll.allowChangeVotes
          ? " Votes can be changed"
          : " Votes cannot be changed"}
      </p>

      <div className="flex flex-wrap gap-2 justify-center">
        {poll.options.map((option) => (
          <PollOption
            key={`${option.id}-${option.votes.length}`}
            option={option}
            onVote={handleVote}
            hasVoted={hasUserVotedForOption(option.id)}
            totalVotes={totalVotes}
            disabled={isVotingDisabled && !hasUserVotedForOption(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
