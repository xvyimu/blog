'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Link from 'next/link';
import type { GardenGraph } from '@/lib/posts/link-graph';
import { filterGardenGraph, layoutForceGraph } from '@/lib/posts/force-layout';
import {
  clearGardenViewStorage,
  loadGardenViewFromStorage,
  mergePositions,
  saveGardenViewToStorage,
  serializeGardenView,
  type GardenViewPosition,
} from '@/lib/posts/garden-view-storage';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const WIDTH = 640;
const HEIGHT = 420;
const DRAG_CLICK_THRESHOLD = 5;

function mapToRecord(
  map: Map<string, GardenViewPosition>,
): Record<string, GardenViewPosition> {
  return Object.fromEntries(map.entries());
}

export default function GardenExplorer({ graph }: { graph: GardenGraph }) {
  const reducedMotion = usePrefersReducedMotion();
  const [series, setSeries] = useState('');
  const [tag, setTag] = useState('');
  const [focus, setFocus] = useState<string | null>(null);
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);
  const [positions, setPositions] = useState<Map<string, GardenViewPosition> | null>(
    null,
  );
  const [viewStatus, setViewStatus] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    slug: string;
    startClientX: number;
    startClientY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);
  // Skip one force recompute after applying a saved view (filters + positions).
  const skipNextLayoutRef = useRef(false);

  const seriesOptions = useMemo(() => {
    const set = new Set<string>();
    for (const n of graph.nodes) {
      if (n.series) set.add(n.series);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [graph.nodes]);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    for (const n of graph.nodes) {
      for (const t of n.tags) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [graph.nodes]);

  const filtered = useMemo(
    () => filterGardenGraph(graph, { series, tag }),
    [graph, series, tag],
  );

  const neighborsOf = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of filtered.edges) {
      if (!map.has(edge.from)) map.set(edge.from, new Set());
      if (!map.has(edge.to)) map.set(edge.to, new Set());
      map.get(edge.from)!.add(edge.to);
      map.get(edge.to)!.add(edge.from);
    }
    return map;
  }, [filtered.edges]);

  const titleBySlug = useMemo(
    () => new Map(graph.nodes.map((n) => [n.slug, n.title])),
    [graph.nodes],
  );

  // Restore saved view after mount
  useEffect(() => {
    const saved = loadGardenViewFromStorage(
      typeof window !== 'undefined' ? window.localStorage : null,
    );
    if (saved) {
      skipNextLayoutRef.current = true;
      setSeries(saved.series);
      setTag(saved.tag);
      setPositions(new Map(Object.entries(saved.positions)));
      setViewStatus('已恢复本机保存的视图');
    }
    setHydrated(true);
  }, []);

  // Recompute force layout when filters / motion / graph change
  useEffect(() => {
    if (!hydrated) return;
    if (reducedMotion || filtered.nodes.length === 0) {
      if (!skipNextLayoutRef.current) setPositions(null);
      skipNextLayoutRef.current = false;
      return;
    }
    if (skipNextLayoutRef.current) {
      skipNextLayoutRef.current = false;
      // Ensure every visible node has a position (new nodes after content add)
      setPositions((prev) => {
        const layout = layoutForceGraph(
          filtered.nodes.map((n) => n.slug),
          filtered.edges.map((e) => ({ source: e.from, target: e.to })),
          { width: WIDTH, height: HEIGHT, iterations: 140 },
        );
        return mergePositions(layout, prev ? mapToRecord(prev) : null);
      });
      return;
    }
    const layout = layoutForceGraph(
      filtered.nodes.map((n) => n.slug),
      filtered.edges.map((e) => ({ source: e.from, target: e.to })),
      { width: WIDTH, height: HEIGHT, iterations: 140 },
    );
    setPositions(layout);
  }, [filtered, reducedMotion, hydrated]);

  useEffect(() => {
    if (focus && !filtered.nodes.some((n) => n.slug === focus)) {
      setFocus(null);
    }
  }, [filtered.nodes, focus]);

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.min(WIDTH - 24, Math.max(24, local.x)),
      y: Math.min(HEIGHT - 24, Math.max(24, local.y)),
    };
  }, []);

  const onNodePointerDown = (slug: string, e: ReactPointerEvent<SVGCircleElement>) => {
    if (reducedMotion || !positions) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      slug,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      pointerId: e.pointerId,
    };
    setFocus(slug);
  };

  const onNodePointerMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_CLICK_THRESHOLD) return;
    drag.moved = true;
    const local = clientToSvg(e.clientX, e.clientY);
    if (!local) return;
    setPositions((prev) => {
      if (!prev) return prev;
      const next = new Map(prev);
      next.set(drag.slug, local);
      return next;
    });
  };

  const endDrag = (e: ReactPointerEvent<SVGCircleElement>, navigateIfClick: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const wasClick = navigateIfClick && !drag.moved;
    const slug = drag.slug;
    dragRef.current = null;
    if (wasClick) {
      window.location.assign(`/blog/${slug}`);
    }
  };

  const onNodePointerUp = (e: ReactPointerEvent<SVGCircleElement>) => {
    endDrag(e, true);
  };

  const onNodePointerCancel = (e: ReactPointerEvent<SVGCircleElement>) => {
    endDrag(e, false);
  };

  const handleSaveView = () => {
    if (!positions || positions.size === 0) {
      setViewStatus('没有可保存的节点位置');
      return;
    }
    const view = serializeGardenView(series, tag, positions);
    const ok = saveGardenViewToStorage(
      typeof window !== 'undefined' ? window.localStorage : null,
      view,
    );
    setViewStatus(ok ? '视图已保存到本机' : '保存失败（隐私模式或存储已满）');
  };

  const handleClearView = () => {
    clearGardenViewStorage(typeof window !== 'undefined' ? window.localStorage : null);
    setViewStatus('已清除本机保存的视图');
    // Re-run layout for current filters
    if (!reducedMotion && filtered.nodes.length > 0) {
      const layout = layoutForceGraph(
        filtered.nodes.map((n) => n.slug),
        filtered.edges.map((e) => ({ source: e.from, target: e.to })),
        { width: WIDTH, height: HEIGHT, iterations: 140 },
      );
      setPositions(layout);
    }
  };

  const handleRelayout = () => {
    if (reducedMotion || filtered.nodes.length === 0) return;
    const layout = layoutForceGraph(
      filtered.nodes.map((n) => n.slug),
      filtered.edges.map((e) => ({ source: e.from, target: e.to })),
      { width: WIDTH, height: HEIGHT, iterations: 160 },
    );
    setPositions(layout);
    setViewStatus('已重新计算力导向布局');
  };

  return (
    <div className="garden-explorer">
      <div className="garden-explorer__filters" role="group" aria-label="花园筛选">
        <label className="garden-explorer__field">
          <span className="garden-explorer__field-label">专题</span>
          <select
            className="garden-explorer__select"
            value={series}
            onChange={(e) => setSeries(e.target.value)}
          >
            <option value="">全部专题</option>
            {seriesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="garden-explorer__field">
          <span className="garden-explorer__field-label">标签</span>
          <select
            className="garden-explorer__select"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">全部标签</option>
            {tagOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {(series || tag) && (
          <button
            type="button"
            className="garden-explorer__reset"
            onClick={() => {
              setSeries('');
              setTag('');
            }}
          >
            清除筛选
          </button>
        )}
        <div className="garden-explorer__view-actions">
          <button
            type="button"
            className="garden-explorer__reset"
            onClick={handleSaveView}
            disabled={!positions}
          >
            保存视图
          </button>
          <button
            type="button"
            className="garden-explorer__reset"
            onClick={handleClearView}
          >
            清除保存
          </button>
          <button
            type="button"
            className="garden-explorer__reset"
            onClick={handleRelayout}
            disabled={reducedMotion || !positions}
          >
            重新布局
          </button>
        </div>
        <p className="garden-explorer__count">
          {filtered.nodes.length} 节点 · {filtered.edges.length} 边
          {reducedMotion
            ? ' · 已按系统设置关闭力导向'
            : ' · 力导向 · 拖拽节点 · 轻点打开文章'}
          {viewStatus ? ` · ${viewStatus}` : ''}
        </p>
      </div>

      {positions && !reducedMotion ? (
        <div className="garden-explorer__canvas-wrap">
          <svg
            ref={svgRef}
            className="garden-explorer__svg"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label="笔记力导向连线，可拖拽节点"
          >
            {filtered.edges.map((edge) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;
              const highlight = hoverSlug ?? focus;
              const dim =
                highlight != null && highlight !== edge.from && highlight !== edge.to;
              return (
                <line
                  key={`${edge.from}->${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className={
                    dim
                      ? 'garden-explorer__edge garden-explorer__edge--dim'
                      : 'garden-explorer__edge'
                  }
                />
              );
            })}
            {filtered.nodes.map((node) => {
              const p = positions.get(node.slug);
              if (!p) return null;
              const highlight = hoverSlug ?? focus;
              const active = highlight === node.slug;
              const neighbors = highlight ? neighborsOf.get(highlight) : undefined;
              const dim =
                highlight != null && !active && !(neighbors?.has(node.slug) ?? false);
              return (
                <g key={node.slug} transform={`translate(${p.x},${p.y})`}>
                  <circle
                    r={active ? 8 : 6}
                    className={
                      dim
                        ? 'garden-explorer__node garden-explorer__node--dim'
                        : 'garden-explorer__node'
                    }
                    tabIndex={0}
                    role="link"
                    aria-label={node.title}
                    onPointerDown={(e) => onNodePointerDown(node.slug, e)}
                    onPointerMove={onNodePointerMove}
                    onPointerUp={onNodePointerUp}
                    onPointerCancel={onNodePointerCancel}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        window.location.assign(`/blog/${node.slug}`);
                      }
                    }}
                    onMouseEnter={() => setHoverSlug(node.slug)}
                    onMouseLeave={() => setHoverSlug(null)}
                    onFocus={() => setFocus(node.slug)}
                    onBlur={() => setFocus(null)}
                  />
                  <title>{`${node.title}（拖拽移动，轻点打开）`}</title>
                  <text
                    y={-12}
                    textAnchor="middle"
                    className={
                      dim
                        ? 'garden-explorer__label garden-explorer__label--dim'
                        : 'garden-explorer__label'
                    }
                  >
                    {node.title.length > 10 ? `${node.title.slice(0, 10)}…` : node.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <p className="garden-explorer__list-only-hint">
          {filtered.nodes.length === 0
            ? '当前筛选下没有节点，试试清除筛选。'
            : '力导向图已关闭（减少动态），请使用下方边列表浏览。'}
        </p>
      )}

      <div className="garden-page__lists">
        <section
          className="article-panel garden-page__panel"
          aria-labelledby="garden-edges-title"
        >
          <div className="article-panel__head">
            <div>
              <p className="article-panel__label">Edges</p>
              <h2 id="garden-edges-title" className="article-panel__title">
                有向边
              </h2>
              <p className="article-panel__desc">筛选后的从 → 到</p>
            </div>
          </div>
          {filtered.edges.length === 0 ? (
            <p className="article-panel__desc">暂无边</p>
          ) : (
            <ul className="garden-page__edge-list">
              {filtered.edges.map((edge) => (
                <li key={`${edge.from}->${edge.to}`} className="garden-page__edge-item">
                  <Link href={`/blog/${edge.from}`} className="garden-page__edge-link">
                    {titleBySlug.get(edge.from) ?? edge.from}
                  </Link>
                  <span className="garden-page__arrow" aria-hidden="true">
                    →
                  </span>
                  <Link href={`/blog/${edge.to}`} className="garden-page__edge-link">
                    {titleBySlug.get(edge.to) ?? edge.to}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="article-panel garden-page__panel"
          aria-labelledby="garden-nodes-title"
        >
          <div className="article-panel__head">
            <div>
              <p className="article-panel__label">Notes</p>
              <h2 id="garden-nodes-title" className="article-panel__title">
                笔记
              </h2>
            </div>
          </div>
          <ul className="garden-page__node-list">
            {filtered.nodes.map((node) => (
              <li key={node.slug}>
                <Link href={`/blog/${node.slug}`} className="garden-page__node-link">
                  {node.title}
                </Link>
                {node.series ? (
                  <span className="garden-explorer__meta-chip">{node.series}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
