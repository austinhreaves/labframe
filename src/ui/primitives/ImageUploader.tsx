import type { FieldValue } from '@/domain/schema';

import { Field } from '@/ui/primitives/Field';
import { FileDropzone } from '@/ui/primitives/FileDropzone';

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
      <FileDropzone
        id={imageId}
        value={image}
        accept="image/*"
        onFileChange={onImageChange}
      />
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
