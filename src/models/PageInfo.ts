export interface PageInfo {
    number: string
    label: string
    isFound: boolean
    imagePath?: string
}

export const pageInfoList: Record<string, PageInfo> = {
  "n/a": {
    number: "n/a",
    isFound: false,
    label: "Not from Manual",
  },
  ...Object.fromEntries(
    Array.from({ length: 56 }, (_, i) => {
      const num = i;
      return [
        num,
        {
          number: `${num}`,
          label: `Page ${num}`,
          isFound: false,
          imagePath: `/manual/page (${num+1}).jpg`,
        },
      ];
    })
  ),
}

export function updatePageInfoList(foundPages: Record<string, boolean>) {
  for (const pageInfoNumber in pageInfoList) {
    const pageInfo = pageInfoList[pageInfoNumber];
    pageInfo.isFound = foundPages[pageInfoNumber];
  }
  console.log("Synced found pages", foundPages);
}