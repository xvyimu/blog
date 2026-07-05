'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePersistedEnum } from '@/hooks/usePersistedEnum';

type FontSize = 'sm' | 'md' | 'lg';
type Width = 'narrow' | 'normal' | 'wide';

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '0.92rem',
  md: '1rem',
  lg: '1.12rem',
};
const WIDTH_MAP: Record<Width, string> = {
  narrow: '640px',
  normal: '720px',
  wide: '840px',
};

const FONT_SIZES: FontSize[] = ['sm', 'md', 'lg'];
const WIDTHS: Width[] = ['narrow', 'normal', 'wide'];

const FONT_TITLES: Record<FontSize, string> = {
  sm: '小字号',
  md: '标准字号',
  lg: '大字号',
};
const WIDTH_TITLES: Record<Width, string> = {
  narrow: '窄栏',
  normal: '标准栏宽',
  wide: '宽栏',
};

export default function ReadingPreferences({
  targetId = 'article-content',
}: {
  targetId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const {
    value: fontSize,
    cycle: cycleFontSize,
    hydrated,
  } = usePersistedEnum<FontSize>({
    key: 'reading-font-size',
    defaultValue: 'md',
    validValues: FONT_SIZES,
  });
  const { value: width, cycle: cycleWidth } = usePersistedEnum<Width>({
    key: 'reading-width',
    defaultValue: 'normal',
    validValues: WIDTHS,
  });

  // Apply font size + width to the prose container (skip until restored)
  useEffect(() => {
    if (!hydrated) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.style.setProperty('--reading-font-size', FONT_SIZE_MAP[fontSize]);
    el.style.setProperty('--reading-width', WIDTH_MAP[width]);
  }, [fontSize, width, targetId, hydrated]);

  const fontLabel = FONT_TITLES[fontSize];
  const widthLabel = WIDTH_TITLES[width];

  useEffect(() => {
    setMounted(true);
  }, []);

  const panel = (
    <div className="reading-prefs reading-prefs--left" role="group" aria-label="阅读设置">
      <div className="reading-prefs__head" aria-hidden="true">
        <span className="reading-prefs__title">阅读设置</span>
        <span className="reading-prefs__hint">点击切换</span>
      </div>
      <button
        type="button"
        onClick={cycleFontSize}
        className="reading-prefs__btn"
        title={`切换字号，当前为${fontLabel}`}
        aria-label={`切换字号，当前为${fontLabel}`}
      >
        <span className="reading-prefs__icon" aria-hidden="true">
          字
        </span>
        <span className="reading-prefs__text">
          <span className="reading-prefs__label">字号</span>
          <span className="reading-prefs__value">{fontLabel}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={cycleWidth}
        className="reading-prefs__btn"
        title={`切换栏宽，当前为${widthLabel}`}
        aria-label={`切换栏宽，当前为${widthLabel}`}
      >
        <span className="reading-prefs__icon" aria-hidden="true">
          栏
        </span>
        <span className="reading-prefs__text">
          <span className="reading-prefs__label">栏宽</span>
          <span className="reading-prefs__value">{widthLabel}</span>
        </span>
      </button>
    </div>
  );

  if (!mounted) return null;

  return createPortal(panel, document.body);
}
