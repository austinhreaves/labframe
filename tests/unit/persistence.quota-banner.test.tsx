import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobStore = new Map<string, Blob>();

vi.mock('idb-keyval', () => ({
  set: vi.fn(async (key: string, value: Blob) => {
    blobStore.set(key, value);
  }),
  get: vi.fn(async (key: string) => blobStore.get(key) ?? null),
  del: vi.fn(async (key: string) => {
    blobStore.delete(key);
  }),
  keys: vi.fn(async () => [...blobStore.keys()]),
}));

vi.mock('@/ui/sections/SectionRenderer', () => ({
  SectionRenderer: () => null,
}));

import { phy132Course } from '@/content/courses/phy132.course';
import { snellsLawLab } from '@/content/labs';
import { useLabStore } from '@/state/labStore';
import { LabPage } from '@/ui/LabPage';

describe('quota recovery banner', () => {
  beforeEach(() => {
    blobStore.clear();
    localStorage.clear();
    if (!('createObjectURL' in URL)) {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: vi.fn(() => `blob:test-${Math.random()}`),
      });
    } else {
      vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test-${Math.random()}`);
    }

    if (!('revokeObjectURL' in URL)) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: vi.fn(),
      });
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    }
  });

  it('shows quota banner while blob attachment write still succeeds', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    render(
      <MemoryRouter>
        <LabPage course={phy132Course} lab={snellsLawLab} />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: /snell's law/i });
    useLabStore.getState().setImage('part4Image', new File([new Uint8Array(2048)], 'quota-test.png', { type: 'image/png' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    const imageState = useLabStore.getState().images.part4Image;
    expect(imageState).toBeDefined();
    expect(imageState?.persisted).toBe(true);
    expect(blobStore.has(imageState?.idbKey ?? '')).toBe(true);
  });
});
