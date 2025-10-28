import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, Mic } from "lucide-react";

const TabNavigation = () => {
  const location = useLocation();

  const tabs = [
    { path: "/", label: "Text Analysis", icon: FileText },
    { path: "/audio", label: "Audio Analysis", icon: Mic },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all",
                  "border-b-2 -mb-px",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default TabNavigation;
