// Auth routes layout - NO authentication check
// This allows /login and /signup to be accessible without being logged in

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen">
            {children}
        </div>
    )
}
