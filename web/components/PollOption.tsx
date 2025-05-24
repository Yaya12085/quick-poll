"use client";

import { cn } from "@/lib/utils";
import { PollOption as PollOptionType } from "@/types/client";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface PollOptionProps {
  option: PollOptionType;
  onVote: (optionId: string) => void;
  hasVoted: boolean;
  totalVotes: number;
  disabled?: boolean;
}

export default function PollOption({
  option,
  onVote,
  hasVoted,
  totalVotes,
  disabled = false,
}: PollOptionProps) {
  const votePercentage =
    totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;

  const [key, setKey] = useState(option.id);

  useEffect(() => {
    setKey(option.id);
  }, [option.id]);

  const handleVote = () => {
    if (!disabled) {
      onVote(option.id);
    }
  };

  return (
    <div
      onClick={disabled ? undefined : handleVote}
      className={cn(
        "bg-white rounded-xl p-4 w-full flex flex-col gap-4 shadow-sm border transition hover:shadow-md",
        disabled ? "opacity-70 cursor-default" : "cursor-pointer"
      )}
    >
      {/* Option text and checkmark */}
      <div className="flex items-center justify-between">
        <p className="text-gray-800 font-medium text-base">{option.text}</p>
        {hasVoted && (
          <div className="bg-emerald-500 rounded-full w-6 h-6 flex items-center justify-center">
            <Check size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          key={key}
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${votePercentage}%` }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 100,
          }}
        />
      </div>

      {/* Percentage */}
      <p className="text-right text-sm text-muted-foreground font-semibold">
        {votePercentage}%
      </p>
    </div>
  );
}
