import { SimpleSidebarProvider, SimpleSidebar, SimpleContent } from "@/components/simple-sidebar"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SimpleSidebarProvider>
            <SimpleSidebar />
            <SimpleContent>
                {children}
            </SimpleContent>
        </SimpleSidebarProvider>
    )
}
