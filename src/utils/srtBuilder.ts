import { SubtitleBlock } from '../types';

export const buildSRT = (blocks: SubtitleBlock[]): string => {
  let srtString = '';
  
  for (const block of blocks) {
    srtString += `${block.id}\n`;
    srtString += `${block.startTime} --> ${block.endTime}\n`;
    srtString += `${block.text}\n\n`; // Adds the required blank line after each block
  }
  
  return srtString;
};
