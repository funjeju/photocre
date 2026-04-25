export const en = {
  app: {
    name: 'Framelab',
    tagline: 'Your photos, your aesthetic, your series.',
  },
  nav: {
    studio: 'Studio',
    apply: 'Apply',
    templates: 'Templates',
    history: 'History',
  },
  auth: {
    loginTitle: 'Your aesthetic,\none click at a time,\nforever consistent.',
    loginDescription:
      'Framelab lets you combine frames, backgrounds, styles, and text to create beautiful images — then save them as templates to apply the same look to future photos in seconds.',
    loginButton: 'Continue with Google',
    loginError: 'Login failed. Please try again.',
    loggingIn: 'Signing in...',
  },
  credits: {
    badge: '{{count}} credits',
    insufficient: 'Insufficient credits.',
    dailyReset: 'Credits reset daily at midnight KST.',
  },
  studio: {
    title: 'Studio',
    uploadPrompt: 'Drag & drop or click to upload',
    uploadHint: 'JPG, PNG, WebP, HEIC · Max 10MB',
    uploadSizeError: 'File size exceeds 10MB.',
    uploadFormatError: 'Unsupported file format.',
    crop: {
      title: 'Crop',
      confirm: 'Confirm',
      cancel: 'Cancel',
    },
    frame: {
      title: 'Frame',
      seeAll: 'See all',
    },
    background: {
      title: 'Background',
      seeAll: 'See all',
      customUpload: 'Upload',
    },
    style: {
      title: 'Style',
      seeAll: 'See all',
    },
    text: {
      title: 'Text',
      placeholder: 'Add text (optional)',
      fontFamily: 'Font',
      fontSize: 'Size',
      color: 'Color',
      alignment: 'Align',
    },
    generate: {
      button: 'Generate',
      generating: 'Generating...',
      creditsRequired: '1 credit will be used.',
    },
    result: {
      download: 'Download',
      regenerate: 'Regenerate',
      saveTemplate: 'Save as Template',
      share: 'Share',
      synthIdNotice: 'AI-generated image.',
    },
  },
  apply: {
    title: 'Apply',
    selectTemplate: 'Select a template',
    uploadPhotos: 'Upload photos (max 20)',
    generateAll: 'Generate All',
    downloadAll: 'Download All (ZIP)',
    status: {
      waiting: 'Waiting',
      cropping: 'Cropping',
      generating: 'Generating',
      done: 'Done',
      failed: 'Failed',
    },
  },
  templates: {
    title: 'Templates',
    empty: 'No saved templates yet.',
    emptyHint: 'Generate an image in Studio and save it as a template.',
    rename: 'Rename',
    delete: 'Delete',
    setDefault: 'Set as default',
    usedCount: 'Used {{count}} times',
    saveDialog: {
      title: 'Save as Template',
      namePlaceholder: 'Template name',
      confirm: 'Save',
      cancel: 'Cancel',
    },
  },
  history: {
    title: 'History',
    empty: 'No generation history yet.',
    emptyHint: 'Your generated images will appear here.',
  },
  errors: {
    unknown: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    unauthorized: 'Please sign in to continue.',
  },
} as const;

export type EnStrings = typeof en;
