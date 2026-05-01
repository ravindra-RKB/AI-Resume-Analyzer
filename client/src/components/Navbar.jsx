import { NavLink, useLocation } from 'react-router-dom';
import { FileText, BarChart3, Briefcase, LayoutDashboard, Sparkles } from 'lucide-react';

const navItems = [
  { to: '/', icon: FileText, label: 'Upload' },
  { to: '/analysis', icon: BarChart3, label: 'Analysis' },
  { to: '/match', icon: Briefcase, label: 'Job Match' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-bg-primary/80 backdrop-blur-xl">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-shadow duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="gradient-text">Resume</span>
              <span className="text-text-primary">AI</span>
            </span>
          </NavLink>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-accent/15 text-accent-light'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
