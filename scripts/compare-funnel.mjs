import { spawnSync } from 'node:child_process';

function clampDays(value) {
  const normalized = Number.parseInt(value, 10);
  if (Number.isNaN(normalized) || normalized <= 0) {
    return 7;
  }

  return normalized;
}

export function buildCompareFunnelQuery({ days = 7 } = {}) {
  const normalizedDays = clampDays(days);

  return `
WITH recent_events AS (
  SELECT
    date(created_at) AS event_day,
    event_name
  FROM event_logs
  WHERE created_at >= datetime('now', '-${normalizedDays} day')
),
daily_counts AS (
  SELECT
    event_day,
    SUM(CASE WHEN event_name = 'share_clicked' THEN 1 ELSE 0 END) AS share_clicks,
    SUM(CASE WHEN event_name = 'summary_report_opened' THEN 1 ELSE 0 END) AS summary_opens,
    SUM(CASE WHEN event_name = 'partner_copy_clicked' THEN 1 ELSE 0 END) AS partner_copy_clicks,
    SUM(CASE WHEN event_name = 'shared_report_cta_clicked' THEN 1 ELSE 0 END) AS shared_report_cta_clicks,
    SUM(CASE WHEN event_name = 'upgrade_clicked' THEN 1 ELSE 0 END) AS upgrade_clicks,
    SUM(CASE WHEN event_name = 'payment_completed' THEN 1 ELSE 0 END) AS payments
  FROM recent_events
  GROUP BY event_day
)
SELECT
  event_day AS day,
  share_clicks,
  summary_opens,
  partner_copy_clicks,
  shared_report_cta_clicks,
  upgrade_clicks,
  payments,
  ROUND(CASE WHEN share_clicks = 0 THEN 0 ELSE summary_opens * 1.0 / share_clicks END, 3) AS share_to_open,
  ROUND(CASE WHEN summary_opens = 0 THEN 0 ELSE partner_copy_clicks * 1.0 / summary_opens END, 3) AS open_to_copy,
  ROUND(CASE WHEN summary_opens = 0 THEN 0 ELSE shared_report_cta_clicks * 1.0 / summary_opens END, 3) AS open_to_test,
  ROUND(CASE WHEN summary_opens = 0 THEN 0 ELSE upgrade_clicks * 1.0 / summary_opens END, 3) AS open_to_upgrade,
  ROUND(CASE WHEN upgrade_clicks = 0 THEN 0 ELSE payments * 1.0 / upgrade_clicks END, 3) AS upgrade_to_pay
FROM daily_counts
ORDER BY day DESC;
`.trim();
}

export function buildCompareFunnelArgs({
  databaseName = process.env.D1_DATABASE_NAME || 'wenming',
  remote = false,
  days = 7,
  configPath = 'wrangler.jsonc',
} = {}) {
  return [
    'wrangler',
    'd1',
    'execute',
    databaseName,
    remote ? '--remote' : '--local',
    '--config',
    configPath,
    '--command',
    buildCompareFunnelQuery({ days }),
    '--json',
  ];
}

export function formatCompareFunnelResults(rows = [], { days = 7 } = {}) {
  const normalizedDays = clampDays(days);
  if (!Array.isArray(rows) || rows.length === 0) {
    return `最近 ${normalizedDays} 天还没有可用的比较漏斗事件。先跑真实分享，再来看漏斗。`;
  }

  const headers = ['day', 'share', 'open', 'open->copy clicks', 'open->test clicks', 'upgrade', 'pay', 'share->open', 'open->copy', 'open->test', 'open->upgrade', 'upgrade->pay'];
  const lines = [
    headers.join('\t'),
    ...rows.map((row) => [
      row.day ?? '',
      row.share_clicks ?? 0,
      row.summary_opens ?? 0,
      row.partner_copy_clicks ?? 0,
      row.shared_report_cta_clicks ?? 0,
      row.upgrade_clicks ?? 0,
      row.payments ?? 0,
      row.share_to_open ?? 0,
      row.open_to_copy ?? 0,
      row.open_to_test ?? 0,
      row.open_to_upgrade ?? 0,
      row.upgrade_to_pay ?? 0,
    ].join('\t')),
  ];

  return lines.join('\n');
}

function parseCliArgs(argv = process.argv.slice(2)) {
  const options = {
    remote: false,
    days: 7,
    databaseName: process.env.D1_DATABASE_NAME || 'wenming',
    configPath: 'wrangler.jsonc',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--remote') {
      options.remote = true;
      continue;
    }

    if (current === '--local') {
      options.remote = false;
      continue;
    }

    if (current === '--days') {
      options.days = clampDays(argv[index + 1]);
      index += 1;
      continue;
    }

    if (current === '--db') {
      options.databaseName = argv[index + 1] || options.databaseName;
      index += 1;
      continue;
    }

    if (current === '--config') {
      options.configPath = argv[index + 1] || options.configPath;
      index += 1;
    }
  }

  return options;
}

function main() {
  const options = parseCliArgs();
  const args = buildCompareFunnelArgs(options);
  const result = spawnSync('npx', args, {
    encoding: 'utf8',
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if ((result.status ?? 0) !== 0) {
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    process.exit(result.status ?? 1);
  }

  const parsed = JSON.parse(result.stdout || '[]');
  const rows = parsed?.[0]?.results || [];
  process.stdout.write(`${formatCompareFunnelResults(rows, { days: options.days })}\n`);
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
