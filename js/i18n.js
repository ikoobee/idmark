/**
 * Lightweight i18n: dictionaries + data-i18n static replacement + ?lang= override.
 */

export const translations = {
  'zh-CN': {
    pageTitle: '证件照加水印 - 身份证/营业执照防护水印工具，本地处理不上传',
    brand: '证件水印卫士',
    heroTitle: '证件照加水印，防盗用必备',
    heroSub: '为身份证、营业执照、房产证等添加"仅用于办理 XX，他用无效"防护水印',
    badgeLocal: '🔒 本地处理',
    badgeNoUpload: '🚫 图片不上传',
    badgeExif: '📍 自动去除位置信息',
    navHow: '使用步骤',
    navFaq: '常见问题',
    uploadTitle: '点击选择、拖拽或 Ctrl+V 粘贴图片',
    uploadHint: '支持 JPG / PNG / WebP，最多 20 张',
    rotate: '旋转 90°',
    downscaled: '部分图片过大，已自动压缩至安全分辨率（不影响加水印效果）',
    purposeLabel: '用途',
    purposePlaceholder: '输入用途，如：办理银行卡',
    dateLabel: '日期',
    textLabel: '水印文字',
    textHint: '按用途自动生成，可直接修改；回车换行',
    resetTpl: '恢复模板文案',
    advTitle: '高级设置',
    advDensity: '水印密度',
    advPosition: '位置',
    posTile: '整体平铺',
    posCenter: '居中',
    posTL: '左上角', posTR: '右上角', posBL: '左下角', posBR: '右下角',
    advColor: '颜色',
    advSize: '字号（长边%）',
    advOpacity: '透明度',
    advStroke: '文字描边（白底扫描件可读）',
    sampleBtn: '用虚拟示例图试用',
    noImageHint: '没有图片？',
    previewHint: '实时预览 · 输出为原图分辨率',
    zipPreparing: '正在打包…',
    zipDone: 'ZIP 已开始下载',
    zipFallback: '打包失败，改为逐张下载',
    generate: '生成水印',
    processing: '处理中…',
    reset: '重置',
    resultsTitle: '处理结果',
    downloadAll: '全部下载',
    download: '下载',
    copy: '复制到剪贴板',
    copied: '已复制到剪贴板，可直接粘贴发送',
    copyFailed: '复制失败，请改用下载',
    copyUnsupported: '当前环境不支持复制，请使用下载',
    fileNameLabel: '文件名',
    errNoFile: '请先添加至少一张图片',
    errNoText: '请输入水印文字',
    errMaxFiles: '最多同时处理 20 张图片',
    errProcess: '处理失败，请换一张图片重试',
    howTitle: '如何给证件加水印？',
    how1Title: '1. 上传证件照片',
    how1Body: '点击、拖拽或直接粘贴截图。图片只在你的浏览器里处理，不会上传到任何服务器。',
    how2Title: '2. 选择用途',
    how2Body: '选择"办理贷款 / 租房 / 入职"等用途，系统自动生成"仅用于办理XX，他用无效"+ 当天日期的水印文案，也可手动修改。',
    how3Title: '3. 下载或复制',
    how3Body: '点击生成后逐张下载，或复制到剪贴板直接粘贴到微信发送。输出的图片已自动去除拍摄位置（GPS）等信息。',
    faqTitle: '常见问题',
    faq1q: '加水印真的能防盗用吗？',
    faq1a: '半透明密铺水印无法完全防止技术性去除，但能显著提高盗用成本，在纠纷中也是重要的举证材料。建议水印覆盖证件关键信息之外的完整画面，并写明具体用途。',
    faq2q: '我的图片会被上传吗？',
    faq2a: '不会。全部处理都在你的浏览器本地完成，关闭页面后数据即消失，我们没有任何服务器接收你的图片。',
    faq3q: '水印文字写什么最安全？',
    faq3a: '推荐"仅用于办理XX（具体用途），他用无效"+ 日期，三行以内。用途越具体，被盗用后的免责效果越好。',
    privacy: '隐私政策',
    terms: '使用条款',
    footerNote: '本工具在您的浏览器本地处理图片，不上传任何数据。',
    langLabel: '语言',
    // Note: don't put "Other (custom)" in this array — the __custom option
    // appended by rebuildPurposes owns that role; otherwise the dropdown
    // shows duplicates and the dictionary entry leaks into watermark text.
    purposes: ['办理贷款', '租房', '入职', '学校报名', '签证办理'],
  },

  en: {
    pageTitle: 'ID Document Watermark - Add "For XX Use Only" Protection Locally',
    brand: 'CertWatermark',
    heroTitle: 'Watermark your ID documents in 30 seconds',
    heroSub: 'Add a "For [purpose] use only" protection watermark to IDs, licenses and certificates',
    badgeLocal: '🔒 100% local',
    badgeNoUpload: '🚫 No upload',
    badgeExif: '📍 GPS stripped',
    navHow: 'How it works',
    navFaq: 'FAQ',
    uploadTitle: 'Click, drag, or paste (Ctrl+V) images',
    uploadHint: 'JPG / PNG / WebP, up to 20 images',
    rotate: 'Rotate 90°',
    downscaled: 'Some images were too large and auto-compressed to a safe resolution',
    purposeLabel: 'Purpose',
    purposePlaceholder: 'e.g. Bank application',
    dateLabel: 'Date',
    textLabel: 'Watermark text',
    textHint: 'Auto-generated from purpose; editable, Enter for new line',
    resetTpl: 'Reset to template',
    advTitle: 'Advanced',
    advDensity: 'Density',
    advPosition: 'Position',
    posTile: 'Tiled', posCenter: 'Center',
    posTL: 'Top left', posTR: 'Top right', posBL: 'Bottom left', posBR: 'Bottom right',
    advColor: 'Color',
    advSize: 'Size (% of long side)',
    advOpacity: 'Opacity',
    advStroke: 'Text stroke (readable on white scans)',
    sampleBtn: 'Try a virtual sample',
    noImageHint: 'No image at hand?',
    previewHint: 'Live preview · output is full resolution',
    zipPreparing: 'Packing…',
    zipDone: 'ZIP download started',
    zipFallback: 'Packing failed, downloading one by one',
    generate: 'Generate',
    processing: 'Processing…',
    reset: 'Reset',
    resultsTitle: 'Results',
    downloadAll: 'Download all',
    download: 'Download',
    copy: 'Copy',
    copied: 'Copied! You can paste it anywhere',
    copyFailed: 'Copy failed, please download instead',
    copyUnsupported: 'Copy not supported here, please download',
    fileNameLabel: 'Filename',
    errNoFile: 'Please add at least one image',
    errNoText: 'Please enter watermark text',
    errMaxFiles: 'Up to 20 images at a time',
    errProcess: 'Failed to process, try another image',
    howTitle: 'How to watermark an ID document',
    how1Title: '1. Upload',
    how1Body: 'Click, drag or paste. Everything is processed locally in your browser — nothing is uploaded.',
    how2Title: '2. Pick a purpose',
    how2Body: 'Choose a purpose and the text "For XX use only" plus today\'s date is generated automatically. You can always edit it.',
    how3Title: '3. Download or copy',
    how3Body: 'Download each result, or copy to clipboard and paste into WeChat/WhatsApp. GPS metadata is stripped automatically.',
    faqTitle: 'FAQ',
    faq1q: 'Does a watermark really prevent misuse?',
    faq1a: 'A semi-transparent tiled watermark cannot stop determined removal, but it raises the cost significantly and serves as evidence in disputes. Always state the specific purpose.',
    faq2q: 'Are my images uploaded?',
    faq2a: 'Never. All processing happens locally in your browser; we have no server that receives your images.',
    faq3q: 'What text should I use?',
    faq3a: '"For [specific purpose] use only" + date, within 3 lines. The more specific the purpose, the better the protection.',
    privacy: 'Privacy',
    terms: 'Terms',
    footerNote: 'Images are processed locally in your browser. Nothing is uploaded.',
    langLabel: 'Language',
    purposes: ['Loan application', 'Rental', 'Employment', 'School registration', 'Visa application'],
  },
};

