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
 * **아래 기준선 정렬 (subgrid).** 한 줄은 표지 행·글자 행 두 트랙을 공유합니다
 * (`grid-rows-subgrid`). 표지 행 높이는 그 줄에서 가장 큰 표지가 정하고 나머지는
 * 바닥에 붙어(`self-end`) 선반에 꽂힌 것처럼 보입니다. 글자 행은 모두 같은 높이에서
 * 시작해 제목선이 맞습니다 — 표지 아래 글자 수가 책마다 달라도 밀리지 않습니다.
 * 표지 위쪽은 판형대로 자유롭게 들쭉날쭉합니다.
 *
 * `li`는 `contents`로 상자를 지워 `Link`가 격자 아이템이 되고, `Link`가 두 행을
 * 걸칩니다(`row-span-2`). 줄 사이 간격은 부모 `gap-y`(넉넉히), 표지와 글자 사이는
 * `Link`가 제 `gap-y`로 좁게 덮어씁니다.
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
          <li key={item.id} className="contents">
            <Link
              href={`/shelf/${item.id}`}
              className="grid grid-rows-subgrid row-span-2 gap-y-4"
            >
              {/*
               * 표지 행: 줄에서 가장 큰 표지가 높이를 정하고, 나머지는 바닥에 붙습니다.
               * span은 셀 폭을 꽉 채워야 합니다 — 표지 `widthPct`가 이 폭의 %라서,
               * 좁히면 표지도 같이 작아집니다. `self-end`로 세로만 바닥 정렬합니다.
               */}
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

              {/* 글자 행: 모두 같은 높이에서 시작해 제목선이 맞습니다. */}
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
