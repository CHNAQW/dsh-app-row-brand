/**
 * app-row-brand — the browser half.
 *
 * Draws the user's own image and text inside the Windows title-bar strip of
 * the desktop shell: the 40px row that holds the sidebar toggle, the native
 * 应用 / 编辑 menus and the minimize / maximize / close buttons. The strip is
 * painted by the shell's frame (`[data-windows-titlebar]`), so the content is
 * registered into `shell.overlay` and pinned to the viewport top instead of
 * living inside a column.
 *
 * The content is a list of items. With more than one item the strip advances
 * on a per-item timer, so every round can have its own display time. Each item
 * carries its own image, text, color, font, weight, underline, alignment and
 * an optional shimmer (a highlight sweeping across the glyphs, the same
 * technique as the status widget).
 */
window.__ModuleLoader__.load({
  id: 'dsh-app-row-brand',
  factory(require) {
    'use strict';

    const React = require('react');
    const h = React.createElement;

    const NS = 'appRowBrand';
    const STORAGE_KEY = 'dsh.app-row-brand:config:v1';
    const STYLE_ID = 'dsarb-style';
    /** Fallback height of the Windows title-bar strip, in pixels. */
    const STRIP_HEIGHT = 40;
    const WIDTH_MIN = 8;
    const WIDTH_MAX = 240;
    const FONT_SIZE_MIN = 9;
    const FONT_SIZE_MAX = 40;
    const TEXT_MAX = 60;
    const MAX_ITEMS = 12;
    const DURATION_MIN = 1000;
    const DURATION_MAX = 3600000;
    const SHIMMER_MIN = 600;
    const SHIMMER_MAX = 20000;
    const DEFAULT_TEXT = 'DeepSeek Harness';
    const DEFAULT_HINT_TEXT = '请到设置界面设置语句';
    const DEFAULT_COLOR = '#4d6bfe';
    const DEFAULT_ALIGN = 'center';
    const MAX_IMAGE_CHARS = 900 * 1024;
    const ALIGNMENTS = ['center', 'right', 'left'];
    /** Probed with canvas metrics when the browser cannot enumerate fonts. */
    const FONT_CANDIDATES = [
      'Microsoft YaHei',
      'Microsoft YaHei UI',
      'Microsoft JhengHei',
      'SimSun',
      'NSimSun',
      'SimHei',
      'KaiTi',
      'FangSong',
      'DengXian',
      'Source Han Sans SC',
      'Noto Sans SC',
      'Noto Sans CJK SC',
      'PingFang SC',
      'Hiragino Sans GB',
      'Segoe UI',
      'Segoe UI Variable',
      'Arial',
      'Calibri',
      'Cambria',
      'Consolas',
      'Courier New',
      'Georgia',
      'Impact',
      'Tahoma',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
      'Comic Sans MS',
      'Cascadia Code',
      'Cascadia Mono',
      'JetBrains Mono',
      'Fira Code',
      'Hack',
      'Lucida Console',
      'Lucida Sans Unicode',
      'Palatino Linotype',
      'Franklin Gothic Medium',
    ];
    /** Last resort when neither enumeration nor probing finds anything. */
    const FONT_FALLBACK = [
      'Microsoft YaHei',
      'SimSun',
      'SimHei',
      'Segoe UI',
      'Arial',
      'Georgia',
      'Times New Roman',
      'Consolas',
    ];

    const EN = {
      'meta.title': 'Title Bar Text & Image',
      'section.title': 'Title bar',
      'section.desc':
        'Your own image and text inside the window title bar — the row with the sidebar toggle, the App/Edit menus and minimize, maximize and close. Items rotate on their own timers; each item has its own font, color, size, weight, underline and optional shimmer. The image height is locked to the bar; only its width is adjustable. Changes apply immediately and are stored on this device.',
      'items.label': 'Items',
      'items.hint': 'More than one item rotates automatically; each item keeps its own display time.',
      'items.add': 'Add item',
      'items.remove': 'Remove item',
      'items.newText': 'New item',
      'items.untitled': '(no text)',
      'order.label': 'Order',
      'order.hint': 'Change the order items take turns in.',
      'order.up': 'Move up',
      'order.down': 'Move down',
      'show.label': 'Visibility',
      'show.hint': 'Hidden items are skipped while rotating; you can show them again at any time.',
      'show.hidden': 'Temporarily hide this item',
      'show.badge': 'hidden',
      'show.preview': 'This item is hidden and skipped while rotating.',
      'nav.label': 'Display control',
      'nav.hint':
        'Pinning keeps the current item on screen and stops automatic rotation; Previous and Next step through items manually.',
      'nav.prev': 'Previous',
      'nav.next': 'Next',
      'nav.pin': 'Pin',
      'nav.unpin': 'Unpin',
      'nav.status.auto': 'Showing {current} of {total} · rotating',
      'nav.status.pinned': 'Showing {current} of {total} · pinned',
      'text.label': 'Text',
      'text.hint': 'Leave empty to show the image only. Up to 60 characters.',
      'text.placeholder': 'Text shown in the title bar',
      'color.label': 'Text color',
      'color.hint': 'Use the swatch or type RGB values.',
      'font.label': 'Font',
      'font.hint': 'Fonts read from this machine; empty uses the interface font.',
      'font.detect': 'Detect fonts',
      'font.loading': 'Reading local fonts…',
      'font.detected': 'Detected {count} local fonts',
      'font.candidates': 'Local font access unavailable; showing {count} common fonts',
      'font.default': 'Interface font',
      'font.custom': 'Custom…',
      'font.customHint': 'Type any font family name.',
      'font.placeholder': 'e.g. Microsoft YaHei',
      'size.label': 'Font size',
      'size.hint': '9–40px.',
      'style.bold': 'Bold',
      'style.underline': 'Underline',
      'image.label': 'Image',
      'image.hint':
        'PNG, JPG, WebP or SVG, or an image link. Uploaded files are scaled to the bar height and stored on this device.',
      'image.pick': 'Choose image',
      'image.clear': 'Remove image',
      'image.none': 'No image yet',
      'image.urlPlaceholder': 'Paste an image link (https://…)',
      'image.useUrl': 'Use link',
      'image.notImage': 'Please choose an image file.',
      'image.readFail': 'This image could not be read.',
      'image.tooLarge': 'The image is too large; please pick a smaller one.',
      'image.badUrl': 'Use an http(s) or data:image address.',
      'image.picked': 'Image updated.',
      'width.label': 'Image width',
      'width.hint': 'Height is fixed to the title-bar height; width is 8–240px.',
      'align.label': 'Alignment',
      'align.hint': 'Position inside the title bar, clear of the native menus and window buttons.',
      'align.center': 'Center',
      'align.right': 'Right',
      'align.left': 'Left',
      'shimmer.label': 'Shimmer',
      'shimmer.hint': 'A highlight sweeps across the text, like the status widget.',
      'shimmer.speed': 'Shimmer cycle',
      'shimmer.speedHint': 'Seconds; smaller sweeps faster.',
      'shimmer.direction': 'Sweep direction',
      'shimmer.ltr': 'Left to right',
      'shimmer.rtl': 'Right to left',
      'shimmer.color': 'Highlight color',
      'duration.label': 'Display time',
      'duration.hint': 'How long this item stays before the next one, in seconds.',
      'preview.label': 'Preview',
      'reset.label': 'Restore defaults',
      'status.reset': 'Defaults restored.',
      'save.failed': 'Could not save on this device; the change lasts for this session only.',
    };

    const ZH = {
      'meta.title': '标题栏文字与图片',
      'section.title': '标题栏',
      'section.desc':
        '在窗口标题栏里显示你自己的图片和文字——就是收起侧边栏、应用/编辑菜单、最小化/全屏/关闭所在的那一行。多个条目会自动轮播，每个条目有自己的字体、颜色、字号、加粗、下划线和流光；图片高度锁定为这条栏的高度，只可调整宽度。修改立即生效，并保存在本机。',
      'items.label': '条目',
      'items.hint': '多于一个条目时会自动轮播，每个条目的显示时长单独设置。',
      'items.add': '新增条目',
      'items.remove': '删除条目',
      'items.newText': '新条目',
      'items.untitled': '（无文字）',
      'order.label': '顺序',
      'order.hint': '调整条目在轮播中的先后顺序。',
      'order.up': '上移',
      'order.down': '下移',
      'show.label': '显示状态',
      'show.hint': '隐藏的条目轮播时会跳过，随时可以重新显示。',
      'show.hidden': '暂不展示',
      'show.badge': '暂不展示',
      'show.preview': '该条目暂不展示，轮播时会跳过。',
      'nav.label': '显示控制',
      'nav.hint': '固定后停留在当前条目、不再自动轮播；上一个/下一个手动切换。',
      'nav.prev': '上一个',
      'nav.next': '下一个',
      'nav.pin': '固定',
      'nav.unpin': '取消固定',
      'nav.status.auto': '正在显示第 {current}/{total} 条 · 自动轮播',
      'nav.status.pinned': '正在显示第 {current}/{total} 条 · 已固定',
      'text.label': '自定义文字',
      'text.hint': '留空则只显示图片，最多 60 个字符。',
      'text.placeholder': '显示在标题栏里的文字',
      'color.label': '文字颜色',
      'color.hint': '可用取色器，也可以直接填写 RGB 数值。',
      'font.label': '字体',
      'font.hint': '从本机字体中选择；留空使用界面默认字体。',
      'font.detect': '检测本机字体',
      'font.loading': '正在读取本机字体…',
      'font.detected': '已检测到 {count} 个本机字体',
      'font.candidates': '浏览器未授权读取本机字体，已列出 {count} 个常见字体',
      'font.default': '界面默认字体',
      'font.custom': '自定义…',
      'font.customHint': '可直接填写任意字体名。',
      'font.placeholder': '例如 Microsoft YaHei',
      'size.label': '字号',
      'size.hint': '9–40px。',
      'style.bold': '加粗',
      'style.underline': '下划线',
      'image.label': '自定义图片',
      'image.hint':
        '支持 PNG、JPG、WebP、SVG 或图片链接；上传的图片会按标题栏高度缩放后保存在本机。',
      'image.pick': '选择图片',
      'image.clear': '清除图片',
      'image.none': '尚未设置图片',
      'image.urlPlaceholder': '粘贴图片链接（https://…）',
      'image.useUrl': '使用链接',
      'image.notImage': '请选择图片文件。',
      'image.readFail': '无法读取这张图片。',
      'image.tooLarge': '图片过大，请换一张更小的图片。',
      'image.badUrl': '请输入 http(s) 或 data:image 开头的图片地址。',
      'image.picked': '图片已更新。',
      'width.label': '图片宽度',
      'width.hint': '高度固定为标题栏高度（40px），宽度可设 8–240px。',
      'align.label': '对齐方式',
      'align.hint': '在标题栏内的位置，会自动避开系统菜单和窗口按钮。',
      'align.center': '居中',
      'align.right': '靠右',
      'align.left': '靠左',
      'shimmer.label': '流光',
      'shimmer.hint': '高光从左到右扫过文字，与状态挂件同款效果。',
      'shimmer.speed': '流光周期',
      'shimmer.speedHint': '单位秒，数值越小扫得越快。',
      'shimmer.direction': '流光方向',
      'shimmer.ltr': '从左到右',
      'shimmer.rtl': '从右到左',
      'shimmer.color': '高光颜色',
      'duration.label': '显示时长',
      'duration.hint': '这个条目停留多久后切到下一条，单位秒。',
      'preview.label': '预览',
      'reset.label': '恢复默认设置',
      'status.reset': '已恢复默认设置。',
      'save.failed': '无法保存到本机存储，本次修改只在当前会话生效。',
    };

    // ------------------------------------------------------------------ store

    let translate = null;
    let currentConfig = null;
    let persistFailed = false;
    const listeners = new Set();

    function interpolate(value, params) {
      if (!params) return value;
      let out = value;
      for (const name of Object.keys(params)) {
        out = out.split('{' + name + '}').join(String(params[name]));
      }
      return out;
    }

    function t(key, params) {
      if (translate) {
        try {
          const value = translate(key);
          if (typeof value === 'string' && value !== key) return interpolate(value, params);
        } catch (error) {
          /* fall through to the bundled dictionary */
        }
      }
      const language =
        typeof navigator !== 'undefined' && navigator.language
          ? String(navigator.language).toLowerCase()
          : 'en';
      const dictionary = language.indexOf('zh') === 0 ? ZH : EN;
      const value = typeof dictionary[key] === 'string' ? dictionary[key] : key;
      return interpolate(value, params);
    }

    function clamp(value, min, max) {
      const number = Number(value);
      if (!isFinite(number)) return min;
      return Math.min(max, Math.max(min, number));
    }

    /** Milliseconds -> seconds for the settings inputs (2 decimals at most). */
    function secondsOf(ms) {
      const value = Number(ms);
      if (!isFinite(value)) return '0';
      return String(Math.round(value / 10) / 100);
    }

    /** Seconds typed in the settings -> milliseconds for storage. */
    function msOf(seconds) {
      const value = Number(seconds);
      if (!isFinite(value)) return 0;
      return Math.round(value * 1000);
    }

    function isHexColor(value) {
      return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
    }

    /** Strip characters that could break out of the inline style value. */
    function sanitizeFont(value) {
      if (typeof value !== 'string') return '';
      return value.replace(/[;{}]/g, '').slice(0, 120);
    }

    function defaultItem() {
      return {
        text: DEFAULT_TEXT,
        textColor: DEFAULT_COLOR,
        image: '',
        imageWidth: STRIP_HEIGHT,
        align: DEFAULT_ALIGN,
        font: '',
        fontSize: 13,
        bold: false,
        underline: false,
        shimmer: false,
        shimmerDurationMs: 2600,
        shimmerColor: '#ffffff',
        shimmerDirection: 'ltr',
        durationMs: 6000,
        hidden: false,
      };
    }

    /** Out-of-the-box content: the setup hint and the product name, 30s each with a left-to-right shimmer. */
    function defaultItems() {
      const shared = { shimmer: true, shimmerDirection: 'ltr', durationMs: 30000 };
      return [
        normalizeItem(Object.assign({ text: DEFAULT_HINT_TEXT }, shared)),
        normalizeItem(Object.assign({ text: DEFAULT_TEXT }, shared)),
      ];
    }

    function normalizeItem(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      const text = typeof source.text === 'string' ? source.text.slice(0, TEXT_MAX) : DEFAULT_TEXT;
      const image =
        typeof source.image === 'string' && source.image.length > 0 && source.image.length <= MAX_IMAGE_CHARS
          ? source.image
          : '';
      return {
        text: text,
        textColor: isHexColor(source.textColor) ? source.textColor.toLowerCase() : DEFAULT_COLOR,
        image: image,
        imageWidth: Math.round(
          clamp(
            isFinite(Number(source.imageWidth)) ? source.imageWidth : STRIP_HEIGHT,
            WIDTH_MIN,
            WIDTH_MAX,
          ),
        ),
        align: ALIGNMENTS.indexOf(source.align) >= 0 ? source.align : DEFAULT_ALIGN,
        font: sanitizeFont(source.font),
        fontSize: Math.round(
          clamp(
            isFinite(Number(source.fontSize)) ? source.fontSize : 13,
            FONT_SIZE_MIN,
            FONT_SIZE_MAX,
          ),
        ),
        bold: source.bold === true,
        underline: source.underline === true,
        shimmer: source.shimmer === true,
        shimmerDurationMs: Math.round(
          clamp(
            isFinite(Number(source.shimmerDurationMs)) ? source.shimmerDurationMs : 2600,
            SHIMMER_MIN,
            SHIMMER_MAX,
          ),
        ),
        shimmerColor: isHexColor(source.shimmerColor) ? source.shimmerColor.toLowerCase() : '#ffffff',
        shimmerDirection: source.shimmerDirection === 'rtl' ? 'rtl' : 'ltr',
        durationMs: Math.round(
          clamp(
            isFinite(Number(source.durationMs)) ? source.durationMs : 6000,
            DURATION_MIN,
            DURATION_MAX,
          ),
        ),
        hidden: source.hidden === true,
      };
    }

    function normalizeConfig(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      let items;
      if (Array.isArray(source.items) && source.items.length > 0) {
        items = source.items.slice(0, MAX_ITEMS).map(normalizeItem);
      } else if (
        // v1 shape: one flat item on the config root.
        typeof source.text === 'string' ||
        typeof source.image === 'string' ||
        typeof source.textColor === 'string'
      ) {
        items = [normalizeItem(source)];
      } else {
        items = defaultItems();
      }
      const pinnedIndex =
        Number.isInteger(source.pinnedIndex) && source.pinnedIndex >= 0 ? source.pinnedIndex : null;
      return { items: items.length > 0 ? items : defaultItems(), pinnedIndex };
    }

    function readConfig() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? normalizeConfig(JSON.parse(raw)) : normalizeConfig(null);
      } catch (error) {
        return normalizeConfig(null);
      }
    }

    function persistConfig(config) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        return true;
      } catch (error) {
        return false;
      }
    }

    function getConfig() {
      if (!currentConfig) currentConfig = readConfig();
      return currentConfig;
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }

    function emit() {
      for (const listener of Array.from(listeners)) {
        try {
          listener();
        } catch (error) {
          /* an outlet must not break the others */
        }
      }
    }

    function update(patch) {
      currentConfig = normalizeConfig(Object.assign({}, getConfig(), patch));
      persistFailed = !persistConfig(currentConfig);
      emit();
    }

    function resetConfig() {
      currentConfig = normalizeConfig(null);
      persistFailed = !persistConfig(currentConfig);
      emit();
    }

    /**
     * The item currently on screen, kept outside the persisted config so the
     * carousel can advance without writing storage on every tick.
     */
    let displayIndex = 0;

    function setDisplayIndex(next) {
      displayIndex = next;
      emit();
    }

    function useConfig() {
      const [, setVersion] = React.useState(0);
      React.useEffect(() => {
        return subscribe(() => setVersion((value) => value + 1));
      }, []);
      return getConfig();
    }

    /** True only inside the Windows desktop shell, the only frame with this strip. */
    function useWindowsTitlebar() {
      const read = () =>
        typeof document !== 'undefined' &&
        document.documentElement != null &&
        document.documentElement.hasAttribute('data-windows-titlebar');
      const [active, setActive] = React.useState(read);
      React.useEffect(() => {
        if (typeof MutationObserver !== 'function' || typeof document === 'undefined') return undefined;
        const root = document.documentElement;
        const observer = new MutationObserver(() => setActive(read()));
        observer.observe(root, { attributes: true, attributeFilter: ['data-windows-titlebar'] });
        setActive(read());
        return () => observer.disconnect();
      }, []);
      return active;
    }

    function hexToRgb(hex) {
      const safe = isHexColor(hex) ? hex : DEFAULT_COLOR;
      return {
        r: parseInt(safe.slice(1, 3), 16),
        g: parseInt(safe.slice(3, 5), 16),
        b: parseInt(safe.slice(5, 7), 16),
      };
    }

    function rgbToHex(r, g, b) {
      const part = (value) => {
        const number = Math.round(clamp(value, 0, 255));
        return (number < 16 ? '0' : '') + number.toString(16);
      };
      return '#' + part(r) + part(g) + part(b);
    }

    /** Read a picked file, scale it to the strip with headroom, keep a data URL. */
    function shrinkImage(file, translateFn) {
      return new Promise((resolve, reject) => {
        if (!file || !/^image\//.test(String(file.type))) {
          reject(new Error(translateFn('image.notImage')));
          return;
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(translateFn('image.readFail')));
        reader.onload = () => {
          const image = new Image();
          image.onerror = () => reject(new Error(translateFn('image.readFail')));
          image.onload = () => {
            try {
              const maxHeight = STRIP_HEIGHT * 4;
              const maxWidth = WIDTH_MAX * 4;
              const scale = Math.min(
                1,
                maxHeight / Math.max(1, image.naturalHeight),
                maxWidth / Math.max(1, image.naturalWidth),
              );
              const width = Math.max(1, Math.round(image.naturalWidth * scale));
              const height = Math.max(1, Math.round(image.naturalHeight * scale));
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const context = canvas.getContext('2d');
              context.clearRect(0, 0, width, height);
              context.drawImage(image, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/png');
              if (dataUrl.length > MAX_IMAGE_CHARS) {
                reject(new Error(translateFn('image.tooLarge')));
                return;
              }
              resolve(dataUrl);
            } catch (error) {
              reject(new Error(translateFn('image.readFail')));
            }
          };
          image.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
      });
    }

    // ------------------------------------------------------------- rendering

    /**
     * Inline style for one item's text. Shimmer paints the glyphs with a moving
     * gradient: the base color repeated across the tile with the highlight in
     * the middle, clipped to the text and advanced one tile per cycle.
     */
    function textStyleOf(item) {
      const style = {
        color: item.textColor,
        fontFamily: item.font ? item.font : undefined,
        fontSize: item.fontSize + 'px',
        fontWeight: item.bold ? 700 : 500,
        textDecoration: item.underline ? 'underline' : 'none',
        textDecorationColor: item.textColor,
        textDecorationThickness: '1px',
        textUnderlineOffset: '3px',
      };
      if (item.shimmer) {
        style.color = 'transparent';
        style.WebkitTextFillColor = 'transparent';
        style.backgroundImage =
          'linear-gradient(90deg,' +
          item.textColor +
          ' 0%,' +
          item.textColor +
          ' 40%,' +
          item.shimmerColor +
          ' 50%,' +
          item.textColor +
          ' 60%,' +
          item.textColor +
          ' 100%)';
        style.backgroundSize = '200% 100%';
        style.backgroundRepeat = 'repeat-x';
        // Left-to-right: the tile starts shifted left and slides right, so the
        // highlight enters at the left edge and leaves at the right edge.
        style.backgroundPosition = item.shimmerDirection === 'rtl' ? '0% 0' : '200% 0';
        style.WebkitBackgroundClip = 'text';
        style.backgroundClip = 'text';
        style.animation =
          (item.shimmerDirection === 'rtl' ? 'dsarb-shimmer-rtl ' : 'dsarb-shimmer-ltr ') +
          item.shimmerDurationMs +
          'ms linear infinite';
      }
      return style;
    }

    function renderItemBody(item) {
      return h(
        'span',
        { className: 'dsarb-strip-inner' },
        item.image
          ? h('img', {
              className: 'dsarb-strip-img',
              src: item.image,
              alt: '',
              draggable: false,
              style: { width: item.imageWidth + 'px' },
            })
          : null,
        item.text
          ? h(
              'span',
              { className: 'dsarb-strip-text' + (item.shimmer ? ' is-shimmer' : ''), style: textStyleOf(item) },
              item.text,
            )
          : null,
      );
    }

    /** First visible item index at or after `from`, wrapping once. */
    function visibleFrom(items, from) {
      const total = items.length;
      for (let step = 0; step < total; step += 1) {
        const candidate = (((from + step) % total) + total) % total;
        if (!items[candidate].hidden) return candidate;
      }
      return null;
    }

    /** Next visible item from `from` in `direction` (+1 or -1). */
    function stepVisible(items, from, direction) {
      const total = items.length;
      for (let step = 1; step <= total; step += 1) {
        const candidate = (((from + direction * step) % total) + total) % total;
        if (!items[candidate].hidden) return candidate;
      }
      return from;
    }

    function TitlebarBrand() {
      const config = useConfig();
      const active = useWindowsTitlebar();
      const items = config.items;
      const pinnedRaw = Number.isInteger(config.pinnedIndex) ? config.pinnedIndex : null;
      const pinnedItem = pinnedRaw !== null ? items[pinnedRaw] : undefined;
      const pinned = pinnedItem && !pinnedItem.hidden ? pinnedRaw : null;
      const index = pinned !== null ? pinned : visibleFrom(items, displayIndex);

      React.useEffect(() => {
        if (!active || pinned !== null || index === null) return undefined;
        const visibleCount = items.reduce((total, item) => total + (item.hidden ? 0 : 1), 0);
        if (visibleCount <= 1) return undefined;
        const item = items[index];
        const wait = item ? item.durationMs : 6000;
        const timer = setTimeout(() => setDisplayIndex(stepVisible(items, index, 1)), wait);
        return () => clearTimeout(timer);
      }, [active, index, items, pinned]);

      if (!active || index === null) return null;
      const item = items[index];
      if (!item || (!item.text && !item.image)) return null;
      return h(
        'div',
        { key: 'item-' + index, className: 'dsarb-strip is-' + item.align },
        renderItemBody(item),
      );
    }

    // ---------------------------------------------------------------- fonts

    /** Cached machine font families plus where they came from. */
    let cachedFontList = null;
    let cachedFontSource = 'none';
    let fontDetectionPromise = null;

    function sortFamilies(list) {
      return list.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
      );
    }

    /** Canvas metric probe: the family is installed when it changes the fallback width. */
    function probeFontFamily(family) {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return false;
        const sample = 'mmmmmmmmmmlliWWWQ0';
        for (const fallback of ['monospace', 'sans-serif', 'serif']) {
          context.font = '72px ' + fallback;
          const base = context.measureText(sample).width;
          context.font = '72px "' + String(family).replace(/"/g, '') + '", ' + fallback;
          if (Math.abs(context.measureText(sample).width - base) > 0.5) return true;
        }
      } catch (error) {
        return false;
      }
      return false;
    }

    /** Enumerate installed fonts: Local Font Access first, canvas probing second. */
    function detectFonts(force) {
      if (force) {
        cachedFontList = null;
        cachedFontSource = 'none';
      }
      if (fontDetectionPromise) return fontDetectionPromise;
      if (cachedFontList) return Promise.resolve(cachedFontList);
      const pending = (async () => {
        let families = [];
        let source = 'candidates';
        try {
          if (typeof window !== 'undefined' && typeof window.queryLocalFonts === 'function') {
            const records = await window.queryLocalFonts();
            const found = new Set();
            for (const record of records || []) {
              if (record && record.family) found.add(String(record.family));
            }
            if (found.size > 0) {
              families = sortFamilies(Array.from(found));
              source = 'local';
            }
          }
        } catch (error) {
          /* the shell may decline the local-fonts permission */
        }
        if (families.length === 0) {
          const found = new Set();
          for (const family of FONT_CANDIDATES) {
            if (probeFontFamily(family)) found.add(family);
          }
          families = found.size > 0 ? sortFamilies(Array.from(found)) : FONT_FALLBACK.slice();
        }
        cachedFontList = families;
        cachedFontSource = source;
        return families;
      })();
      fontDetectionPromise = pending;
      const clear = () => {
        if (fontDetectionPromise === pending) fontDetectionPromise = null;
      };
      pending.then(clear, clear);
      return pending;
    }

    // ------------------------------------------------------------- settings

    function Field({ label, hint, children }) {
      return h(
        'div',
        { className: 'dsarb-field' },
        h('div', { className: 'dsarb-label' }, label),
        hint ? h('div', { className: 'dsarb-hint' }, hint) : null,
        children,
      );
    }

    /**
     * Number field that keeps a local draft while focused, so typing a value
     * below the minimum (or clearing the box) does not snap back mid-edit. The
     * committed value is clamped on blur.
     */
    function NumberInput({ value, min, max, step, className, onChange }) {
      const [draft, setDraft] = React.useState(String(value));
      const [focused, setFocused] = React.useState(false);

      React.useEffect(() => {
        if (!focused) setDraft(String(value));
      }, [value, focused]);

      return h('input', {
        className: className,
        type: 'number',
        min: min,
        max: max,
        step: step,
        value: draft,
        onFocus: () => setFocused(true),
        onChange: (event) => {
          const raw = event.target.value;
          setDraft(raw);
          const number = Number(raw);
          if (raw !== '' && isFinite(number) && number >= min && number <= max) onChange(number);
        },
        onBlur: (event) => {
          setFocused(false);
          const raw = event.target.value;
          const number = Number(raw);
          const committed = raw === '' || !isFinite(number) ? Number(value) : clamp(number, min, max);
          setDraft(String(committed));
          if (committed !== Number(value)) onChange(committed);
        },
        onKeyDown: (event) => {
          if (event.key === 'Enter' && event.currentTarget && event.currentTarget.blur) {
            event.currentTarget.blur();
          }
        },
      });
    }

    function RgbInput({ channel, value, onChange }) {
      return h(
        'label',
        { className: 'dsarb-rgb' },
        h('span', { className: 'dsarb-rgb-name' }, channel),
        h(NumberInput, {
          className: 'dsarb-input dsarb-num',
          min: 0,
          max: 255,
          step: 1,
          value: value,
          onChange: (next) => onChange(next),
        }),
      );
    }

    function Check({ checked, onChange, label }) {
      return h(
        'label',
        { className: 'dsarb-check' },
        h('input', {
          type: 'checkbox',
          checked: checked,
          onChange: (event) => onChange(event.target.checked),
        }),
        h('span', null, label),
      );
    }

    function SettingsPage() {
      const config = useConfig();
      const items = config.items;
      const [selected, setSelected] = React.useState(0);
      const [status, setStatus] = React.useState('');
      const [urlDraft, setUrlDraft] = React.useState('');
      const fileRef = React.useRef(null);
      const [fonts, setFonts] = React.useState(cachedFontList || []);
      const [fontSource, setFontSource] = React.useState(cachedFontSource);
      const [fontBusy, setFontBusy] = React.useState(false);
      const [customFont, setCustomFont] = React.useState(false);

      const index = Math.min(selected, items.length - 1);
      const item = items[index];
      const rgb = hexToRgb(item.textColor);
      const shimmerRgb = hexToRgb(item.shimmerColor);

      const pinnedRaw = Number.isInteger(config.pinnedIndex) ? config.pinnedIndex : null;
      const pinnedItem = pinnedRaw !== null ? items[pinnedRaw] : undefined;
      const pinned = pinnedItem && !pinnedItem.hidden ? pinnedRaw : null;
      const shownIndex = pinned !== null ? pinned : visibleFrom(items, displayIndex) ?? 0;

      function stepDisplay(delta) {
        const next = stepVisible(items, shownIndex, delta);
        setSelected(next);
        if (pinned !== null) update({ pinnedIndex: next });
        else setDisplayIndex(next);
      }

      function togglePin() {
        if (pinned !== null) update({ pinnedIndex: null });
        else update({ pinnedIndex: shownIndex });
      }

      /** Swap the selected item with its neighbour and keep the display on the same content. */
      function moveItem(delta) {
        const total = items.length;
        const target = index + delta;
        if (total <= 1 || target < 0 || target >= total) return;
        const next = items.slice();
        const moved = next[index];
        next[index] = next[target];
        next[target] = moved;
        const patch = { items: next };
        if (pinned !== null) {
          if (pinned === index) patch.pinnedIndex = target;
          else if (pinned === target) patch.pinnedIndex = index;
        }
        update(patch);
        if (pinned === null) {
          if (shownIndex === index) setDisplayIndex(target);
          else if (shownIndex === target) setDisplayIndex(index);
        }
        setSelected(target);
        setStatus('');
      }

      const fontKnown = item.font === '' || fonts.indexOf(item.font) >= 0;
      const showCustomFont = customFont || !fontKnown;
      const fontStatusText = fontBusy
        ? t('font.loading')
        : fonts.length === 0
          ? t('font.loading')
          : fontSource === 'local'
            ? t('font.detected', { count: fonts.length })
            : t('font.candidates', { count: fonts.length });

      React.useEffect(() => {
        if (fonts.length > 0) return undefined;
        let alive = true;
        setFontBusy(true);
        detectFonts().then((list) => {
          if (!alive) return;
          setFonts(list);
          setFontSource(cachedFontSource);
          setFontBusy(false);
        });
        return () => {
          alive = false;
        };
      }, []);

      function refreshFonts() {
        setFontBusy(true);
        detectFonts(true).then((list) => {
          setFonts(list);
          setFontSource(cachedFontSource);
          setFontBusy(false);
        });
      }

      function patchItem(patch) {
        const next = items.slice();
        next[index] = Object.assign({}, items[index], patch);
        update({ items: next });
      }

      function addItem() {
        const next = items.slice();
        next.push(Object.assign(defaultItem(), { text: t('items.newText') }));
        update({ items: next });
        setSelected(next.length - 1);
        setStatus('');
      }

      function removeItem() {
        if (items.length <= 1) return;
        const next = items.filter((_, position) => position !== index);
        update({ items: next });
        setSelected(Math.max(0, index - 1));
        setStatus('');
      }

      function pickFile(event) {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        shrinkImage(file, t)
          .then((dataUrl) => {
            patchItem({ image: dataUrl });
            setStatus(t('image.picked'));
          })
          .catch((error) => setStatus(String((error && error.message) || error)));
      }

      function applyUrl() {
        const url = urlDraft.trim();
        if (!url) return;
        if (!/^(https?:\/\/|data:image\/)/i.test(url)) {
          setStatus(t('image.badUrl'));
          return;
        }
        patchItem({ image: url });
        setUrlDraft('');
        setStatus(t('image.picked'));
      }

      function optionLabel(position, entry) {
        const text = entry.text && entry.text.trim() ? entry.text.trim() : t('items.untitled');
        const name = position + 1 + '. ' + (text.length > 18 ? text.slice(0, 18) + '…' : text);
        return entry.hidden ? name + ' · ' + t('show.badge') : name;
      }

      return h(
        'div',
        { className: 'dsarb-page' },
        h(
          'div',
          { className: 'dsarb-head' },
          h('div', { className: 'dsarb-title' }, t('section.title')),
          h('div', { className: 'dsarb-desc' }, t('section.desc')),
        ),
        h(
          'div',
          { className: 'dsarb-card' },
          h(
            Field,
            { label: t('items.label'), hint: t('items.hint') },
            h(
              'div',
              { className: 'dsarb-items' },
              h(
                'select',
                {
                  className: 'dsarb-input dsarb-select dsarb-select-wide',
                  value: String(index),
                  onChange: (event) => {
                    const next = Number(event.target.value);
                    setSelected(next);
                    if (pinned !== null) update({ pinnedIndex: next });
                    else setDisplayIndex(next);
                  },
                },
                items.map((entry, position) =>
                  h('option', { key: 'opt-' + position, value: String(position) }, optionLabel(position, entry)),
                ),
              ),
              h('button', { className: 'dsarb-btn', type: 'button', onClick: addItem }, t('items.add')),
              h(
                'button',
                {
                  className: 'dsarb-btn',
                  type: 'button',
                  disabled: items.length <= 1,
                  onClick: removeItem,
                },
                t('items.remove'),
              ),
            ),
          ),
          h(
            Field,
            { label: t('order.label'), hint: t('order.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(
                'button',
                {
                  className: 'dsarb-btn',
                  type: 'button',
                  disabled: index <= 0,
                  onClick: () => moveItem(-1),
                },
                '↑ ' + t('order.up'),
              ),
              h(
                'button',
                {
                  className: 'dsarb-btn',
                  type: 'button',
                  disabled: index >= items.length - 1,
                  onClick: () => moveItem(1),
                },
                '↓ ' + t('order.down'),
              ),
            ),
          ),
          h(
            Field,
            { label: t('show.label'), hint: t('show.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(Check, {
                checked: item.hidden,
                label: t('show.hidden'),
                onChange: (value) => patchItem({ hidden: value }),
              }),
            ),
          ),
          h(
            Field,
            { label: t('nav.label'), hint: t('nav.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(
                'button',
                { className: 'dsarb-btn', type: 'button', onClick: () => stepDisplay(-1) },
                '◀ ' + t('nav.prev'),
              ),
              h(
                'button',
                {
                  className: 'dsarb-btn' + (pinned !== null ? ' is-active' : ''),
                  type: 'button',
                  onClick: togglePin,
                },
                pinned !== null ? t('nav.unpin') : t('nav.pin'),
              ),
              h(
                'button',
                { className: 'dsarb-btn', type: 'button', onClick: () => stepDisplay(1) },
                t('nav.next') + ' ▶',
              ),
              h(
                'span',
                { className: 'dsarb-hint' },
                pinned !== null
                  ? t('nav.status.pinned', { current: shownIndex + 1, total: items.length })
                  : t('nav.status.auto', { current: shownIndex + 1, total: items.length }),
              ),
            ),
          ),
          h(
            Field,
            { label: t('preview.label') },
            h(
              'div',
              { className: 'dsarb-preview is-' + item.align },
              item.text || item.image
                ? renderItemBody(item)
                : h('span', { className: 'dsarb-hint' }, t('image.none')),
            ),
            item.hidden ? h('div', { className: 'dsarb-hint' }, t('show.preview')) : null,
          ),
          h(
            Field,
            { label: t('text.label'), hint: t('text.hint') },
            h('input', {
              className: 'dsarb-input',
              type: 'text',
              maxLength: TEXT_MAX,
              value: item.text,
              placeholder: t('text.placeholder'),
              onChange: (event) => patchItem({ text: event.target.value }),
            }),
          ),
          h(
            Field,
            { label: t('color.label'), hint: t('color.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h('input', {
                className: 'dsarb-swatch',
                type: 'color',
                value: item.textColor,
                onChange: (event) => patchItem({ textColor: event.target.value }),
              }),
              h(RgbInput, {
                channel: 'R',
                value: rgb.r,
                onChange: (value) => patchItem({ textColor: rgbToHex(value, rgb.g, rgb.b) }),
              }),
              h(RgbInput, {
                channel: 'G',
                value: rgb.g,
                onChange: (value) => patchItem({ textColor: rgbToHex(rgb.r, value, rgb.b) }),
              }),
              h(RgbInput, {
                channel: 'B',
                value: rgb.b,
                onChange: (value) => patchItem({ textColor: rgbToHex(rgb.r, rgb.g, value) }),
              }),
              h('span', { className: 'dsarb-hex' }, item.textColor.toUpperCase()),
            ),
          ),
          h(
            Field,
            { label: t('font.label'), hint: t('font.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(
                'select',
                {
                  className: 'dsarb-input dsarb-select dsarb-select-wide',
                  value: showCustomFont ? '__custom__' : item.font,
                  onChange: (event) => {
                    const value = event.target.value;
                    if (value === '__custom__') {
                      setCustomFont(true);
                      return;
                    }
                    setCustomFont(false);
                    patchItem({ font: value });
                  },
                },
                h('option', { value: '' }, t('font.default')),
                fonts.map((family) => h('option', { key: 'font-' + family, value: family }, family)),
                h('option', { value: '__custom__' }, t('font.custom')),
              ),
              h(
                'button',
                {
                  className: 'dsarb-btn',
                  type: 'button',
                  disabled: fontBusy,
                  onClick: refreshFonts,
                },
                t('font.detect'),
              ),
            ),
            showCustomFont
              ? h(
                  'div',
                  { className: 'dsarb-inline' },
                  h('input', {
                    className: 'dsarb-input',
                    type: 'text',
                    value: item.font,
                    placeholder: t('font.placeholder'),
                    onChange: (event) => patchItem({ font: event.target.value }),
                  }),
                  h('span', { className: 'dsarb-hint' }, t('font.customHint')),
                )
              : null,
            h('div', { className: 'dsarb-hint' }, fontStatusText),
          ),
          h(
            Field,
            { label: t('size.label'), hint: t('size.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(NumberInput, {
                className: 'dsarb-input dsarb-num',
                min: FONT_SIZE_MIN,
                max: FONT_SIZE_MAX,
                step: 1,
                value: item.fontSize,
                onChange: (value) => patchItem({ fontSize: value }),
              }),
              h('span', { className: 'dsarb-hint' }, 'px'),
            ),
          ),
          h(
            Field,
            { label: t('style.bold') + ' / ' + t('style.underline') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(Check, {
                checked: item.bold,
                label: t('style.bold'),
                onChange: (value) => patchItem({ bold: value }),
              }),
              h(Check, {
                checked: item.underline,
                label: t('style.underline'),
                onChange: (value) => patchItem({ underline: value }),
              }),
            ),
          ),
          h(
            Field,
            { label: t('image.label'), hint: t('image.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(
                'button',
                {
                  className: 'dsarb-btn',
                  type: 'button',
                  onClick: () => {
                    if (fileRef.current) fileRef.current.click();
                  },
                },
                t('image.pick'),
              ),
              h(
                'button',
                {
                  className: 'dsarb-btn',
                  type: 'button',
                  disabled: !item.image,
                  onClick: () => {
                    patchItem({ image: '' });
                    setStatus('');
                  },
                },
                t('image.clear'),
              ),
              h('input', {
                ref: fileRef,
                type: 'file',
                accept: 'image/*',
                style: { display: 'none' },
                onChange: pickFile,
              }),
            ),
            h(
              'div',
              { className: 'dsarb-inline' },
              h('input', {
                className: 'dsarb-input',
                type: 'text',
                value: urlDraft,
                placeholder: t('image.urlPlaceholder'),
                onChange: (event) => setUrlDraft(event.target.value),
              }),
              h('button', { className: 'dsarb-btn', type: 'button', onClick: applyUrl }, t('image.useUrl')),
            ),
          ),
          h(
            Field,
            { label: t('width.label'), hint: t('width.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(NumberInput, {
                className: 'dsarb-input dsarb-num dsarb-num-wide',
                min: WIDTH_MIN,
                max: WIDTH_MAX,
                step: 1,
                value: item.imageWidth,
                onChange: (value) => patchItem({ imageWidth: value }),
              }),
              h('span', { className: 'dsarb-hint' }, 'px'),
            ),
          ),
          h(
            Field,
            { label: t('align.label'), hint: t('align.hint') },
            h(
              'select',
              {
                className: 'dsarb-input dsarb-select',
                value: item.align,
                onChange: (event) => patchItem({ align: event.target.value }),
              },
              h('option', { value: 'center' }, t('align.center')),
              h('option', { value: 'right' }, t('align.right')),
              h('option', { value: 'left' }, t('align.left')),
            ),
          ),
          h(
            Field,
            { label: t('shimmer.label'), hint: t('shimmer.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(Check, {
                checked: item.shimmer,
                label: t('shimmer.label'),
                onChange: (value) => patchItem({ shimmer: value }),
              }),
            ),
            item.shimmer
              ? h(
                  'div',
                  { className: 'dsarb-inline' },
                  h('span', { className: 'dsarb-hint' }, t('shimmer.speed')),
                  h(NumberInput, {
                    className: 'dsarb-input dsarb-num dsarb-num-wide',
                    min: SHIMMER_MIN / 1000,
                    max: SHIMMER_MAX / 1000,
                    step: 0.1,
                    value: secondsOf(item.shimmerDurationMs),
                    onChange: (value) => patchItem({ shimmerDurationMs: msOf(value) }),
                  }),
                  h('span', { className: 'dsarb-hint' }, 's'),
                )
              : null,
            item.shimmer ? h('div', { className: 'dsarb-hint' }, t('shimmer.speedHint')) : null,
            item.shimmer
              ? h(
                  'div',
                  { className: 'dsarb-inline' },
                  h('span', { className: 'dsarb-hint' }, t('shimmer.direction')),
                  h(
                    'select',
                    {
                      className: 'dsarb-input dsarb-select',
                      value: item.shimmerDirection,
                      onChange: (event) => patchItem({ shimmerDirection: event.target.value }),
                    },
                    h('option', { value: 'ltr' }, t('shimmer.ltr')),
                    h('option', { value: 'rtl' }, t('shimmer.rtl')),
                  ),
                )
              : null,
            item.shimmer
              ? h(
                  'div',
                  { className: 'dsarb-inline' },
                  h('span', { className: 'dsarb-hint' }, t('shimmer.color')),
                  h('input', {
                    className: 'dsarb-swatch',
                    type: 'color',
                    value: item.shimmerColor,
                    onChange: (event) => patchItem({ shimmerColor: event.target.value }),
                  }),
                  h(RgbInput, {
                    channel: 'R',
                    value: shimmerRgb.r,
                    onChange: (value) =>
                      patchItem({ shimmerColor: rgbToHex(value, shimmerRgb.g, shimmerRgb.b) }),
                  }),
                  h(RgbInput, {
                    channel: 'G',
                    value: shimmerRgb.g,
                    onChange: (value) =>
                      patchItem({ shimmerColor: rgbToHex(shimmerRgb.r, value, shimmerRgb.b) }),
                  }),
                  h(RgbInput, {
                    channel: 'B',
                    value: shimmerRgb.b,
                    onChange: (value) =>
                      patchItem({ shimmerColor: rgbToHex(shimmerRgb.r, shimmerRgb.g, value) }),
                  }),
                )
              : null,
          ),
          h(
            Field,
            { label: t('duration.label'), hint: t('duration.hint') },
            h(
              'div',
              { className: 'dsarb-inline' },
              h(NumberInput, {
                className: 'dsarb-input dsarb-num dsarb-num-wide',
                min: DURATION_MIN / 1000,
                max: DURATION_MAX / 1000,
                step: 0.5,
                value: secondsOf(item.durationMs),
                onChange: (value) => patchItem({ durationMs: msOf(value) }),
              }),
              h('span', { className: 'dsarb-hint' }, 's'),
            ),
          ),
        ),
        h(
          'div',
          { className: 'dsarb-foot' },
          h(
            'button',
            {
              className: 'dsarb-btn',
              type: 'button',
              onClick: () => {
                resetConfig();
                setSelected(0);
                setStatus(t('status.reset'));
              },
            },
            t('reset.label'),
          ),
          status ? h('span', { className: 'dsarb-status' }, status) : null,
          persistFailed ? h('span', { className: 'dsarb-status dsarb-error' }, t('save.failed')) : null,
        ),
      );
    }

    // ------------------------------------------------------------------ setup

    const CSS = [
      '@keyframes dsarb-shimmer-ltr{from{background-position:200% 0}to{background-position:0% 0}}',
      '@keyframes dsarb-shimmer-rtl{from{background-position:0% 0}to{background-position:200% 0}}',
      '@keyframes dsarb-fade{from{opacity:0}to{opacity:1}}',
      '.dsarb-strip{position:fixed;top:0;left:0;right:0;height:var(--dsh-windows-titlebar-height,40px);display:flex;align-items:center;box-sizing:border-box;pointer-events:none;-webkit-app-region:drag;z-index:60;overflow:hidden;}',
      '.dsarb-strip.is-center{justify-content:center;padding:0 160px;}',
      '.dsarb-strip.is-right{justify-content:flex-end;padding:0 150px 0 240px;}',
      '.dsarb-strip.is-left{justify-content:flex-start;padding:0 160px 0 232px;}',
      '.dsarb-strip-inner{display:inline-flex;align-items:center;gap:10px;height:100%;max-width:100%;min-width:0;overflow:hidden;animation:dsarb-fade .3s ease both;}',
      '.dsarb-strip-img{display:block;flex:none;height:100%;width:auto;object-fit:contain;pointer-events:none;}',
      '.dsarb-strip-text{display:inline-block;min-width:0;line-height:1.2;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;}',
      '.dsarb-page{display:flex;flex-direction:column;gap:16px;box-sizing:border-box;max-width:760px;padding:24px;color:var(--dsw-alias-label-primary);}',
      '.dsarb-head{display:flex;flex-direction:column;gap:6px;}',
      '.dsarb-title{font-size:18px;font-weight:600;line-height:1.4;}',
      '.dsarb-desc{font-size:13px;line-height:1.7;color:var(--dsw-alias-label-secondary);}',
      '.dsarb-card{display:flex;flex-direction:column;gap:20px;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);}',
      '.dsarb-field{display:flex;flex-direction:column;gap:8px;min-width:0;}',
      '.dsarb-label{font-size:14px;font-weight:500;}',
      '.dsarb-hint{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);}',
      '.dsarb-inline{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0;}',
      '.dsarb-input{box-sizing:border-box;height:32px;width:100%;max-width:360px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;}',
      '.dsarb-input:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}',
      '.dsarb-select{max-width:160px;}',
      '.dsarb-select-wide{max-width:260px;}',
      '.dsarb-num{width:66px;max-width:66px;padding:0 8px;}',
      '.dsarb-num-wide{width:96px;max-width:96px;}',
      '.dsarb-items{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0;}',
      '.dsarb-rgb{display:inline-flex;align-items:center;gap:6px;}',
      '.dsarb-rgb-name{font-size:12px;color:var(--dsw-alias-label-secondary);width:12px;}',
      '.dsarb-swatch{box-sizing:border-box;width:36px;height:32px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;}',
      '.dsarb-hex{font-size:12px;letter-spacing:.04em;color:var(--dsw-alias-label-secondary);}',
      '.dsarb-check{display:inline-flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;user-select:none;}',
      '.dsarb-check input{width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-brand-primary);cursor:pointer;}',
      '.dsarb-btn{box-sizing:border-box;height:32px;padding:0 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;cursor:pointer;}',
      '.dsarb-btn:hover:not(:disabled){border-color:var(--dsw-alias-border-l2);}',
      '.dsarb-btn:disabled{opacity:.5;cursor:default;}',
      '.dsarb-btn.is-active{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);}',
      '.dsarb-preview{display:flex;align-items:center;box-sizing:border-box;overflow:hidden;height:40px;max-width:100%;padding:0 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-specific-sidebar-fill);}',
      '.dsarb-preview.is-center{justify-content:center;}',
      '.dsarb-preview.is-right{justify-content:flex-end;}',
      '.dsarb-preview.is-left{justify-content:flex-start;}',
      '.dsarb-foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}',
      '.dsarb-status{font-size:12px;color:var(--dsw-alias-label-secondary);}',
      '.dsarb-error{color:var(--dsw-alias-state-error-primary);}',
    ].join('');

    function apply(ctx) {
      // The strip is the whole feature, so it registers first: a locale problem
      // must not cost the capability.
      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register(
          {
            name: 'shell.overlay',
            id: 'app-row-brand',
            order: 5,
            label: () => t('section.title'),
          },
          TitlebarBrand,
        ),
      );

      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'app-row-brand',
            order: 30,
            label: () => t('section.title'),
          },
          SettingsPage,
        ),
      );

      try {
        const locale = ctx.get ? ctx.get('locale') : undefined;
        if (locale && typeof locale.register === 'function') {
          ctx.effect(() => locale.register(NS, { en: EN, zh: ZH }));
          translate = locale.bind(NS);
        }
      } catch (error) {
        /* the bundled dictionaries still cover both shipped locales */
      }

      ctx.effect(() => {
        if (typeof document === 'undefined' || !document.head) return () => {};
        let tag = document.getElementById(STYLE_ID);
        if (tag) return () => {};
        tag = document.createElement('style');
        tag.id = STYLE_ID;
        tag.dataset.plugin = 'dsh-app-row-brand';
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => {
          if (tag.parentNode) tag.parentNode.removeChild(tag);
        };
      });

      ctx.effect(() => {
        if (typeof window === 'undefined') return () => {};
        const onStorage = (event) => {
          if (event.key !== STORAGE_KEY) return;
          currentConfig = readConfig();
          emit();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
      });
    }

    return {
      inject: ['slots'],
      apply: apply,
    };
  },
});
