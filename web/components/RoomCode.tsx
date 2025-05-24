import { CheckCircle, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface RoomCodeProps {
  code: string;
}

export default function RoomCode({ code }: RoomCodeProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      toast.error("Error copying to clipboard");
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border shadow-2xs rounded-lg">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-slate-500">Room Code</p>
        <span className="text-xs text-slate-400">
          Copy and share this code with your friends
        </span>

        <p className="text-xl font-mono font-bold tracking-wider">{code}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyCode}
        className="gap-2 hover:bg-slate-100"
      >
        {isCopied ? (
          <>
            <CheckCircle size={16} className="text-green-500" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy size={16} />
            <span>Copy</span>
          </>
        )}
      </Button>
    </div>
  );
}
