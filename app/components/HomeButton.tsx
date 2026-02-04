"use client";

type Props = {
  lang?: "zh" | "en";
};

export default function HomeButton({ lang = "zh" }: Props) {
  const text = lang === "en" ? "Back to Home" : "回到首页";

  return (
    <div style={{ marginTop: 24 }}>
      <a
        href={`/?lang=${lang}`}
        style={{
          display: "inline-block",
          border: "1px solid #ddd",
          padding: "10px 16px",
          borderRadius: 12,
          textDecoration: "none",
          color: "#111",
        }}
      >
        ← {text}
      </a>
    </div>
  );
}
