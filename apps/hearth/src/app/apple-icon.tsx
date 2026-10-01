import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fbf8f3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24">
          <path
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
            fill="#d9763a"
          />
          <path
            d="M12 21a4.5 4.5 0 0 1-4.5-4.5c0-1.8.9-2.9 1.7-3.9.5 1 1.3 1.6 1.3 1.6-.3-2.2.3-4.4 1.5-6.2 2 1.5 4.5 4.2 4.5 8A4.5 4.5 0 0 1 12 21z"
            fill="#e3be8f"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
