"use client";

import { useEffect, useMemo, useState } from "react";
import { Layer, Rectangle, ResponsiveContainer, Sankey, Tooltip } from "recharts";

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
};

type SankeyLinkPayload = {
  source: number;
  target: number;
  value: number;
  color: string;
};

function truncateLabel(label: string, max = 16) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function SankeyNode(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: SankeyNodePayload;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;

  if (!payload) return null;

  const isMerch = payload.side === "merch";
  const label = truncateLabel(payload.name);
  const textX = isMerch ? x - 6 : x + width + 6;
  const textAnchor = isMerch ? "end" : "start";

  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={payload.color}
        fillOpacity={0.95}
        stroke={payload.color}
        strokeWidth={1}
        radius={2}
      />
      <text
        x={textX}
        y={y + height / 2}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize={10}
        fill="#4A4A4A"
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
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
  payload?: SankeyLinkPayload;
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
  } = props;

  const color = payload?.color ?? "#EF9A9A";

  return (
    <Layer>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(linkWidth, 1)}
        strokeOpacity={0.45}
      />
    </Layer>
  );
}

export default function MerchTujuanSankeyChart({
  links,
  emptyMessage = "Belum ada data distribusi",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    const merchNames = links.map((link) => link.source);
    const tujuanNames = links.map((link) => link.target);
    const merchColors = buildMerchColorMap(merchNames);
    const tujuanColors = buildTujuanColorMap(tujuanNames);

    const nodeIndex = new Map<string, number>();
    const nodes: SankeyNodePayload[] = [];

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
      });
      return index;
    }

    const sankeyLinks: SankeyLinkPayload[] = links
      .filter((link) => link.value > 0)
      .map((link) => {
        const source = ensureNode(link.source, "merch");
        const target = ensureNode(link.target, "tujuan");
        return {
          source,
          target,
          value: link.value,
          color: merchColors.get(link.source) ?? "#EF9A9A",
        };
      });

    return { nodes, links: sankeyLinks };
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
    <div className="relative h-full min-h-[160px] w-full min-w-0">
      <div className="pointer-events-none absolute inset-x-2 top-0 z-10 flex justify-between px-1 text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        <span>Merchandise</span>
        <span>Tujuan</span>
      </div>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 220 }}
      >
        <Sankey
          data={data}
          nodePadding={14}
          nodeWidth={10}
          linkCurvature={0.5}
          iterations={32}
          margin={{ top: 22, right: 88, bottom: 8, left: 88 }}
          node={<SankeyNode />}
          link={<SankeyLink />}
        >
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E8E4DF",
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString("id-ID")} pcs`,
              "Alur",
            ]}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
