import { useRef } from "react";

export function useImagePicker(onImage) {
  const ref = useRef();
  const open = () => ref.current?.click();
  const input = (
    <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
      onChange={(e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => onImage(r.result);
        r.readAsDataURL(f);
        e.target.value = "";
      }} />
  );
  return [open, input];
}
