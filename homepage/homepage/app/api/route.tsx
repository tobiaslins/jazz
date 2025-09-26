import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { JazzLogo } from "@/components/forMdx";
import { imageSize, loadManropeLocalFont } from "@/lib/docMdxContent";

export const runtime = "edge"; // important for ImageResponse

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") ?? "Jazz Docs";
  const framework = searchParams.get("framework") ?? "";
  const topic = searchParams.get("topic") ?? "";
  const subtopic = searchParams.get("subtopic") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "77px",
        }}
      >
        <div style={{ fontSize: "4rem" }}>{title}</div>

        <div
          style={{
            position: "absolute",
            right: 15,
            top: 10,
            fontSize: "2rem",
            color: "#888",
          }}
        >
          {framework} {topic && `/ ${topic}`} {subtopic && `/ ${subtopic}`}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 35,
            right: 45,
          }}
        >
          <JazzLogo />
        </div>
      </div>
    ),
    {
      ...imageSize,
      fonts: [
        {
          name: "Manrope",
          data: await loadManropeLocalFont(),
          style: "normal",
          weight: 600,
        },
      ],
    }
  );
}
