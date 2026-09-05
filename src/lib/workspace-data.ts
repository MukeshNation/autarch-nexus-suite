import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type ProjectFile = Database["public"]["Tables"]["project_files"]["Row"];

export const FILES_BUCKET = "project-files";

/* ---------------------------------- projects --------------------------------- */

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string | null;
      category?: string | null;
      priority?: string;
      deadline?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in.");
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", userId)
        .limit(1)
        .maybeSingle();
      const { data, error } = await supabase
        .from("projects")
        .insert({
          owner_id: userId,
          workspace_id: workspace?.id ?? null,
          name: input.name,
          description: input.description ?? null,
          category: input.category ?? null,
          priority: input.priority ?? "medium",
          deadline: input.deadline ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Project> }) => {
      const { error } = await supabase.from("projects").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

/* ----------------------------------- tasks ---------------------------------- */

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string | null;
      project_id?: string | null;
      status?: string;
      priority?: string;
      deadline?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in.");
      const { error } = await supabase.from("tasks").insert({
        owner_id: userId,
        title: input.title,
        description: input.description ?? null,
        project_id: input.project_id ?? null,
        status: input.status ?? "todo",
        priority: input.priority ?? "medium",
        deadline: input.deadline ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/* ----------------------------------- files ---------------------------------- */

export function useFiles() {
  return useQuery({
    queryKey: ["files"],
    queryFn: async (): Promise<ProjectFile[]> => {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function useUploadFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, projectId }: { files: File[]; projectId: string | null }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in.");

      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 25 MB.`);
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${userId}/${projectId ?? "unfiled"}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(FILES_BUCKET).upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (uploadError) throw uploadError;
        const { error } = await supabase.from("project_files").insert({
          owner_id: userId,
          project_id: projectId,
          file_name: file.name,
          file_type: file.type || null,
          storage_path: path,
          file_size: file.size,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRenameFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("project_files").update({ file_name: name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: ProjectFile) => {
      const { error: storageError } = await supabase.storage.from(FILES_BUCKET).remove([file.storage_path]);
      if (storageError) throw storageError;
      const { error } = await supabase.from("project_files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });
}

export async function downloadFile(file: ProjectFile) {
  const { data, error } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(file.storage_path, 60);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not create a download link.");
  window.open(data.signedUrl, "_blank", "noopener");
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
