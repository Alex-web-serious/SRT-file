export const isAllowedAudioFormat = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['mp3', 'm4a', 'aac'].includes(ext ?? '');
};

export const isWavFile = (filename: string): boolean => {
  return filename.split('.').pop()?.toLowerCase() === 'wav';
};
