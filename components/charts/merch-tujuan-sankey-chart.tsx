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

/** Opacity default: volume terbesar paling terang */
function opacityForValue(value: number, maxValue: number) {
  if (maxValue <= 0) return 0.35;
  const ratio = value / maxValue;
  return 0.18 + ratio * 0.72;
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
  hovered: HoverTarget;
  onHover: (target: HoverTarget) => void;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    payload,
    hovered,
    onHover,
  } = props;

  if (!payload?.name || !payload.side) return null;

  const isMerch = payload.side === "merch";
  const active = isNodeActive(hovered, payload);
  const dimmed = hovered != null && !active;
  const fillOpacity = dimmed ? 0.4 : 0.95;

  const pillX = isMerch ? x + width + 8 : x - 8;
  const pillAlign = isMerch ? "left" : "right";
  const total = payload.total ?? Number(payload.value ?? 0);

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
        strokeOpacity={dimmed ? 0.5 : 1}
        strokeWidth={1}
        radius={2}
        style={{ cursor: "pointer" }}
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
  // Saat hover: aktif terang; lainnya tetap terlihat (tidak hampir hilang)
  const strokeOpacity =
    hovered == null ? baseOpacity : active ? 0.95 : 0.28;

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

  const { data, maxValue } = useMemo(() => {
    const merchNames = links.map((link) => link.source);
    const tujuanNames = links.map((link) => link.target);
    const merchColors = buildMerchColorMap(merchNames);
    const tujuanColors = buildTujuanColorMap(tujuanNames);

    const nodeIndex = new Map<string, number>();
    const nodes: SankeyNodePayload[] = [];
    const totals = new Map<string, number>();

    function ensureNode(name: string, side: "merch" | "tujuan") {
      const key = `${side}:${name}`;
      const existing = nodeIndex.get(key);
      if (existing != null) return existing;
      const index = nodes.length;
      nodeIndex.set(key, index);
      nodes.push({
        name,
        side,
        color:
          side === "merch"
            ? (merchColors.get(name) ?? "#D32F2F")
            : (tujuanColors.get(name) ?? "#78909C"),
        total: 0,
      });
      return index;
    }

    const filtered = links.filter((link) => link.value > 0);
    const sankeyLinks: SankeyLinkInputPayload[] = filtered.map((link) => {
      const source = ensureNode(link.source, "merch");
      const target = ensureNode(link.target, "tujuan");
      totals.set(
        `merch:${link.source}`,
        (totals.get(`merch:${link.source}`) ?? 0) + link.value
      );
      totals.set(
        `tujuan:${link.target}`,
        (totals.get(`tujuan:${link.target}`) ?? 0) + link.value
      );
      return {
        source,
        target,
        value: link.value,
        color: merchColors.get(link.source) ?? "#EF9A9A",
        sourceName: link.source,
        targetName: link.target,
      };
    });

    for (const node of nodes) {
      node.total = totals.get(`${node.side}:${node.name}`) ?? 0;
    }

    const max = sankeyLinks.reduce((m, link) => Math.max(m, link.value), 0);

    return { data: { nodes, links: sankeyLinks }, maxValue: max };
  }, [links]);

  if (data.links.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-[#9A9A9A]">
        {emptyMessage}
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="h-full min-h-[160px] w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
    );
  }

  return (
    <div className="relative h-full min-h-[200px] w-full min-w-0">
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
          iterations={48}
          margin={{ top: 24, right: 28, bottom: 10, left: 28 }}
          node={<SankeyNode hovered={hovered} onHover={setHovered} />}
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
