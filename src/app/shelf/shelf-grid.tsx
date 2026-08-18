import Image from "next/image";
import Link from "next/link";
import { CELL_WIDTH, coverBox } from "@/lib/books/dimensions";
import { authorName } from "@/lib/books/author";
import { coverPublicUrl } from "@/lib/cover-path";

/**
 * 표지 격자 (기획서 §5 · design.md §표지 격자). 화면 폭을 쓰는 갤러리, 최대 4열.
 *
 * 표지는 셀 폭에 비례해 커지고, 판형의 크기 차이는 셀 폭 대비 비율(`widthPct`)로
 * 살립니다 — 사진집은 셀을 꽉, 문고본은 좁게 차지합니다.
 *
 * subgrid로 표지 행·글자 행 두 트랙을 공유해, 표지는 바닥에 붙어 정렬되고(`self-end`,
 * 선반에 꽂힌 듯) 글자는 같은 높이에서 시작합니다. `li`는 `contents`로 상자를 지워
 * `Link`가 두 행을 걸치는(`row-span-2`) 격자 아이템이 됩니다.
 */

export type ShelfBook = {
  id: string;
  passageCount: number;
  book: {
    title: string;
    author: string | null;
    cover_path: string | null;
    cover_width: number | null;
    cover_height: number | null;
    size_width: number | null;
    size_height: number | null;
  };
};

export default function ShelfGrid({ items }: { items: ShelfBook[] }) {
  return (
    <ul className="grid max-w-[1600px] grid-cols-2 gap-x-6 gap-y-14 min-[440px]:gap-x-10 min-[900px]:grid-cols-4">
      {items.map((item) => {
        const { book } = item;
        const box = coverBox(book);
        // 148px 격자 기준 폭을 셀 폭 대비 %로 환산 — 열이 줄어 셀이 넓어지면 표지도 커집니다.
        const widthPct = `${(box.width / CELL_WIDTH) * 100}%`;
        const author = authorName(book.author);

        return (
          <li key={item.id} className="contents">
            <Link
              href={`/shelf/${item.id}`}
              className="grid grid-rows-subgrid row-span-2 gap-y-4"
            >
              {/* 표지 행. span은 셀 폭을 꽉 채우고(widthPct의 기준), self-end로 바닥 정렬. */}
              <span className="block w-full self-end">
                {book.cover_path ? (
                  <Image
                    src={coverPublicUrl(book.cover_path)}
                    alt=""
                    width={box.width}
                    height={box.height}
                    style={{ width: widthPct }}
                    className="block h-auto"
                  />
                ) : (
                  // 표지를 못 받은 책. 판형 비율의 빈 자리를 그대로 둡니다.
                  <span
                    className="border-line bg-card block border"
                    style={{
                      width: widthPct,
                      aspectRatio: box.width / box.height,
                    }}
                  />
                )}
              </span>

              <span className="block">
                <span className="block text-[13px] leading-[1.45]">
                  {book.title}
                </span>
                {author && (
                  <span className="text-sub mt-[3px] block text-[11.5px] leading-[1.4]">
                    {author}
                  </span>
                )}
                {item.passageCount > 0 && (
                  <span className="text-sub mt-[3px] block text-[11.5px] leading-[1.4]">
                    밑줄 {item.passageCount}
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
