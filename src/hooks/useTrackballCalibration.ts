import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SchemaItem } from '@/lib/schema';
import { normalizeAngle, pointToAngle } from '@/lib/angleUtils';

interface CalState {
  contact: number;
}

export interface TrackballGroup {
  order: number[];
  byIndex: Map<number, SchemaItem[]>;
}

export function useTrackballCalibration(
  items: SchemaItem[],
  params: Record<number, number | string>,
  connected?: Record<number, boolean> | null,
) {
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [state, setState] = useState<Record<number, CalState>>({});
  const prevParamsRef = useRef<Record<number, number | string>>({});

  const baseGrouped = useMemo(() => {
    const byIndex = new Map<number, SchemaItem[]>();
    for (const item of items) {
      const match = /_(\d+)$/.exec(item.key);
      if (!match) continue;
      const idx = Number(match[1]);
      if (Number.isNaN(idx) || idx < 0) continue; // 無効な値をスキップ
      if (!byIndex.has(idx)) byIndex.set(idx, []);
      byIndex.get(idx)!.push(item);
    }
    // 数値順にソート (0, 1, 2, 3, ...)
    const order = Array.from(byIndex.keys()).sort((a, b) => a - b);
    return { order, byIndex };
  }, [items]);

  const selectableOrder = useMemo(() => {
    if (connected == null) {
      return baseGrouped.order;
    }
    return baseGrouped.order.filter((idx) => connected[idx] === true);
  }, [baseGrouped.order, connected]);

  const grouped = useMemo(
    () => ({
      order: baseGrouped.order,
      byIndex: baseGrouped.byIndex,
    }),
    [baseGrouped.byIndex, baseGrouped.order],
  );

  useEffect(() => {
    if (selectableOrder.length === 0) {
      if (activeKey !== null) setActiveKey(null);
      return;
    }
    if (activeKey === null || !selectableOrder.includes(activeKey)) {
      setActiveKey(selectableOrder[0] ?? null);
    }
  }, [activeKey, selectableOrder]);

  const resolvedActiveKey =
    activeKey !== null && selectableOrder.includes(activeKey)
      ? activeKey
      : (selectableOrder[0] ?? null);
  const activeIndex =
    resolvedActiveKey === null ? 0 : Math.max(grouped.order.indexOf(resolvedActiveKey), 0);
  const activeGroup =
    resolvedActiveKey === null ? [] : (grouped.byIndex.get(resolvedActiveKey) ?? []);
  const angleItem = activeGroup.find((item) => item.key.startsWith('tb_angle_'));
  const otherItems = activeGroup.filter((item) => item !== angleItem);

  const deviceAngle = useMemo(() => {
    if (!angleItem) return 0;
    return Number(params[angleItem.id] ?? angleItem.default ?? 0);
  }, [angleItem, params]);

  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const item of items) {
        if (!item.key.startsWith('tb_angle_')) continue;
        if (!next[item.id]) {
          next[item.id] = { contact: 0 };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items]);

  // 再読み込み時に表示値をクリア（値が実際に変わった場合のみ）
  useEffect(() => {
    if (!angleItem) return;
    const currentValue = params[angleItem.id];
    const prevValue = prevParamsRef.current[angleItem.id];

    if (currentValue !== undefined && currentValue !== prevValue) {
      prevParamsRef.current[angleItem.id] = currentValue;
      // デバイスから読み込まれた値が変わったらcontactをリセット
      setState((prev) => ({
        ...prev,
        [angleItem.id]: { contact: 0 },
      }));
    }
  }, [angleItem, params]);

  const currentState = angleItem ? (state[angleItem.id] ?? { contact: 0 }) : { contact: 0 };
  const calcAngle = angleItem
    ? normalizeAngle(deviceAngle - normalizeAngle(currentState.contact))
    : 0;

  const setActiveIndex = (nextIndex: number) => {
    const nextKey = grouped.order[nextIndex];
    if (nextKey === undefined) {
      setActiveKey(selectableOrder[0] ?? null);
      return;
    }
    if (connected != null && connected[nextKey] !== true) {
      return;
    }
    setActiveKey(nextKey);
  };

  const handleAngleChange = (value: number) => {
    if (!angleItem) return;
    const v = normalizeAngle(value);
    setState((prev) => ({
      ...prev,
      [angleItem.id]: { ...(prev[angleItem.id] ?? { contact: 0 }), contact: v },
    }));
  };

  const handleCirclePointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const angle = pointToAngle(x, y);
    handleAngleChange(angle);
  };

  return {
    grouped,
    activeIndex,
    setActiveIndex,
    activeGroup,
    angleItem,
    otherItems,
    deviceAngle,
    currentState,
    calcAngle,
    handleAngleChange,
    handleCirclePointer,
  };
}
