export const ko = {
  app: {
    name: 'Framelab',
    tagline: '사진을 감성으로, 시리즈로.',
  },
  nav: {
    studio: 'Studio',
    cover: 'Cover',
    magazine: 'Magazine',
    apply: 'Apply',
    templates: 'Templates',
    history: 'History',
  },
  auth: {
    loginTitle: '당신만의 감성을\n한 번의 클릭으로,\n계속 이어가세요.',
    loginDescription:
      'Framelab은 프레임·배경·스타일·텍스트를 조합해 감성 이미지를 만들고,\n템플릿으로 저장해 다음 사진에도 동일한 느낌을 빠르게 적용할 수 있는 AI 이미지 스튜디오입니다.',
    loginButton: 'Google로 시작하기',
    loginError: '로그인에 실패했습니다. 다시 시도해주세요.',
    loggingIn: '로그인 중...',
  },
  credits: {
    badge: '{{count}}크레딧',
    insufficient: '크레딧이 부족합니다.',
    dailyReset: '크레딧은 매일 00:00 KST에 초기화됩니다.',
  },
  studio: {
    title: 'Studio',
    uploadPrompt: '사진을 드래그하거나 클릭해서 업로드',
    uploadHint: 'JPG, PNG, WebP, HEIC · 최대 10MB',
    uploadSizeError: '파일 크기가 10MB를 초과합니다.',
    uploadFormatError: '지원하지 않는 파일 형식입니다.',
    crop: {
      title: '크롭',
      confirm: '확인',
      cancel: '취소',
    },
    frame: {
      title: '프레임',
      seeAll: '전체보기',
    },
    background: {
      title: '배경',
      seeAll: '전체보기',
      customUpload: '업로드',
    },
    style: {
      title: '스타일',
      seeAll: '전체보기',
    },
    ai: {
      title: 'AI 스타일 변환',
      credit: '크레딧 1',
      prompt: {
        label: '추가 요구사항 (선택)',
        placeholder: '예: 배경을 저녁노을로, 표정을 웃게, 조명을 따뜻하게',
      },
    },
    decorate: {
      title: '꾸미기',
      lockedHint: 'AI 변환 후 활성화',
    },
    text: {
      title: '텍스트',
      placeholder: '텍스트를 입력하세요 (선택사항)',
      fontFamily: '폰트',
      fontSize: '크기',
      color: '색상',
      alignment: '정렬',
    },
    generate: {
      button: 'AI 변환하기',
      generating: 'AI 변환 중...',
      noAI: '원본 그대로 사용',
      creditsRequired: '크레딧 1개가 사용됩니다.',
    },
    result: {
      download: '다운로드',
      regenerate: '다시 생성',
      saveTemplate: '템플릿으로 저장',
      share: '공유',
      synthIdNotice: 'AI로 생성된 이미지입니다.',
    },
    mockup: {
      title: '굿즈 미리보기',
      note: '이미지로 만들 수 있는 굿즈 시뮬레이션 (AI 비용 없음)',
      tshirt:     '티셔츠',
      mug:        '머그컵',
      cushion:    '쿠션',
      totebag:    '에코백',
      griptok:    '그립톡',
      minicanvas: '미니캔버스',
    },
  },
  apply: {
    title: 'Apply',
    selectTemplate: '템플릿을 선택해주세요',
    uploadPhotos: '사진을 업로드하세요 (최대 20장)',
    generateAll: '전체 생성',
    downloadAll: '전체 ZIP 다운로드',
    status: {
      waiting: '대기 중',
      cropping: '크롭 중',
      generating: '생성 중',
      done: '완료',
      failed: '실패',
    },
  },
  templates: {
    title: 'Templates',
    empty: '저장된 템플릿이 없습니다.',
    emptyHint: 'Studio에서 이미지를 생성하고 템플릿으로 저장해보세요.',
    rename: '이름 변경',
    delete: '삭제',
    setDefault: '기본 설정',
    usedCount: '{{count}}회 사용',
    saveDialog: {
      title: '템플릿으로 저장',
      namePlaceholder: '템플릿 이름',
      confirm: '저장',
      cancel: '취소',
    },
  },
  history: {
    title: 'History',
    empty: '생성 히스토리가 없습니다.',
    emptyHint: 'Studio에서 이미지를 생성하면 여기에 표시됩니다.',
  },
  errors: {
    unknown: '오류가 발생했습니다. 다시 시도해주세요.',
    network: '네트워크 오류가 발생했습니다.',
    unauthorized: '로그인이 필요합니다.',
  },
} as const;

export type KoStrings = typeof ko;
