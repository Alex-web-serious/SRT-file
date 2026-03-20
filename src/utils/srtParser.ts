import { SubtitleBlock } from '../types';

export const parseSRT = (srtString: string): SubtitleBlock[] => {
  const normalized = srtString.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n\s*\n/);
  const result: SubtitleBlock[] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const idStr = lines[0].trim();
      const timeLine = lines[1].trim();
      const text = lines.slice(2).join('\n').trim();

      const id = parseInt(idStr, 10);
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

      if (timeMatch) {
        result.push({
          id: isNaN(id) ? result.length + 1 : id,
          startTime: timeMatch[1],
          endTime: timeMatch[2],
          text: text,
        });
      }
    }
  }

  return result;
};
