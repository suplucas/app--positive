import { describe, it, expect } from "vitest";
import {
  MOCK_POST_PHOTOS,
  MOCK_PROFILE_PHOTO,
  photoFor,
  photoAt,
} from "./postPhotos";

describe("postPhotos", () => {
  it("expõe as fotos mock de assets/posts", () => {
    expect(MOCK_POST_PHOTOS).toHaveLength(4);
    expect(MOCK_PROFILE_PHOTO).toBe(MOCK_POST_PHOTOS[1]);
  });

  it("photoFor usa photoIndex quando presente", () => {
    expect(photoFor({ photoIndex: 0 }, 99)).toBe(MOCK_POST_PHOTOS[0]);
    expect(photoFor({ photoIndex: 3 }, 3)).toBe(MOCK_POST_PHOTOS[3]);
  });

  it("photoFor cai na regra por índice sem photoIndex", () => {
    // feed real: índice par → foto 0, ímpar → foto 1
    expect(photoFor({}, 0)).toBe(MOCK_POST_PHOTOS[0]);
    expect(photoFor({}, 1)).toBe(MOCK_POST_PHOTOS[1]);
    expect(photoFor({}, 2)).toBe(MOCK_POST_PHOTOS[0]);
    expect(photoFor({}, 3)).toBe(MOCK_POST_PHOTOS[1]);
  });

  it("photoAt usa o índice informado", () => {
    expect(photoAt(0)).toBe(MOCK_POST_PHOTOS[0]);
    expect(photoAt(1)).toBe(MOCK_POST_PHOTOS[1]);
    expect(photoAt(2)).toBe(MOCK_POST_PHOTOS[2]);
    expect(photoAt(100)).toBe(MOCK_POST_PHOTOS[0]); // wrap-around
  });
});
