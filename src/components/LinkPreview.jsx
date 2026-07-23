import { useEffect, useState } from "react";
import { T } from "../theme";

export function LinkPreview({ url }) {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => { if (on && d.status === "success") setMeta(d.data); })
      .catch(() => {})
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [url]);
  const domain = url.replace(/^https?:\/\//, "").split("/")[0];
  const img = meta?.image?.url || meta?.logo?.url;
  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <div className="shimmer" style={{ height: 84 }} />
        <div style={{ padding: "10px 14px 12px" }}>
          <div className="shimmer" style={{ height: 12, borderRadius: 6, width: "80%" }} />
          <div className="shimmer" style={{ height: 9, borderRadius: 5, width: "45%", marginTop: 7 }} />
        </div>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none" }}>
      {img ? (
        <img src={img} alt="" style={{ width: "100%", display: "block", maxHeight: 130, objectFit: "cover" }} />
      ) : (
        <div style={{ height: 64, display: "grid", placeItems: "center", background: T.skySoft }}>
          <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
        </div>
      )}
      <div style={{ padding: "10px 14px 12px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {meta?.title || domain}
        </div>
        <div style={{ fontSize: 10.5, color: T.ink3, marginTop: 3 }}>{domain}</div>
      </div>
    </a>
  );
}
