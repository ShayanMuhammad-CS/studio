"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FolderOpen,
  Images,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { WorkspaceSwitcher, type Workspace } from "./workspace-switcher";

interface SidebarProps {
  workspaces?: Workspace[];
  currentWorkspace?: Workspace | null;
  onSelectWorkspace?: (ws: Workspace) => void;
  /** Mobile drawer state; the sidebar is always visible from `lg` up. */
  isOpen?: boolean;
  onClose?: () => void;
  /** Desktop-only collapsed state. When true only the icons remain visible. */
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Projects", href: "/projects", icon: FolderOpen },
    { label: "Assets", href: "/assets", icon: Images },
    { label: "Generations", href: "/generations", icon: Sparkles },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        id="main-navigation"
        aria-label="Main Navigation"
        className={`fixed left-0 top-0 h-full w-60 bg-[#121317] border-r border-[#262A35] z-40 lg:z-30 flex flex-col justify-between select-none transition-[transform,width] duration-200 ease-out lg:translate-x-0 ${
          isCollapsed ? "lg:w-16" : "lg:w-60"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col min-h-0">
          {/* Workspace Switcher Header */}
          <div
            className={`h-16 shrink-0 border-b border-[#262A35] flex items-center gap-2 ${
              isCollapsed ? "lg:justify-center lg:px-2" : "px-3"
            }`}
          >
            {/* Full switcher: always visible on mobile, hidden at desktop when collapsed. */}
            <div
              className={`min-w-0 flex-1 ${
                isCollapsed ? "lg:hidden" : ""
              }`}
            >
              <WorkspaceSwitcher
                workspaces={workspaces}
                currentWorkspace={currentWorkspace}
                onSelectWorkspace={onSelectWorkspace}
              />
            </div>

            {/* Compact switcher: icon-only at desktop when collapsed. */}
            {isCollapsed && (
              <div className="hidden lg:flex lg:justify-center">
                <WorkspaceSwitcher
                  compact
                  workspaces={workspaces}
                  currentWorkspace={currentWorkspace}
                  onSelectWorkspace={onSelectWorkspace}
                />
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="lg:hidden p-1.5 rounded-lg text-[#9AA1B2] hover:text-[#E8EAF0] hover:bg-[#1B1E26] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className={`px-4 pt-5 pb-2 ${isCollapsed ? "lg:hidden" : ""}`}>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9AA1B2] px-2">
              Workspace
            </span>
          </div>

          <nav
            className={`flex flex-col gap-1 py-3 ${
              isCollapsed ? "lg:px-2" : "px-3"
            }`}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-colors group focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] ${
                    isCollapsed ? "lg:justify-center lg:px-0 lg:py-3" : "px-3 py-2"
                  } ${
                    isActive
                      ? "bg-[#1B1E26] text-[#E8EAF0] border border-[#262A35]"
                      : "text-[#9AA1B2] hover:bg-[#1B1E26]/50 hover:text-[#E8EAF0]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-[#A995FF]"
                        : "text-[#9AA1B2] group-hover:text-[#E8EAF0]"
                    }`}
                  />
                  <span className={`flex-1 truncate ${isCollapsed ? "lg:hidden" : ""}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div
          className={`border-t border-[#262A35] flex flex-col gap-2 shrink-0 ${
            isCollapsed ? "lg:p-2" : "p-4"
          }`}
        >
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
              aria-pressed={isCollapsed}
              className="group relative hidden w-full items-center justify-center rounded-xl border border-transparent px-0 py-2 text-xs font-medium text-[#9AA1B2] transition-colors hover:border-[#262A35] hover:bg-[#1B1E26] hover:text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] lg:flex"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 shrink-0 text-[#A995FF]" />
              ) : (
                <PanelLeftClose className="h-4 w-4 shrink-0" />
              )}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#262A35] bg-[#0F1117] px-2.5 py-1 text-[11px] font-medium text-[#E8EAF0] opacity-0 shadow-lg shadow-black/40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {isCollapsed ? "Expand navigation" : "Collapse sidebar"}
              </span>
            </button>
          )}

          <div
            className={`flex items-center justify-between gap-2 text-xs text-[#9AA1B2] ${
              isCollapsed ? "lg:justify-center" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span
                className={`font-mono text-[11px] whitespace-nowrap ${
                  isCollapsed ? "lg:hidden" : ""
                }`}
              >
                System Online
              </span>
            </div>
            <Activity
              className={`w-3.5 h-3.5 shrink-0 text-[#9AA1B2] ${
                isCollapsed ? "lg:block hidden" : ""
              }`}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
