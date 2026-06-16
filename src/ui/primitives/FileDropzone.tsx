import { useRef, useState, type DragEvent } from 'react';
import { ImagePlus } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileDropzoneProps = {
  id?: string;
  value: { fileName: string; objectUrl: string; sizeBytes?: number } | undefined;
  accept?: string;
  maxBytes?: number;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  label?: string;
};

export function FileDropzone({
  id,
  value,
  accept = 'image/*',
  maxBytes,
  onFileChange,
  disabled,
  label,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    event.preventDefault();
    dragCounter.current += 1;
    if (event.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    event.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    if (disabled) return;
    event.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  const maxLabel = maxBytes ? formatBytes(maxBytes) : '5 MB';

  return (
    <div
      className="file-dropzone"
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
    >
      <label
        htmlFor={id}
        className="file-dropzone-target"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-label="Upload image"
          onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
        />
        {value ? (
          <figure className="file-dropzone-preview">
            <img src={value.objectUrl} alt={value.fileName} />
            <figcaption>
              <span className="file-dropzone-filename">{value.fileName}</span>
              {value.sizeBytes ? (
                <span className="file-dropzone-meta">{formatBytes(value.sizeBytes)}</span>
              ) : null}
            </figcaption>
          </figure>
        ) : (
          <div className="file-dropzone-empty">
            <ImagePlus aria-hidden="true" className="file-dropzone-icon" />
            <p className="file-dropzone-primary">
              {label ?? 'Drop an image here or click to choose'}
            </p>
            <p className="file-dropzone-secondary">PNG, JPG, or HEIC up to {maxLabel}</p>
          </div>
        )}
      </label>
      {value ? (
        <button
          type="button"
          className="file-dropzone-remove"
          onClick={() => onFileChange(null)}
          disabled={disabled}
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}
