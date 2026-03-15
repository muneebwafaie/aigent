"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    Target,
    GitBranch,
    Settings,
} from "lucide-react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/crm",
    },
    {
        label: "Campaigns",
        icon: Target,
        href: "/crm/campaigns",
    },
    {
        label: "Accounts",
        icon: Building2,
        href: "/crm/accounts",
    },
    {
        label: "Contacts",
        icon: Users,
        href: "/crm/contacts",
    },
    {
        label: "Pipeline Templates",
        icon: GitBranch,
        href: "/crm/templates",
    },
];

/**
 * Renders the CRM sidebar containing the brand link, navigation links with active highlighting, an organization switcher, and user account controls.
 *
 * Navigation items are highlighted when the current pathname equals the route href or when the pathname starts with the route href (except for the root "/crm" route).
 *
 * @returns The sidebar as a JSX.Element
 */
export function CrmSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col border-r bg-muted/20">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
                <Link href="/crm" className="flex items-center gap-2 font-semibold">
                    <Target className="h-6 w-6 text-primary" />
                    <span>Aigent CRM</span>
                </Link>
            </div>

            <ScrollArea className="flex-1 py-4">
                <nav className="grid gap-1 px-4 text-sm font-medium">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === route.href ||
                                    (pathname.startsWith(route.href) && route.href !== "/crm")
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <route.icon className="h-4 w-4" />
                            {route.label}
                        </Link>
                    ))}
                </nav>
            </ScrollArea>

            <div className="mt-auto p-4">
                <Separator className="mb-4" />
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-x-2">
                        <OrganizationSwitcher
                            hidePersonal
                            afterCreateOrganizationUrl="/crm"
                            afterLeaveOrganizationUrl="/crm"
                            afterSelectOrganizationUrl="/crm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <UserButton afterSignOutUrl="/" />
                        <span className="text-sm font-medium text-muted-foreground">Account</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
