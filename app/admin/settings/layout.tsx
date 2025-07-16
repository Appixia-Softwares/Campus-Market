export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-grow flex items-center justify-center">{children}</div>
  );
} 