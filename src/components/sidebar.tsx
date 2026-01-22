'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Package,
  Settings,
  Link as LinkIcon,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const mainNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const comingSoonItems = [
  { label: 'Integrations', icon: LinkIcon },
  { label: 'Marketing', icon: Megaphone },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col border-r border-stone-200 bg-white lg:w-64">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-stone-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white font-semibold text-sm">
              M
            </div>
            <span className="hidden text-lg font-semibold text-stone-900 lg:block">
              Misu ERP
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="hidden lg:block">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}

          <Separator className="my-4" />

          {/* Coming Soon Items */}
          {comingSoonItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-400">
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:flex lg:items-center lg:gap-2">
                    {item.label}
                    <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500">
                      Soon
                    </span>
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {item.label} (Coming Soon)
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-stone-200 p-4">
          <div className="hidden text-xs text-stone-400 lg:block">
            Misu ERP v0.1
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
