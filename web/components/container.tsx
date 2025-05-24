import { cn } from "@/lib/utils";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
}
export const Container = ({ children, fullWidth, ...props }: Props) => {
  return (
    <div
      {...props}
      className={cn(
        "relative mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8",
        fullWidth && "w-full max-w-full",
        props.className
      )}
    >
      {children}
    </div>
  );
};
