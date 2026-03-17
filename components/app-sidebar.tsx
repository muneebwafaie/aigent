"use client";

import {
    LayoutDashboard,
    Building2,
    Users,
    Target,
    GitBranch,
    Settings,
    ChevronRight,
    Home,
} from "lucide-react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner"
import { usePathname } from "next/navigation";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, ExternalLink } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

const crmRoutes = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        url: "/crm",
    },
    {
        title: "Campaigns",
        icon: Target,
        url: "/crm/campaigns",
    },
    {
        title: "Contacts",
        icon: Users,
        url: "/crm/contacts",
    },
    {
        title: "Pipeline Templates",
        icon: GitBranch,
        url: "/crm/templates",
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className={cn(isCollapsed ? "p-0 py-2" : "p-2")}>
                <SidebarMenu>
                    <SidebarMenuItem className={cn(isCollapsed ? "flex justify-center" : "")}>
                        <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center transition-all duration-200 hover:bg-transparent active:scale-95">
                            <Link href="/" className="flex items-center justify-center gap-3">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-transform group-data-[collapsible=icon]:scale-90">
                                    <Target className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden overflow-hidden">
                                    <span className="font-bold tracking-tight text-sm text-foreground">Aigent</span>
                                    <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wide uppercase">Enterprise v1.0</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem className={cn(isCollapsed ? "flex justify-center" : "")}>
                        <SidebarMenuButton asChild tooltip="Home" isActive={pathname === "/"} className="group-data-[collapsible=icon]:justify-center">
                            <Link href="/" className={cn(isCollapsed ? "flex justify-center w-full" : "")}>
                                <Home className="size-4 shrink-0" />
                                <span className="group-data-[collapsible=icon]:hidden">Home</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <Collapsible
                        asChild
                        defaultOpen={pathname.startsWith("/crm")}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem className={cn(isCollapsed ? "flex justify-center" : "")}>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="CRM" isActive={pathname.startsWith("/crm") && pathname !== "/"} className="group-data-[collapsible=icon]:justify-center">
                                    <LayoutDashboard className="size-4 shrink-0" />
                                    <span className="group-data-[collapsible=icon]:hidden">CRM</span>
                                    <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {crmRoutes.map((item) => (
                                        <SidebarMenuSubItem key={item.url}>
                                            <ContextMenu>
                                                <ContextMenuTrigger asChild>
                                                    <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                                                        <Link href={item.url}>
                                                            <item.icon className="size-4" />
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent>
                                                    <ContextMenuItem onClick={() => window.open(item.url, '_blank')}>
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        Open in New Tab
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => {
                                                        const url = window.location.origin + item.url;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success("Link copied to clipboard");
                                                    }}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Copy Link
                                                    </ContextMenuItem>
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>

                    <SidebarMenuItem className={cn(isCollapsed ? "flex justify-center" : "")}>
                        <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === "/settings"} className="group-data-[collapsible=icon]:justify-center">
                            <Link href="/settings" className={cn(isCollapsed ? "flex justify-center w-full" : "")}>
                                <Settings className="size-4 shrink-0" />
                                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className={cn("border-t bg-sidebar/50 backdrop-blur-sm", isCollapsed ? "p-0" : "p-2")}>
                <SidebarMenu>
                    <SidebarMenuItem className={cn("flex justify-center py-2", isCollapsed ? "px-0" : "px-4")}>
                        <div className={cn(
                            "w-full transition-all duration-200",
                            isCollapsed ? "flex justify-center" : ""
                        )}>
                            <OrganizationSwitcher
                                hidePersonal
                                afterCreateOrganizationUrl="/crm"
                                afterLeaveOrganizationUrl="/crm"
                                afterSelectOrganizationUrl="/crm"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full flex justify-center overflow-hidden",
                                        organizationSwitcherTrigger: cn(
                                            "w-full justify-start gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded-md transition-colors shadow-sm border border-transparent",
                                            isCollapsed ? "justify-center p-0 w-8 h-8 rounded-lg border-sidebar-border" : "border-sidebar-border/50"
                                        ),
                                        organizationPreviewTextContainer: isCollapsed ? "hidden" : "",
                                        organizationSwitcherTriggerIcon: isCollapsed ? "hidden" : "",
                                    }
                                }}
                            />
                        </div>
                    </SidebarMenuItem>
                    <SidebarMenuItem className={cn("flex justify-center py-2", isCollapsed ? "px-0" : "px-4")}>
                        <div className={cn(
                            "w-full flex items-center gap-2 transition-all duration-200",
                            isCollapsed ? "justify-center" : "px-2 py-1.5 hover:bg-sidebar-accent rounded-md border border-sidebar-border/50 shadow-sm"
                        )}>
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "size-7 shrink-0",
                                    }
                                }}
                            />
                            {!isCollapsed && (
                                <div className="flex flex-col truncate leading-tight">
                                    <span className="text-xs font-bold text-foreground">User Account</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">Settings & Profile</span>
                                </div>
                            )}
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
