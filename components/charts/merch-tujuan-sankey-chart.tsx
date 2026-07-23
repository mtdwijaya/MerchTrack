"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Layer,
  Rectangle,
  ResponsiveContainer,
  Sankey,
  Tooltip,
} from "recharts";

import {
  buildMerchColorMap,
  buildTujuanColorMap,
} from "@/constants/chart-colors";

export type SankeyLinkInput = {
  source: string;
  target: string;
  value: number;
};

interface Props {
  links: SankeyLinkInput[];
  emptyMessage?: string;
}

type SankeyNodePayload = {
  name: string;
  side: "merch" | "tujuan";
  color: string;
  total: number;
  /** diisi Recharts saat layout */
  value?: number;
};

type SankeyLinkInputPayload = {
  source: number;
  target: number;
  value: number;
  color: string;
  sourceName: string;
  targetName: string;
};

/** Payload link saat render custom (source/target jadi objek node) */
type SankeyLinkRenderPayload = {
  value: number;
  color?: string;
  sourceName?: string;
  targetName?: string;
  source: SankeyNodePayload & { name: string; value?: number };
  target: SankeyNodePayload & { name: string; value?: number };
};

type HoverTarget =
  | { type: "link"; sourceName: string; targetName: string }
  | { type: "node"; name: string; side: "merch" | "tujuan" }
  | null;

function formatPcs(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}Jt`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}rb`;
  }
  return value.toLocaleString("id-ID");
}

/** Perkiraan lebar teks SVG (font ~10px) */
function estimateTextWidth(text: string, charWidth = 6.1) {
  return Math.ceil(text.length * charWidth);
}

/** Default: hanya volume terbesar yang terang; sisanya redup */
function opacityForValue(value: number, maxValue: number) {
  if (maxValue <= 0) return 0.28;
  return value >= maxValue ? 0.92 : 0.22;
}

function resolveLinkEnds(payload: SankeyLinkRenderPayload) {
  const sourceName = payload.sourceName ?? payload.source.name;
  const targetName = payload.targetName ?? payload.target.name;
  const color =
    payload.color ??
    payload.source.color ??
    "#EF9A9A";
  return { sourceName, targetName, color };
}

function isNodeActive(hovered: HoverTarget, node: SankeyNodePayload) {
  if (hovered == null) return true;
  if (hovered.type === "node") {
    return hovered.name === node.name && hovered.side === node.side;
  }
  return node.side === "merch"
    ? hovered.sourceName === node.name
    : hovered.targetName === node.name;
}

function isLinkActive(
  hovered: HoverTarget,
  sourceName: string,
  targetName: string
) {
  if (hovered == null) return true;
  if (hovered.type === "link") {
    return (
      hovered.sourceName === sourceName && hovered.targetName === targetName
    );
  }
  return hovered.side === "merch"
    ? hovered.name === sourceName
    : hovered.name === targetName;
}

function PillLabel({
  x,
  y,
  name,
  value,
  color,
  align,
}: {
  x: number;
  y: number;
  name: string;
  value: number;
  color: string;
  align: "left" | "right";
}) {
  const valueText = `${formatPcs(value)} pcs`;
  const nameWidth = estimateTextWidth(name, 6.4);
  const valueWidth = estimateTextWidth(valueText, 5.6);
  const gap = 6;
  const paddingX = 10;
  const approxWidth = paddingX * 2 + nameWidth + gap + valueWidth;
  const height = 22;
  const rectX = align === "left" ? x : x - approxWidth;
  const textStart = rectX + paddingX;

  return (
    <g style={{ pointerEvents: "none" }}>
      <title>{`${name} · ${valueText}`}</title>
      <rect
        x={rectX}
        y={y - height / 2}
        width={approxWidth}
        height={height}
        rx={11}
        ry={11}
        fill="rgba(26, 26, 26, 0.78)"
      />
      <text
        x={textStart}
        y={y}
        dominantBaseline="middle"
        fontSize={10}
        fontWeight={700}
        fill={color}
      >
        {name}
      </text>
      <text
        x={textStart + nameWidth + gap}
        y={y}
        dominantBaseline="middle"
        fontSize={10}
        fontWeight={500}
        fill="#F3F4F6"
      >
        {valueText}
      </text>
    </g>
  );
}

