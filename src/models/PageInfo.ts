export interface PageInfo {
    number: string
    label: string
    imagePath?: string
}

export const pageInfoList: Record<string, PageInfo> = {
  "n/a": {
    number: "n/a",
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
          imagePath: `/manual/page (${num+1}).jpg`,
        },
      ];
    })
  ),
}