export const Background = () => (
    <div className="fixed inset-0 z-0 bg-background pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
    </div>
)
