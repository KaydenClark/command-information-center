import test from "node:test";
import assert from "node:assert/strict";
import { resolveSpotifyAtlasUrl } from "../src/atlasUrl.js";

test("Spotify Atlas URL uses configured value when present", () => {
  assert.equal(
    resolveSpotifyAtlasUrl(" https://atlas.example/dashboard.html ", {
      protocol: "http:",
      hostname: "localhost"
    }),
    "https://atlas.example/dashboard.html"
  );
});

test("Spotify Atlas URL derives from browser host on port 8899 by default", () => {
  assert.equal(
    resolveSpotifyAtlasUrl("", {
      protocol: "http:",
      hostname: "kayden-mini.local"
    }),
    "http://kayden-mini.local:8899/dashboard.html"
  );
});
