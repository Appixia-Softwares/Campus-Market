export default function MessagesPageLoading() {
  return (
    <div className="flex-grow flex items-center justify-center">
      <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <span className="ml-3 text-muted-foreground">Loading messages...</span>
    </div>
  );
}
