export type AdminDateRange = {
  from?: Date;
  to?: Date;
  fromInput: string;
  toInput: string;
  label: string;
  queryString: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function parseDate(value: string, endOfDay = false): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+08:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatInput(date: Date | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function parseAdminDateRange(searchParams: SearchParams = {}): AdminDateRange {
  const range = firstParam(searchParams.range);
  const explicitFrom = firstParam(searchParams.from);
  const explicitTo = firstParam(searchParams.to);
  const now = new Date();

  let from = parseDate(explicitFrom);
  let to = parseDate(explicitTo, true);
  let label = "自定义时间";

  if (!from && !to) {
    if (range === "all") {
      label = "全部时间";
    } else {
      const days = range === "7d" ? 7 : 30;
      from = new Date(now);
      from.setDate(from.getDate() - days + 1);
      from.setHours(0, 0, 0, 0);
      to = now;
      label = days === 7 ? "最近 7 天" : "最近 30 天";
    }
  }

  const params = new URLSearchParams();
  if (range === "all" && !explicitFrom && !explicitTo) {
    params.set("range", "all");
  } else {
    if (from) params.set("from", formatInput(from));
    if (to) params.set("to", formatInput(to));
  }

  return {
    from,
    to,
    fromInput: explicitFrom || formatInput(from),
    toInput: explicitTo || formatInput(to),
    label,
    queryString: params.toString(),
  };
}

export function createdAtWhere(range: AdminDateRange) {
  if (!range.from && !range.to) return {};
  return {
    createdAt: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  };
}
