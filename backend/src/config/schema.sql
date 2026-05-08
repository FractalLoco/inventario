-- =============================================
-- TRES AL MAR · Esquema Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto
-- =============================================

create table if not exists lotes (
  id text primary key,
  especie text not null,
  fecha date not null,
  responsable text not null,
  nota text default '',
  created_at timestamptz default now()
);

create table if not exists productos_lote (
  id bigserial primary key,
  lote_id text references lotes(id) on delete cascade,
  nombre text not null,
  tipo_caja text default 'Caja',
  procesadas int not null default 0,
  disponible int not null default 0,
  despachado int not null default 0,
  estado text not null default 'Disponible'
    check (estado in ('Disponible', 'En proceso', 'Agotado')),
  created_at timestamptz default now()
);

create table if not exists movimientos (
  id bigserial primary key,
  lote_id text references lotes(id) on delete cascade,
  producto_id bigint references productos_lote(id) on delete cascade,
  producto_nombre text not null,
  tipo text not null check (tipo in ('Entrada', 'Salida')),
  cajas int not null,
  responsable text not null,
  nota text default '',
  created_at timestamptz default now()
);

create table if not exists recursos (
  id bigserial primary key,
  nombre text not null,
  proveedor text not null,
  descripcion text default '',
  categoria text default 'General',
  cantidad int not null default 0,
  unidad text not null default 'u',
  stock_minimo int not null default 0,
  color text default 'blue',
  created_at timestamptz default now()
);

create table if not exists movimientos_recursos (
  id bigserial primary key,
  recurso_id bigint references recursos(id) on delete cascade,
  recurso_nombre text not null,
  tipo text not null check (tipo in ('Entrada', 'Salida')),
  cantidad int not null,
  unidad text not null,
  responsable text not null,
  nota text default '',
  created_at timestamptz default now()
);

-- Datos de ejemplo (opcional)
insert into lotes (id, especie, fecha, responsable, nota) values
  ('JB-001', 'Jibia', '2025-05-06', 'Op. Muñoz', 'Faena turno A completa'),
  ('MR-002', 'Merluza', '2025-05-05', 'Op. Soto', '');

insert into productos_lote (lote_id, nombre, tipo_caja, procesadas, disponible, despachado, estado) values
  ('JB-001', 'Filete de Jibia', 'Caja 10kg', 45, 45, 0, 'Disponible'),
  ('JB-001', 'Jibia Entera', 'Caja 15kg', 20, 12, 8, 'Disponible'),
  ('JB-001', 'Tentáculos Jibia', 'Caja 8kg', 15, 0, 15, 'Agotado'),
  ('MR-002', 'Merluza Fileteada', 'Caja 10kg', 60, 20, 40, 'Disponible'),
  ('MR-002', 'Merluza Troceada', 'Caja 8kg', 30, 30, 0, 'Disponible');

insert into recursos (nombre, proveedor, descripcion, categoria, cantidad, unidad, stock_minimo, color) values
  ('Hielo Nova', 'Nova Ice S.A.', 'Hielo en escamas para conservación', 'Conservación', 12, 'ton', 20, 'blue'),
  ('Guantes de látex', 'SafeWork Ltda.', 'Guantes descartables talla M/L', 'EPP', 340, 'pares', 100, 'teal'),
  ('Cajas plásticas', 'PlastiPack Ltda.', 'Cajones plásticos reutilizables 60x40cm', 'Embalaje', 210, 'u', 80, 'purple'),
  ('Bolsas vacío', 'PackSur', 'Bolsas para sellado al vacío 40x60cm', 'Embalaje', 1200, 'u', 400, 'amber'),
  ('Pallets madera', 'MadererasSur', 'Pallets estándar 1.2x1.0m', 'Logística', 18, 'u', 20, 'amber');
