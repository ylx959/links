/** 第一屏以手寫標題的藍色句點提示可捲動；連結在無 JS 時仍可使用。 */
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
