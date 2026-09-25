import { EditorSettings, defaultEditorSettings } from './imageProcessing';

export interface LocalProject {
  id: string;
  name: string;
  thumbnailUrl: string;
  imageSource: string;
  settings: EditorSettings;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'photo_editor_saved_projects_v1';

export const getSavedProjects = (): LocalProject[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading projects:', e);
    return [];
  }
};

export const saveProject = (
  name: string,
  imageSource: string,
  thumbnailUrl: string,
  settings: EditorSettings,
  existingId?: string
): LocalProject => {
  const projects = getSavedProjects();
  const id = existingId || 'proj_' + Date.now();
  const now = Date.now();

  const project: LocalProject = {
    id,
    name: name || `Edit #${projects.length + 1}`,
    imageSource,
    thumbnailUrl,
    settings: JSON.parse(JSON.stringify(settings)),
    createdAt: existingId ? (projects.find((p) => p.id === existingId)?.createdAt || now) : now,
    updatedAt: now
  };

  const filtered = projects.filter((p) => p.id !== id);
  const updated = [project, ...filtered];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return project;
};

export const deleteProject = (id: string): void => {
  const projects = getSavedProjects();
  const updated = projects.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const renameProject = (id: string, newName: string): void => {
  const projects = getSavedProjects();
  const updated = projects.map((p) => (p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
