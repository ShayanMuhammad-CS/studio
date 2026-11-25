"use client";

import { useState, useMemo } from "react";
import { Plus, Search, ArrowUpDown, FolderOpen } from "lucide-react";
import { useCurrentWorkspace } from "@/components/providers/workspace-context";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useArchiveProject,
  useDeleteProject,
  type Project,
} from "@/hooks/use-projects";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyProjectsState } from "@/components/projects/empty-projects-state";
import { LoadingProjectsState } from "@/components/projects/loading-projects-state";
import { ErrorProjectsState } from "@/components/projects/error-projects-state";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { ArchiveProjectDialog } from "@/components/projects/archive-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { toast } from "sonner";

type ProjectStatusFilter = "active" | "archived" | "all";

const STATUS_FILTERS: { value: ProjectStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export default function ProjectsPage() {
  const { currentWorkspace, isLoading: isLoadingWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("active");

  const {
    data,
    isLoading: isLoadingProjects,
    isError,
    error,
    refetch,
  } = useProjects(workspaceId, { includeArchived: statusFilter !== "active" });

  const createMutation = useCreateProject(workspaceId);
  const updateMutation = useUpdateProject(workspaceId);
  const archiveMutation = useArchiveProject(workspaceId);
  const deleteMutation = useDeleteProject(workspaceId);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "name">("updated");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const rawProjects = data?.items || [];

  const filteredProjects = useMemo(() => {
    let result = (data?.items || []).filter((p) => {
      if (statusFilter === "archived") return Boolean(p.archived_at);
      if (statusFilter === "active") return !p.archived_at;
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return (
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
      );
    });

    return result;
  }, [data?.items, searchQuery, sortBy, statusFilter]);

  const handleCreateSubmit = async (formData: { name: string; description: string }) => {
    if (!workspaceId) {
      const err = new Error("No active workspace selected. Please select a workspace first.");
      toast.error(err.message);
      return;
    }
    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
  };

  const handleRenameSubmit = async (formData: {
    projectId: string;
    name: string;
    description: string;
  }) => {
    await updateMutation.mutateAsync(formData);
    setProjectToRename(null);
  };

  const handleArchiveConfirm = async (projectId: string) => {
    await archiveMutation.mutateAsync(projectId);
    setProjectToArchive(null);
  };

  const handleDeleteConfirm = async (projectId: string) => {
    await deleteMutation.mutateAsync(projectId);
    setProjectToDelete(null);
  };

  const countLabel =
    statusFilter === "archived" ? "Archived" : statusFilter === "all" ? "Total" : "Active";

  const isLoading = isLoadingWorkspace || (isLoadingProjects && !data);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#E8EAF0]">
              Projects
            </h1>
            {!isLoading && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#1B1E26] text-[#A995FF] border border-[#262A35]">
                {filteredProjects.length} {countLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-[#9AA1B2] mt-1">
            Organize, generate, and orchestrate generative multi-modal assets.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Status Filter */}
          <div
            role="group"
            aria-label="Filter projects by status"
            className="flex items-center h-10 gap-1 rounded-xl bg-[#14161C] border border-[#262A35] p-1"
          >
            {STATUS_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                aria-pressed={statusFilter === option.value}
                className={`h-full px-2.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === option.value
                    ? "bg-[#1B1E26] text-[#E8EAF0]"
                    : "text-[#9AA1B2] hover:text-[#E8EAF0]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9AA1B2] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Filter projects"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter projects..."
              className="h-10 pl-9 pr-4 rounded-xl bg-[#14161C] border border-[#262A35] text-xs text-[#E8EAF0] placeholder-[#9AA1B2]/60 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all w-52 sm:w-64"
            />
          </div>

          {/* Sort Selector */}
          <button
            type="button"
            onClick={() => setSortBy(sortBy === "updated" ? "name" : "updated")}
            className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#14161C] border border-[#262A35] hover:border-[#383E4E] text-xs font-medium text-[#E8EAF0] transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9AA1B2]" />
            <span>{sortBy === "updated" ? "Last modified" : "Name (A-Z)"}</span>
          </button>

          {/* New Project Button */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#6C4CE8] hover:bg-[#5B3FD6] text-white text-xs font-semibold shadow-[0_0_16px_rgba(124,92,255,0.25)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingProjectsState />
      ) : isError ? (
        <ErrorProjectsState
          message={(error as Error)?.message || "Failed to load projects."}
          onRetry={() => refetch()}
        />
      ) : filteredProjects.length === 0 ? (
        rawProjects.length === 0 && statusFilter === "active" ? (
          <EmptyProjectsState onCreateClick={() => setIsCreateOpen(true)} />
        ) : (
          <div className="rounded-2xl bg-[#14161C] border border-[#262A35] py-16 px-6 flex flex-col items-center justify-center text-center shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-[#1B1E26] border border-[#262A35] flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-[#9AA1B2]" />
            </div>
            <h2 className="text-lg font-semibold text-[#E8EAF0]">
              {statusFilter === "archived" ? "No archived projects" : "No projects found"}
            </h2>
            <p className="text-sm text-[#9AA1B2] mt-1">
              {statusFilter === "archived"
                ? "Projects you archive will appear here."
                : "Try adjusting your search or status filter."}
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onRename={(p) => setProjectToRename(p)}
              onArchive={(p) => setProjectToArchive(p)}
              onDelete={(p) => setProjectToDelete(p)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        isLoading={createMutation.isPending}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <RenameProjectDialog
        project={projectToRename}
        isOpen={!!projectToRename}
        isLoading={updateMutation.isPending}
        onClose={() => setProjectToRename(null)}
        onSubmit={handleRenameSubmit}
      />

      <ArchiveProjectDialog
        project={projectToArchive}
        isOpen={!!projectToArchive}
        isLoading={archiveMutation.isPending}
        onClose={() => setProjectToArchive(null)}
        onConfirm={handleArchiveConfirm}
      />

      <DeleteProjectDialog
        project={projectToDelete}
        isOpen={!!projectToDelete}
        isLoading={deleteMutation.isPending}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
