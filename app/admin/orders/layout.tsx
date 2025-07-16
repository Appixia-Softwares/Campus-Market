export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 w-full h-full p-0 m-0">{children}</div>
  );
} 