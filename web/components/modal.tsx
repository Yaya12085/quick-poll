import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";

interface ModalProps {
  title?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmLoading?: boolean;
  cancelText?: string;
  children?: React.ReactNode;
  singleAction?: boolean;
  variant?: ButtonProps["variant"];
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  isOpen,
  onClose,
  onConfirm,
  confirmText = "Continuer",
  cancelText = "Annuler",
  confirmLoading = false,
  children,
  singleAction = false,
  variant = "default",
  className,
}) => {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onChange}>
      <AlertDialogContent
        className={cn("max-h-[98vh] overflow-y-auto", className)}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div>{children}</div>
        <AlertDialogFooter className="flex flex-wrap">
          <AlertDialogCancel className={cn("", singleAction && "flex-1")}>
            {cancelText}
          </AlertDialogCancel>
          {!singleAction && (
            <Button
              variant={variant}
              onClick={onConfirm}
              disabled={confirmLoading}
            >
              {confirmLoading ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                confirmText
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
