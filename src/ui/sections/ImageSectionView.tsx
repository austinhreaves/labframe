import type { ImageSection } from '@/domain/schema';
import { useLabStore } from '@/state/labStore';
import { ImageUploader } from '@/ui/primitives/ImageUploader';

type Props = {
  section: ImageSection;
};

export function ImageSectionView({ section }: Props) {
  const image = useLabStore((state) => state.images[section.imageId]);
  const caption = useLabStore((state) => state.fields[section.captionFieldId]);
  const setImage = useLabStore((state) => state.setImage);
  const setField = useLabStore((state) => state.setField);

  return (
    <section className="section">
      <ImageUploader
        imageId={section.imageId}
        captionFieldId={section.captionFieldId}
        image={image}
        caption={caption}
        onImageChange={(file) => setImage(section.imageId, file)}
        onCaptionChange={(value) => setField(section.captionFieldId, value)}
      />
    </section>
  );
}
