'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookCopy, Home, Users, BookOpen, Shield, LogOut, Megaphone, User } from 'lucide-react';
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
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
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
                                <Link href={link.href}>
                                    <SidebarMenuButton
                                        isActive={pathname === link.href}
                                        tooltip={link.label}
                                        asChild
                                    >
                                        <span>
                                            <link.icon />
                                            <span>{link.label}</span>
                                        </span>
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
                        <Link href="/">
                           <SidebarMenuButton tooltip="Back to App">
                                <span>
                                    <LogOut />
                                    <span>Back to App</span>
                                </span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
