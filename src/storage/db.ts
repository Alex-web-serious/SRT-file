import * as SQLite from 'expo-sqlite';
import { SRTProject } from '../types';

const db = SQLite.openDatabaseSync('subtitles.db');

export const initDB = async (): Promise<void> => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      blocks_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
};

export const saveProject = async (project: SRTProject): Promise<void> => {
  db.runSync(
    'INSERT OR REPLACE INTO projects (project_id, project_name, blocks_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [
      project.projectId,
      project.projectName,
      JSON.stringify(project.blocks),
      project.createdAt,
      project.updatedAt,
    ]
  );
};

export const getProject = async (projectId: string): Promise<SRTProject | null> => {
  const row = db.getFirstSync<{
    project_id: string;
    project_name: string;
    blocks_json: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM projects WHERE project_id = ?', [projectId]);

  if (!row) return null;

  return {
    projectId: row.project_id,
    projectName: row.project_name,
    blocks: JSON.parse(row.blocks_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const getAllProjects = async (): Promise<SRTProject[]> => {
  const rows = db.getAllSync<{
    project_id: string;
    project_name: string;
    blocks_json: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM projects ORDER BY updated_at DESC');

  return rows.map((row) => ({
    projectId: row.project_id,
    projectName: row.project_name,
    blocks: JSON.parse(row.blocks_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const getProjectCount = async (): Promise<number> => {
  const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM projects');
  return row?.count ?? 0;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  db.runSync('DELETE FROM projects WHERE project_id = ?', [projectId]);
};
