export type SubtitleBlock = {
  id: number;
  startTime: string;  // format: "00:00:01,000"
  endTime: string;    // format: "00:00:03,000"
  text: string;
};

export type SRTProject = {
  projectId: string;
  projectName: string;
  blocks: SubtitleBlock[];
  createdAt: number;
  updatedAt: number;
};