function SankeyNode(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: SankeyNodePayload;
  maxTotalBySide: { merch: number; tujuan: number };
  hovered: HoverTarget;
  onHover: (target: HoverTarget) => void;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    payload,
    maxTotalBySide,
    hovered,
    onHover,
  } = props;

  if (!payload?.name || !payload.side) return null;

  const isMerch = payload.side === "merch";
  const active = isNodeActive(hovered, payload);
  const total = payload.total ?? Number(payload.value ?? 0);
  const maxOnSide = maxTotalBySide[payload.side];
  const isTop = maxOnSide > 0 && total >= maxOnSide;

  // Default: hanya node teratas (volume terbesar) terang; hover: path aktif terang
  let fillOpacity = isTop ? 0.95 : 0.38;
  let strokeOpacity = isTop ? 1 : 0.45;
  if (hovered != null) {
    fillOpacity = active ? 0.98 : 0.28;
    strokeOpacity = active ? 1 : 0.35;
  }

  const pillX = isMerch ? x + width + 8 : x - 8;
  const pillAlign = isMerch ? "left" : "right";

  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={Math.max(width, 6)}
        height={Math.max(height, 4)}
        fill={payload.color}
        fillOpacity={fillOpacity}
        stroke={payload.color}
        strokeOpacity={strokeOpacity}
        strokeWidth={1}
        radius={2}
        style={{ cursor: "pointer", transition: "fill-opacity 140ms ease" }}
        onMouseEnter={() =>
          onHover({ type: "node", name: payload.name, side: payload.side })
        }
        onMouseLeave={() => onHover(null)}
      />
      <PillLabel
        x={pillX}
        y={y + Math.max(height, 4) / 2}
        name={payload.name}
        value={total}
        color={payload.color}
        align={pillAlign}
      />
    </Layer>
  );
}

function SankeyLink(props: {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  payload?: SankeyLinkRenderPayload;
  maxValue: number;
  hovered: HoverTarget;
  onHover: (target: HoverTarget) => void;
}) {
  const {
    sourceX = 0,
    targetX = 0,
    sourceY = 0,
    targetY = 0,
    sourceControlX = 0,
    targetControlX = 0,
    linkWidth = 0,
    payload,
    maxValue,
    hovered,
    onHover,
  } = props;

  if (!payload?.source || !payload?.target) return null;

  const { sourceName, targetName, color } = resolveLinkEnds(payload);
  const active = isLinkActive(hovered, sourceName, targetName);
  const baseOpacity = opacityForValue(payload.value, maxValue);
  // Default: hanya link terbesar terang; hover: path aktif terang
  const strokeOpacity =
    hovered == null ? baseOpacity : active ? 0.95 : 0.16;

  return (
    <Layer>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(linkWidth, 1.5)}
        strokeOpacity={strokeOpacity}
        style={{ cursor: "pointer", transition: "stroke-opacity 140ms ease" }}
        onMouseEnter={() => onHover({ type: "link", sourceName, targetName })}
        onMouseLeave={() => onHover(null)}
      />
      {active && hovered?.type === "link" && linkWidth >= 8 && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={(sourceX + targetX) / 2 - 36}
            y={(sourceY + targetY) / 2 - 10}
            width={72}
            height={20}
            rx={10}
            fill="rgba(26, 26, 26, 0.85)"
          />
          <text
            x={(sourceX + targetX) / 2}
            y={(sourceY + targetY) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fontWeight={600}
            fill="#F9FAFB"
          >
            {formatPcs(payload.value)} pcs
          </text>
        </g>
      )}
    </Layer>
  );
}

