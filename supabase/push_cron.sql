-- Run ONCE in the Supabase SQL editor, after deploying the send-reminders
-- function and setting its secrets. Replace REPLACE_WITH_CRON_SECRET with the
-- same value you set as the CRON_SECRET secret. Calls the sender every minute.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('lit-send-reminders') where exists (select 1 from cron.job where jobname = 'lit-send-reminders');
select cron.schedule(
  'lit-send-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://uunrpccgyracrbtcfjqw.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'REPLACE_WITH_CRON_SECRET'),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);
