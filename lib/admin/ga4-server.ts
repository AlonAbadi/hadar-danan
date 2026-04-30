import 'server-only';

function getApiDateRange(dateRange?: string): { since: string; until: string } {
  const until = new Date().toISOString().split('T')[0];
  const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : dateRange === 'today' ? 1 : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  return { since, until };
}

export async function getGA4Data(dateRange?: string) {
  const rawId = process.env.GA4_PROPERTY_ID?.trim();
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!rawId || !credentialsJson) {
    return { configured: false, data: null };
  }

  const propertyId = rawId.startsWith('properties/') ? rawId : `properties/${rawId}`;

  try {
    const { GoogleAuth } = await import('google-auth-library');
    const credentials = JSON.parse(credentialsJson);
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    const { since, until } = getApiDateRange(dateRange);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const baseUrl = `https://analyticsdata.googleapis.com/v1beta/${propertyId}`;

    const [summaryRes, channelsRes, eventsRes] = await Promise.all([
      fetch(`${baseUrl}:runReport`, {
        method: 'POST', headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: since, endDate: until }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
        }),
      }),
      fetch(`${baseUrl}:runReport`, {
        method: 'POST', headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: since, endDate: until }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        }),
      }),
      fetch(`${baseUrl}:runReport`, {
        method: 'POST', headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: since, endDate: until }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: { values: ['purchase', 'generate_lead', 'begin_checkout', 'sign_up'] },
            },
          },
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        }),
      }),
    ]);

    const [summary, channels, events] = await Promise.all([
      summaryRes.json(),
      channelsRes.json(),
      eventsRes.json(),
    ]);

    const row = summary.rows?.[0];
    const overview = row ? {
      sessions:           Number(row.metricValues?.[0]?.value ?? 0),
      users:              Number(row.metricValues?.[1]?.value ?? 0),
      bounceRate:         Number(row.metricValues?.[2]?.value ?? 0),
      avgSessionDuration: Number(row.metricValues?.[3]?.value ?? 0),
    } : null;

    return {
      configured: true,
      data: {
        overview,
        channels: (channels.rows ?? []).map((r: any) => ({
          channel: r.dimensionValues?.[0]?.value ?? 'Unknown',
          sessions: Number(r.metricValues?.[0]?.value ?? 0),
          users:    Number(r.metricValues?.[1]?.value ?? 0),
        })),
        events: (events.rows ?? []).map((r: any) => ({
          name:  r.dimensionValues?.[0]?.value ?? '',
          count: Number(r.metricValues?.[0]?.value ?? 0),
        })),
      },
    };
  } catch (error) {
    return { configured: true, data: null, error: String(error) };
  }
}
