import type { FieldValue } from '@/domain/schema';

import { Field } from '@/ui/primitives/Field';

type ImageUploaderProps = {
  imageId: string;
  captionFieldId: string;
  image: { fileName: string; objectUrl: string } | undefined;
  caption: FieldValue | undefined;
  onImageChange: (file: File | null) => void;
  onCaptionChange: (value: FieldValue) => void;
};

export function ImageUploader({
  imageId,
  captionFieldId,
  image,
  caption,
  onImageChange,
  onCaptionChange,
}: ImageUploaderProps) {
  return (
    <section className="image-uploader">
      <label htmlFor={imageId}>
        Upload image
        <input
          id={imageId}
          type="file"
          accept="image/*"
          onChange={(event) => onImageChange(event.currentTarget.files?.[0] ?? null)}
        />
      </label>
      {image ? (
        <figure>
          <img src={image.objectUrl} alt={image.fileName} />
          <figcaption>{image.fileName}</figcaption>
        </figure>
      ) : null}
      <Field
        id={captionFieldId}
        label="Caption"
        value={caption}
        multiline
        rows={3}
        onChange={onCaptionChange}
      />
    </section>
  );
}
