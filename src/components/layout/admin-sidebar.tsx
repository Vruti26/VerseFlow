'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookCopy, Home, Users, BookOpen, Shield, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
} from '@/components/ui/sidebar';

const links = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/books', label: 'Books', icon: BookOpen },
    { href: '/admin/reports', label: 'Reports', icon: Shield },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarHeader>
                    <Link href="/admin" className="flex items-center gap-2">
                        <BookCopy className="h-6 w-6 text-primary" />
                        <span className="font-headline text-xl font-bold text-foreground">VerseFlow Admin</span>
                    </Link>
                </SidebarHeader>
                <SidebarGroup>
                    <SidebarMenu>
                        {links.map((link) => (
                            <SidebarMenuItem key={link.href}>
                                <Link href={link.href} legacyBehavior passHref>
                                    <SidebarMenuButton
                                        isActive={pathname === link.href}
                                        tooltip={link.label}
                                        asChild
                                    >
                                        <a>
                                            <link.icon />
                                            <span>{link.label}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/" legacyBehavior passHref>
                            <SidebarMenuButton tooltip="Back to App">
                                <a>
                                    <LogOut />
                                    <span>Back to App</span>
                                </a>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