export default function MerchTujuanSankeyChart({
  links,
  emptyMessage = "Belum ada data distribusi",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<HoverTarget>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, maxValue, maxTotalBySide } = useMemo(() => {
    const filtered = links.filter((link) => link.value > 0);

    const merchTotals = new Map<string, number>();
    const tujuanTotals = new Map<string, number>();
    for (const link of filtered) {
      merchTotals.set(
        link.source,
        (merchTotals.get(link.source) ?? 0) + link.value
      );
      tujuanTotals.set(
        link.target,
        (tujuanTotals.get(link.target) ?? 0) + link.value
      );
    }

    // Volume terbesar di atas (urut menurun)
    const merchOrdered = [...merchTotals.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"))
      .map(([name]) => name);
    const tujuanOrdered = [...tujuanTotals.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"))
      .map(([name]) => name);

    const merchColors = buildMerchColorMap(merchOrdered);
    const tujuanColors = buildTujuanColorMap(tujuanOrdered);

    const nodes: SankeyNodePayload[] = [];
    const nodeIndex = new Map<string, number>();

    for (const name of merchOrdered) {
      nodeIndex.set(`merch:${name}`, nodes.length);
      nodes.push({
        name,
        side: "merch",
        color: merchColors.get(name) ?? "#D32F2F",
        total: merchTotals.get(name) ?? 0,
      });
    }
    for (const name of tujuanOrdered) {
      nodeIndex.set(`tujuan:${name}`, nodes.length);
      nodes.push({
        name,
        side: "tujuan",
        color: tujuanColors.get(name) ?? "#78909C",
        total: tujuanTotals.get(name) ?? 0,
      });
    }

    const sankeyLinks: SankeyLinkInputPayload[] = filtered
      .map((link) => ({
        source: nodeIndex.get(`merch:${link.source}`) ?? 0,
        target: nodeIndex.get(`tujuan:${link.target}`) ?? 0,
        value: link.value,
        color: merchColors.get(link.source) ?? "#EF9A9A",
        sourceName: link.source,
        targetName: link.target,
      }))
      .sort((a, b) => b.value - a.value);

    const max = sankeyLinks.reduce((m, link) => Math.max(m, link.value), 0);
    const maxTotalBySide = {
      merch: merchOrdered[0] ? (merchTotals.get(merchOrdered[0]) ?? 0) : 0,
      tujuan: tujuanOrdered[0]
        ? (tujuanTotals.get(tujuanOrdered[0]) ?? 0)
        : 0,
    };

    return {
      data: { nodes, links: sankeyLinks },
      maxValue: max,
      maxTotalBySide,
    };
  }, [links]);

  if (data.links.length === 0) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center text-sm text-[#9A9A9A]">
        {emptyMessage}
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="h-full min-h-40 w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
    );
  }

  return (
    <div className="relative h-full min-h-50 w-full min-w-0">
      <div className="pointer-events-none absolute inset-x-3 top-0 z-10 flex justify-between px-1 text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        <span className="text-[#B71C1C]">Merchandise</span>
        <span className="text-[#546E7A]">Tujuan</span>
      </div>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 480, height: 260 }}
      >
        <Sankey
          data={data}
          nodePadding={16}
          nodeWidth={8}
          linkCurvature={0.55}
          iterations={0}
          verticalAlign="top"
          sort={false}
          margin={{ top: 24, right: 28, bottom: 22, left: 28 }}
          node={
            <SankeyNode
              maxTotalBySide={maxTotalBySide}
              hovered={hovered}
              onHover={setHovered}
            />
          }
          link={
            <SankeyLink
              maxValue={maxValue}
              hovered={hovered}
              onHover={setHovered}
            />
          }
        >
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E8E4DF",
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString("id-ID")} pcs`,
              "Terdistribusi",
            ]}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
