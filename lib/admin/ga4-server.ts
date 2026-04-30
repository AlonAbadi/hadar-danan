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

    const [summaryRes, channelsRes, eventsRes, quizRes, quizRecRes, trainingRes] = await Promise.all([
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
      // Training funnel — all named events in one request
      fetch(`${baseUrl}:runReport`, {
        method: 'POST', headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: since, endDate: until }],
          dimensions: [{ name: 'eventName' }, { name: 'pagePath' }],
          metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
          dimensionFilter: {
            orGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'eventName',
                    inListFilter: {
                      values: [
                        'training_video_play',
                        'training_video_25', 'training_video_50', 'training_video_75',
                        'training_video_complete',
                        'training_quiz_cta_click',
                        'training_click_challenge', 'training_click_workshop',
                        'training_click_course', 'training_click_strategy',
                        'training_click_premium', 'training_click_partnership',
                        'training_click_hive',
                      ],
                    },
                  },
                },
                {
                  filter: {
                    fieldName: 'pagePath',
                    inListFilter: { values: ['/training', '/training/watch'] },
                  },
                },
              ],
            },
          },
        }),
      }),
      // Quiz page visitors
      fetch(`${baseUrl}:runReport`, {
        method: 'POST', headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: since, endDate: until }],
          metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: { matchType: 'BEGINS_WITH', value: '/quiz' },
            },
          },
        }),
      }),
      // Quiz recommendation distribution — one event per product type
      fetch(`${baseUrl}:runReport`, {
        method: 'POST', headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: since, endDate: until }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: [
                  'quiz_result_challenge',
                  'quiz_result_workshop',
                  'quiz_result_course',
                  'quiz_result_strategy',
                  'quiz_result_premium',
                ],
              },
            },
          },
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        }),
      }),
    ]);

    const [summary, channels, events, training, quiz, quizRec] = await Promise.all([
      summaryRes.json(),
      channelsRes.json(),
      eventsRes.json(),
      trainingRes.json(),
      quizRes.json(),
      quizRecRes.json(),
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
        training: (() => {
          const rows: any[] = training.rows ?? [];
          const byEvent: Record<string, number> = {};
          const byPage: Record<string, number> = {};
          const byPageUsers: Record<string, number> = {};
          const productClicks: Record<string, number> = {};
          rows.forEach((r: any) => {
            const event = r.dimensionValues?.[0]?.value ?? '';
            const page  = r.dimensionValues?.[1]?.value ?? '';
            const count = Number(r.metricValues?.[0]?.value ?? 0);
            const users = Number(r.metricValues?.[1]?.value ?? 0);
            if (event === 'page_view' || event === '(not set)') {
              byPage[page] = (byPage[page] ?? 0) + count;
              byPageUsers[page] = (byPageUsers[page] ?? 0) + users;
            } else {
              byEvent[event] = (byEvent[event] ?? 0) + count;
              if (event.startsWith('training_click_')) {
                const product = event.replace('training_click_', '');
                productClicks[product] = (productClicks[product] ?? 0) + count;
              }
            }
          });
          return { byEvent, byPage, byPageUsers, productClicks };
        })(),
        quizViews: Number(quiz.rows?.[0]?.metricValues?.[0]?.value ?? 0),
        quizUsers: Number(quiz.rows?.[0]?.metricValues?.[1]?.value ?? 0),
        quizByProduct: Object.fromEntries(
          (quizRec.rows ?? []).map((r: any) => [
            (r.dimensionValues?.[0]?.value ?? '').replace('quiz_result_', ''),
            Number(r.metricValues?.[0]?.value ?? 0),
          ])
        ) as Record<string, number>,
      },
    };
  } catch (error) {
    return { configured: true, data: null, error: String(error) };
  }
}
