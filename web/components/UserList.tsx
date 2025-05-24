"use client";

import { Crown } from "lucide-react";
import Avatar from "./avatar";

const fonts = {
  medium: "font-medium",
};

const sizes = {
  h4: "text-lg",
  body: "text-base",
  radius: "rounded-lg",
};

const spacing = {
  s: "gap-2",
  m: "p-4",
};

const shadow = "shadow-md";

export default function UserList({
  users,
  currentUserId,
}: {
  users: { id: string; name: string; isHost: boolean }[];
  currentUserId: string;
}) {
  return (
    <div
      className={`bg-white ${sizes.radius} ${spacing.m} ${shadow} dark:bg-gray-800`}
    >
      <p
        className={`${sizes.h4} ${fonts.medium} mb-3 text-gray-900 dark:text-gray-100`}
      >
        Participants ({users.length})
      </p>

      <div className="flex flex-col">
        {users.map((user, index) => {
          const isLast = index === users.length - 1;
          const isMe = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className={`flex flex-row items-center py-3 ${spacing.s} ${
                !isLast ? "border-b border-gray-200 dark:border-gray-700" : ""
              }`}
            >
              <Avatar size={36} seed={user.name} />

              <p
                className={`${sizes.body} ${fonts.medium} text-gray-900 dark:text-gray-100 flex-1`}
              >
                {user.name} {isMe ? "(You)" : ""}
              </p>

              {user.isHost && (
                <div className="flex flex-row items-center px-2 py-1 rounded-xl bg-blue-500 dark:bg-blue-600">
                  <Crown size={14} color="white" />
                  <span className={`${fonts.medium} text-white ml-1 text-sm`}>
                    Host
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
