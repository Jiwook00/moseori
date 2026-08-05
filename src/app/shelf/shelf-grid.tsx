import Image from "next/image";
import Link from "next/link";
import { CELL_WIDTH, coverBox } from "@/lib/books/dimensions";
import { authorName } from "@/lib/books/author";
import { coverPublicUrl } from "@/lib/cover-path";

/**
 * 표지 격자 (기획서 §5 · design.md §표지 격자).
 *
 * **표지를 큼지막하게, 최대 4열로.** 책장은 표지를 보러 오는 화면이라 상세·밑줄의
 * 720 읽기 폭에 묶지 않고 화면 폭을 씁니다. 열은 **최대 4** — 넓은 화면에서는 4권이
 * 폭을 채우도록 표지가 커지고, 좁아지면 2열·1열로 줄며 표지도 함께 작아집니다.
 *
 * ```
 * grid-cols-1  min-[440px]:grid-cols-2  min-[900px]:grid-cols-4
 * ```
 *
 * **표지는 셀(칸) 폭에 비례해 커집니다.** 셀이 유동(`1fr`)이라 열 수가 줄면 셀이
 * 넓어지고 표지도 커집니다. 판형의 크기 차이는 **셀 폭 대비 비율**로 살립니다 —
 * `coverBox`가 148px 격자에서 낸 폭을 셀의 몇 %로 쓸지로 환산합니다. 그래서
 * 사진집은 셀을 꽉, 문고본은 좁게 차지하고, 세로 길이도 판형대로 들쭉날쭉합니다.
 *
 * **아래 기준선 정렬.** 셀을 같은 높이로 늘리고(`grid` 기본 stretch) 표지를 칸 아래에
 * 붙여, 한 줄의 표지들이 바닥을 맞춰 선반에 꽂힌 것처럼 보입니다. 격자는 정연하고
 * 불규칙은 셀 안에서만 일어납니다.
 *
 * 컨테이너 최대 폭(1600)으로 아주 넓은 모니터에서 표지가 과하게 커지는 걸 막습니다.
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
    <ul className="grid max-w-[1600px] grid-cols-1 gap-x-10 gap-y-14 min-[440px]:grid-cols-2 min-[900px]:grid-cols-4">
      {items.map((item) => {
        const { book } = item;
        const box = coverBox(book);
        // 판형의 크기 차이를 셀 폭 대비 비율로. 148px 격자 기준 폭이 셀의 몇 %인지.
        const widthPct = `${(box.width / CELL_WIDTH) * 100}%`;
        const author = authorName(book.author);

        return (
          <li key={item.id} className="flex flex-col">
            <Link href={`/shelf/${item.id}`} className="flex flex-1 flex-col">
              {/* 셀 아래에 표지를 붙여 한 줄의 바닥을 맞춥니다 (아래 기준선). */}
              <span className="flex flex-1 items-end justify-start">
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
                  /*
                   * 표지를 못 받은 책. 판형 비율의 빈 자리를 그대로 둡니다 —
                   * 제목을 적어 넣으면 표지인 척하게 됩니다.
                   */
                  <span
                    className="border-line bg-card block border"
                    style={{
                      width: widthPct,
                      aspectRatio: box.width / box.height,
                    }}
                  />
                )}
              </span>

              <span className="mt-4 block text-[13px] leading-[1.45]">
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
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
