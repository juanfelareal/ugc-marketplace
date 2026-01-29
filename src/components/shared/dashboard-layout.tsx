'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import {
  Briefcase,
  CreditCard,
  FileText,
  Home,
  ImageIcon,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile: Profile;
}

const brandNav = [
  { href: '/brand/campaigns', label: 'Campañas', icon: Briefcase },
  { href: '/brand/products', label: 'Productos', icon: ImageIcon },
  { href: '/brand/creators', label: 'Creadores', icon: Users },
  { href: '/brand/ai-tools', label: 'Herramientas IA', icon: Sparkles },
  { href: '/brand/payments', label: 'Pagos', icon: CreditCard },
  { href: '/brand/contracts', label: 'Contratos', icon: FileText },
  { href: '/brand/settings', label: 'Configuración', icon: Settings },
];

const creatorNav = [
  { href: '/creator/campaigns', label: 'Campañas', icon: Briefcase },
  { href: '/creator/portfolio', label: 'Portafolio', icon: ImageIcon },
  { href: '/creator/earnings', label: 'Ganancias', icon: Wallet },
  { href: '/creator/contracts', label: 'Contratos', icon: FileText },
  { href: '/creator/profile', label: 'Perfil', icon: Settings },
];

export function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const nav = profile.role === 'brand' ? brandNav : creatorNav;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold">UGC Marketplace</span>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between px-4 border-b">
              <span className="font-semibold">UGC Marketplace</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-white">
          <div className="flex h-14 items-center px-6 border-b">
            <Link href={`/${profile.role}/campaigns`} className="font-semibold">
              UGC Marketplace
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium truncate">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.company_name || profile.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href={`/${profile.role}/settings`}>Configuración</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
