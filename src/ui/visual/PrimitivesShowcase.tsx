import { useEffect, useState } from 'react';

import { Checkbox } from '@/ui/primitives/Checkbox';
import { FileDropzone } from '@/ui/primitives/FileDropzone';
import { Progress } from '@/ui/primitives/Progress';
import { Select } from '@/ui/primitives/Select';

const FIT_OPTIONS = [
  { value: '', label: 'No fit' },
  { value: 'linear', label: 'Linear' },
  { value: 'quadratic', label: 'Quadratic' },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

type ShowcaseTheme = 'light' | 'dark';

function applyTheme(theme: ShowcaseTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function PrimitivesShowcase() {
  const params = new URLSearchParams(window.location.search);
  const initialTheme: ShowcaseTheme = params.get('theme') === 'dark' ? 'dark' : 'light';

  const [theme, setTheme] = useState<ShowcaseTheme>(initialTheme);
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(true);
  const [select1, setSelect1] = useState('linear');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <main className="primitives-showcase">
      <header className="primitives-showcase-header">
        <h1>Primitives showcase</h1>
        <div className="primitives-showcase-themes">
          <button type="button" onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
            Light
          </button>
          <button type="button" onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
            Dark
          </button>
        </div>
      </header>

      <section data-testid="showcase-progress">
        <h2>Progress</h2>
        <div className="primitives-showcase-row">
          <div data-testid="progress-empty">
            <Progress value={0} max={12} label="Progress: 0/12" size="sm" />
          </div>
          <div data-testid="progress-half">
            <Progress value={6} max={12} label="Progress: 6/12" size="sm" />
          </div>
          <div data-testid="progress-full">
            <Progress value={12} max={12} label="Progress: 12/12" size="sm" />
          </div>
          <div data-testid="progress-md">
            <Progress value={4} max={10} label="Progress: 4/10" size="md" />
          </div>
        </div>
      </section>

      <section data-testid="showcase-checkbox">
        <h2>Checkbox</h2>
        <div className="primitives-showcase-row">
          <div data-testid="checkbox-default">
            <Checkbox checked={false} onChange={() => {}}>
              Unchecked
            </Checkbox>
          </div>
          <div data-testid="checkbox-checked">
            <Checkbox checked={true} onChange={() => {}}>
              Checked
            </Checkbox>
          </div>
          <div data-testid="checkbox-interactive">
            <Checkbox checked={checkbox1} onChange={setCheckbox1}>
              Interactive (toggles)
            </Checkbox>
          </div>
          <div data-testid="checkbox-prechecked">
            <Checkbox checked={checkbox2} onChange={setCheckbox2}>
              Prechecked interactive
            </Checkbox>
          </div>
          <div data-testid="checkbox-invalid">
            <Checkbox checked={false} onChange={() => {}} invalid>
              Invalid (required)
            </Checkbox>
          </div>
          <div data-testid="checkbox-disabled">
            <Checkbox checked={false} onChange={() => {}} disabled>
              Disabled unchecked
            </Checkbox>
          </div>
          <div data-testid="checkbox-disabled-checked">
            <Checkbox checked={true} onChange={() => {}} disabled>
              Disabled checked
            </Checkbox>
          </div>
        </div>
      </section>

      <section data-testid="showcase-select">
        <h2>Select</h2>
        <div className="primitives-showcase-row">
          <div data-testid="select-default">
            <Select
              value={select1}
              onChange={setSelect1}
              options={FIT_OPTIONS}
              size="md"
              aria-label="Fit model"
            />
          </div>
          <div data-testid="select-sm">
            <Select
              value="light"
              onChange={() => {}}
              options={THEME_OPTIONS}
              size="sm"
              aria-label="Theme"
            />
          </div>
          <div data-testid="select-invalid">
            <Select
              value=""
              onChange={() => {}}
              options={FIT_OPTIONS}
              invalid
              placeholder="Pick one"
              aria-label="Required fit model"
            />
          </div>
          <div data-testid="select-disabled">
            <Select
              value="linear"
              onChange={() => {}}
              options={FIT_OPTIONS}
              disabled
              aria-label="Disabled fit model"
            />
          </div>
        </div>
      </section>

      <section data-testid="showcase-file-dropzone">
        <h2>FileDropzone</h2>
        <div className="primitives-showcase-grid">
          <div data-testid="dropzone-empty">
            <FileDropzone value={undefined} onFileChange={() => {}} />
          </div>
          <div data-testid="dropzone-with-value">
            <FileDropzone
              value={{
                fileName: 'sample.png',
                objectUrl:
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="%233b82f6"/><text x="50%25" y="50%25" font-family="sans-serif" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">sample.png</text></svg>',
                sizeBytes: 24576,
              }}
              onFileChange={() => {}}
            />
          </div>
          <div data-testid="dropzone-disabled">
            <FileDropzone value={undefined} onFileChange={() => {}} disabled />
          </div>
        </div>
      </section>
    </main>
  );
}