export let currentLang = 'zh-CN';

// Language persistence: manual switches are stored, surviving return visits
const LANG_KEY = 'idmark.lang';

export function t(key) {
  const dict = translations[currentLang] || translations['zh-CN'];
  return dict[key] ?? translations['zh-CN'][key] ?? key;
}

function applyStatic() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = translations[currentLang][el.dataset.i18n];
    if (v != null && typeof v !== 'object') el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const v = translations[currentLang][el.dataset.i18nPlaceholder];
    if (v != null && typeof v !== 'object') el.placeholder = v;
  });
  document.title = t('pageTitle');
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('heroSub'));
  document.documentElement.lang = currentLang;
}

export function setLang(lang) {
  currentLang = translations[lang] ? lang : 'zh-CN';
  try { localStorage.setItem(LANG_KEY, currentLang); } catch (_) { /* storage unavailable */ }
  applyStatic();
  // Rebuild the purpose dropdown (options live in the dictionaries)
  const sel = document.getElementById('purpose');
  if (sel) {
    const custom = sel.value === '__custom';
    const prev = custom ? null : sel.selectedIndex;
    rebuildPurposes(sel);
    if (prev != null && prev < sel.options.length) sel.selectedIndex = prev;
    else if (custom) sel.value = '__custom';
  }
}

function rebuildPurposes(sel) {
  const customInput = document.getElementById('customPurpose');
  const keepCustom = sel.value === '__custom';
  const customText = (customInput && customInput.value) || '';
  sel.innerHTML = '';
  t('purposes').forEach(p => {
    const o = document.createElement('option');
    o.value = p;
    o.textContent = p;
    sel.appendChild(o);
  });
  const o = document.createElement('option');
  o.value = '__custom';
  o.textContent = currentLang === 'en' ? 'Other (custom)' : '其他（自定义）';
  sel.appendChild(o);
  if (keepCustom) {
    sel.value = '__custom';
    if (customInput) customInput.value = customText;
  }
}

export function initLang() {
  // Priority: ?lang= param > /en page hint > localStorage > zh-CN fallback
  // (the page's own declaration outranks the stored preference)
  let stored = null;
  try { stored = localStorage.getItem(LANG_KEY); } catch (_) { /* storage unavailable */ }
  const url = new URLSearchParams(location.search).get('lang');
  const lang =
    (url && translations[url]) ? url :
    location.pathname.includes('/en') ? 'en' :
    (stored && translations[stored]) ? stored :
    'zh-CN';
  currentLang = lang;
  document.documentElement.lang = lang;
  rebuildPurposes(document.getElementById('purpose'));
  applyStatic();
  const sel = document.getElementById('langSelector');
  if (sel) sel.value = lang;
}
