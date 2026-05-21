export type StaffProfile = Record<string, unknown> & {
  id?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  jobTitle?: string;
  position?: string;
  email?: string;
  workEmail?: string;
  phone?: string;
  active?: boolean;
};

export type OrgChartPeopleResult =
  | {
      ok: true;
      enabled: true;
      people: StaffProfile[];
    }
  | {
      ok: false;
      enabled: boolean;
      reason: "missing-config" | "unavailable";
      status?: number;
      people: [];
    };

function getOrgChartConfig() {
  const baseUrl = process.env.ORG_CHART_BASE_URL?.trim().replace(/\/+$/, "") || "";
  const apiKey = process.env.ORG_CHART_API_KEY?.trim() || "";

  return { baseUrl, apiKey };
}

export async function fetchOrgChartPeople(): Promise<OrgChartPeopleResult> {
  const { baseUrl, apiKey } = getOrgChartConfig();

  if (!baseUrl || !apiKey) {
    return { ok: false, enabled: false, reason: "missing-config", people: [] };
  }

  try {
    const response = await fetch(`${baseUrl}/api/people/headless?includeInactive=false`, {
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      return { ok: false, enabled: true, reason: "unavailable", status: response.status, people: [] };
    }

    const payload = (await response.json()) as { people?: unknown };
    const people = Array.isArray(payload.people) ? (payload.people as StaffProfile[]) : [];

    return { ok: true, enabled: true, people };
  } catch {
    return { ok: false, enabled: true, reason: "unavailable", people: [] };
  }
}
