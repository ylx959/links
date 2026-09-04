/**
 * 第一屏唯一一個有顏色的東西。
 *
 * 彩蛋要有人找得到才叫彩蛋，但立一個「↓ Scroll」就等於自己把答案講完了。
 * 這裡放的是下面那行手寫字的句點 —— 同一個藍、同一個大小，先出現在這裡等人按。
 * 用 <a href> 而不是 button：鍵盤 Tab 得到、右鍵開得了、JS 掛了也還能捲。
 */
export function ScrollClue({ targetId, label }: { targetId: string; label: string }) {
  return (
    <a
      href={`#${targetId}`}
      aria-label={label}
      // 點擊區 44px（觸控最小值），看得見的只有中間那 7px。
      className="group absolute inset-x-0 bottom-4 mx-auto flex size-11 items-center justify-center rounded-full"
    >
      <span className="scroll-cue size-[7px] rounded-full bg-accent transition-transform duration-500 ease-out group-hover:scale-[1.6]" />
    </a>
  )
}
