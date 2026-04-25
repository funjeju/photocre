// ResultViewer가 mount될 때 등록하고, 패널 버튼에서 호출합니다
export const downloadRef: { fn: (() => void) | null } = { fn: null };
