export function NoResult({ message }: { message?: string }) {
  return (
    <p className="text-center text-muted-foreground">
      {message || "No results"}
    </p>
  );
}
