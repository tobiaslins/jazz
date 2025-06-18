import { ImageDefinition, type Loaded } from "jazz-tools";
import {
  type Ref,
  defineComponent,
  h,
  onUnmounted,
  ref,
  toRef,
  watch,
} from "vue";

interface ImageState {
  src?: string;
  res?: `${number}x${number}` | "placeholder";
  originalSize?: readonly [number, number];
}

function useProgressiveImg(
  image: Ref<Loaded<typeof ImageDefinition> | null | undefined>,
  maxWidth?: number,
  targetWidth?: number,
) {
  const current = ref<ImageState>({});

  let cleanup: (() => void) | undefined;
  const unsubscribe = watch(
    () => [image.value?.id, maxWidth],
    () => {
      let lastHighestRes: string | undefined;

      if (!image.value) return;

      const unsub = image.value.subscribe({}, (update) => {
        const highestRes = ImageDefinition.highestResAvailable(update, {
          maxWidth,
          targetWidth,
        });

        if (highestRes) {
          if (highestRes.res !== lastHighestRes) {
            lastHighestRes = highestRes.res;
            const blob = highestRes.stream.toBlob();

            if (blob) {
              const blobURI = URL.createObjectURL(blob);
              current.value = {
                src: blobURI,
                res: highestRes.res,
                originalSize: image.value?.originalSize,
              };

              if (cleanup) cleanup();
              cleanup = () => {
                setTimeout(() => URL.revokeObjectURL(blobURI), 200);
              };
            }
          }
        } else {
          current.value = {
            src: update?.placeholderDataURL,
            res: "placeholder",
            originalSize: image.value?.originalSize,
          };
        }
      });

      return unsub;
    },
  );

  onUnmounted(() => {
    unsubscribe();
    if (cleanup) cleanup();
  });

  return current;
}

export default defineComponent({
  name: "ProgressiveImg",
  props: {
    image: {
      type: Object as () => Loaded<typeof ImageDefinition> | null | undefined,
      required: true,
    },
    maxWidth: {
      type: Number,
      required: false,
    },
  },
  setup(props, { slots }) {
    const current = useProgressiveImg(toRef(props, "image"), props.maxWidth);
    return () =>
      slots.default?.({
        src: current.value.src,
        res: current.value.res,
        originalSize: current.value.originalSize,
      }) ?? null;
  },
});
