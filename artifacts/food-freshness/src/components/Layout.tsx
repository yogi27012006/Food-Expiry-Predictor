import { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Leaf, List, ScanLine, Bell, BellRing } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const [isHome] = useRoute("/");
  const [isList] = useRoute("/list");
  const { permission, requestPermission, expiringCount } = useNotifications();

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="fixed top-0 inset-x-0 z-50 glass-panel">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground hidden sm:block">
              FreshSense
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink href="/" active={isHome} icon={<ScanLine className="w-4 h-4" />} label="Analyze" />
            <NavLink href="/list" active={isList} icon={<List className="w-4 h-4" />} label="My Food" />
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <button 
              onClick={requestPermission}
              className="relative p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title={permission === 'granted' ? "Notifications active" : "Enable notifications"}
            >
              {expiringCount > 0 ? (
                <>
                  <BellRing className="w-5 h-5 text-accent animate-pulse" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                </>
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, active, icon, label }: { href: string, active: boolean, icon: ReactNode, label: string }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "relative px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors overflow-hidden",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-pill" 
          className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
