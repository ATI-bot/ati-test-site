"use client";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 44, marginBottom: 18 }}>ATI Aesthetic Type Index</h1>

        <div style={{ display: "flex", gap: 22, justifyContent: "center" }}>
          <a
            href="/test?lang=zh&tier=free"
            style={{ textDecoration: "underline", fontSize: 16 }}
          >
            开始测试（中文）
          </a>

          <a
            href="/test?lang=en&tier=free"
            style={{ textDecoration: "underline", fontSize: 16 }}
          >
            Start Test (EN)
          </a>
        </div>

        <div style={{ marginTop: 18, fontSize: 13, color: "#666" }}>
          <a href="/pay?lang=zh" style={{ textDecoration: "underline", marginRight: 12 }}>
            解锁 / 付费
          </a>
          <a href="/pay?lang=en" style={{ textDecoration: "underline" }}>
            Unlock / Pay
          </a>
        </div>
      </div>
    </div>
  );
}
