export type Aspect = '9:16' | '16:9';
export type ScriptStatus = 'idea' | 'draft' | 'ready' | 'recorded' | 'posted';

export interface StudioScript {
  id: string;
  title: string;
  body: string;
  status: ScriptStatus;
  templateId: string | null;
  targetSeconds: number;
  aspect: Aspect;
  caption: string;
  hashtags: string;
  youtubeTitle: string;
  youtubeDescription: string;
  order: number;
  plannedFor: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  lastRecordedAt: number | null;
  takeCount: number;
}

export type TakeStatus = 'recording' | 'ready' | 'recovered' | 'failed';
export interface TimelineMark {
  t: number;
  line: number;
  section: number;
}
export interface StudioTake {
  id: string;
  scriptId: string | null;
  sectionIndex: number | null;
  number: number;
  status: TakeStatus;
  mimeType: string;
  container: 'mp4' | 'webm';
  width: number;
  height: number;
  frameRate: number;
  facing: 'front' | 'back' | 'external';
  durationMs: number;
  sizeBytes: number;
  chunkCount: number;
  kept: boolean;
  starred: boolean;
  exportedAt: number | null;
  createdAt: number;
  timeline: TimelineMark[];
  trim: { startMs: number; endMs: number } | null;
}
export interface TakeChunk {
  takeId: string;
  seq: number;
  blob: Blob;
}
export interface StudioIdea {
  id: string;
  text: string;
  createdAt: number;
}

export interface StudioStore {
  scripts: StudioScript[];
  kv: Record<string, unknown>;
}
