import Image from "next/image";
import Link from "next/link";
import { CELL_WIDTH, SLOT_HEIGHT, coverBox } from "@/lib/books/dimensions";
import { authorName } from "@/lib/books/author";
import { coverPublicUrl } from "@/lib/cover-path";

/**
 * 표지 격자 (기획서 §5 · design.md §표지 격자).
 *
 * ```
 * grid-template-columns: repeat(4, 148px);
 * column-gap: 24px;
 * row-gap: 36px;
 * ```
 *
 * 셀 안에 176px 슬롯을 두고 **표지를 아래 기준선에 맞춰** 놓습니다. 문고본은 낮게,
 * 사진집은 높게 — 아래를 맞춰 늘어서면 실제 선반에 꽂힌 책처럼 보입니다.
 * **격자는 고정이고 불규칙은 셀 안에서만 일어납니다.**
 *
 * 슬롯 176px은 **최소 높이**입니다. `높이 = size_height × 0.7`을 그대로 쓰면
 * 사진집(257mm)이 180px, 큰 판형은 207px까지 나와 176px을 넘습니다. 넘는 책을
 * 176px로 깎으면 판형 차이가 뭉개지므로 위로 넘치게 두고, 행 간격 36px이 받습니다.
 * (design.md의 두 값이 부딪히는 자리라 물어보고 결정했습니다.)
 *
 * 표지 아래 12px → 제목 → 2px → 저자 → 3px → 밑줄 개수.
 *
 * **좁은 화면에서는 열 수만 줄입니다.** 4열(148×4 + 24×3 = 664px)이 컨테이너 안쪽
 * 폭을 정확히 채우므로 720px 아래에서는 넘칩니다. 셀 148px과 간격 24 / 36px은
 * 어디서도 바꾸지 않습니다 — 셀을 줄이면 판형 비교가 무의미해집니다.
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
    <ul className="grid grid-cols-[repeat(2,148px)] gap-x-6 gap-y-9 min-[532px]:grid-cols-[repeat(3,148px)] min-[720px]:grid-cols-[repeat(4,148px)]">
      {items.map((item) => {
        const { book } = item;
        const cover = coverBox(book);
        const author = authorName(book.author);

        return (
          <li key={item.id} style={{ width: CELL_WIDTH }}>
            <Link href={`/shelf/${item.id}`} className="block">
              {/* 아래 기준선 정렬. 슬롯보다 큰 표지는 위로 넘칩니다. */}
              <span
                className="flex items-end justify-start"
                style={{ minHeight: SLOT_HEIGHT }}
              >
                {book.cover_path ? (
                  <Image
                    src={coverPublicUrl(book.cover_path)}
                    alt=""
                    width={cover.width}
                    height={cover.height}
                    style={{ width: cover.width, height: cover.height }}
                    className="block"
                  />
                ) : (
                  /*
                   * 표지를 못 받은 책. 판형 비율의 빈 자리를 그대로 둡니다 —
                   * 제목을 적어 넣으면 표지인 척하게 됩니다.
                   */
                  <span
                    className="border-line bg-card block border"
                    style={{ width: cover.width, height: cover.height }}
                  />
                )}
              </span>

              <span className="mt-3 block text-[11.5px] leading-[1.45]">
                {book.title}
              </span>
              {author && (
                <span className="text-sub mt-[2px] block text-[10.5px] leading-[1.4]">
                  {author}
                </span>
              )}
              {item.passageCount > 0 && (
                <span className="text-sub mt-[3px] block text-[10.5px] leading-[1.4]">
                  밑줄 {item.passageCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
