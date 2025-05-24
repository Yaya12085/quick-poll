import { adventurer } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import Image from "next/image";

type AvatarProps = {
  size?: number;
  radius?: number;
  image?: string | null;
  seed?: string;
};

const Avatar = ({ size = 40, radius = 100, image, seed }: AvatarProps) => {
  const _avatar = createAvatar(adventurer, {
    seed,
    radius,
    size,
    backgroundColor: ["e29fff"],
  });

  const svg = _avatar.toDataUri();

  return (
    <div
      className="relative group cursor-pointer"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
      }}
    >
      <Image
        alt={seed || "avatar"}
        width={size}
        height={size}
        src={image || svg || "/images/placeholder.svg"}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
        }}
      />
    </div>
  );
};

export default Avatar;
