export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">UGC Marketplace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Conecta marcas con creadores de contenido en LATAM
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
