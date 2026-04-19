alter table atelier_applications
  add column if not exists modules text[] default '{}';
