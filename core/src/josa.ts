/** 한글 조사 자동 선택 유틸 */

/**
 * 단어의 마지막 한글 글자 받침 유무로 조사를 고른다.
 * 예: josa('현지', '이', '가') → '가', josa('길동', '이', '가') → '이'
 * 한글이 아닌 글자로 끝나면(영문 닉네임 등) 받침 없음 취급.
 */
export function josa(word: string, withBatchim: string, without: string): string {
  const ch = word.replace(/[^가-힣]/g, '').slice(-1);
  if (!ch) return without;
  const hasBatchim = (ch.charCodeAt(0) - 0xac00) % 28 > 0;
  return hasBatchim ? withBatchim : without;
}
