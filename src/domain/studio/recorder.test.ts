import 'fake-indexeddb/auto';
import { afterEach, expect, test, vi } from 'vitest';
import { resetDbForTests } from './db';
import { StudioRecorder } from './recorder';
import { deleteTake, getTake, listTakes, takeBlob } from './takesRepo';
import type { StudioTake } from './types';

class FakeRecorder {
  static isTypeSupported(mime: string) {
    return mime === 'video/webm';
  }
  mimeType = 'video/webm';
  state: RecordingState = 'inactive';
  private listeners = new Map<string, Array<(event: BlobEvent) => void>>();
  addEventListener(name: string, listener: (event: BlobEvent) => void) {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
  }
  start(timeslice: number) {
    expect(timeslice).toBe(1000);
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.emit('dataavailable', {
      data: new Blob(['recorded'], { type: 'video/webm' }),
    } as BlobEvent);
    this.emit('stop', {} as BlobEvent);
  }
  pause() {
    this.state = 'paused';
  }
  resume() {
    this.state = 'recording';
  }
  protected emit(name: string, event: BlobEvent) {
    for (const listener of this.listeners.get(name) ?? []) listener(event);
  }
}
afterEach(async () => {
  await resetDbForTests();
  vi.unstubAllGlobals();
});

test('persists metadata before start and finishes after durable chunks', async () => {
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  const track = {
    getSettings: () => ({ width: 640, height: 480, frameRate: 30 }),
    addEventListener: () => {},
  };
  const stream = { getVideoTracks: () => [track] } as unknown as MediaStream;
  let done!: (take: StudioTake) => void;
  const result = new Promise<StudioTake>((resolve) => {
    done = resolve;
  });
  const session = await StudioRecorder.start({
    stream,
    scriptId: null,
    facing: 'front',
    resolution: '720p',
    frameRate: 30,
    quality: 'high',
    timeline: [{ t: 0, line: 0, section: 0 }],
    onStop: done,
  });
  expect((await getTake(session.take.id))?.status).toBe('recording');
  session.stop();
  const take = await result;
  expect(take).toMatchObject({
    status: 'ready',
    chunkCount: 1,
    sizeBytes: 8,
    mimeType: 'video/webm',
    timeline: [{ t: 0, line: 0, section: 0 }],
  });
  expect(await (await takeBlob(take)).text()).toBe('recorded');
  await deleteTake(take.id);
});

test('removes provisional metadata if MediaRecorder refuses to start', async () => {
  class RefusingRecorder extends FakeRecorder {
    override start() {
      throw new DOMException('Cannot start', 'NotSupportedError');
    }
  }
  vi.stubGlobal('MediaRecorder', RefusingRecorder);
  const track = {
    getSettings: () => ({ width: 640, height: 480, frameRate: 30 }),
    addEventListener: () => {},
  };
  const stream = { getVideoTracks: () => [track] } as unknown as MediaStream;
  await expect(
    StudioRecorder.start({
      stream,
      scriptId: null,
      facing: 'front',
      resolution: '720p',
      frameRate: 30,
      quality: 'high',
      timeline: [],
      onStop: () => {},
    }),
  ).rejects.toMatchObject({ name: 'NotSupportedError' });
  expect(await listTakes()).toEqual([]);
});

test('does not label an empty recording as ready', async () => {
  class EmptyRecorder extends FakeRecorder {
    override stop() {
      this.state = 'inactive';
      this.emit('stop', {} as BlobEvent);
    }
  }
  vi.stubGlobal('MediaRecorder', EmptyRecorder);
  const track = {
    getSettings: () => ({ width: 640, height: 480, frameRate: 30 }),
    addEventListener: () => {},
  };
  const stream = { getVideoTracks: () => [track] } as unknown as MediaStream;
  const finished = new Promise<StudioTake>((resolve) => {
    void StudioRecorder.start({
      stream,
      scriptId: null,
      facing: 'front',
      resolution: '720p',
      frameRate: 30,
      quality: 'high',
      timeline: [],
      onStop: resolve,
    }).then((session) => session.stop());
  });
  expect((await finished).status).toBe('failed');
});
