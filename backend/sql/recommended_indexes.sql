-- Recommended indexes for performance
-- Apply in Supabase SQL editor (review first).

-- Comments: filter by solicitud and order by creation
create index if not exists idx_comentario_solicitud_fecha
  on public.comentario (id_solicitud, fecha_creacion);

-- History: filter by solicitud and order by event time
create index if not exists idx_historial_solicitud_fecha
  on public.historial_solicitud (id_solicitud, fecha_evento);

-- Attachments: filter by solicitud and order by upload time
create index if not exists idx_archivo_solicitud_fecha
  on public.archivo_adjunto (id_solicitud, fecha_subida desc);

-- Solicitudes filters
create index if not exists idx_solicitud_estudiante
  on public.solicitud (id_estudiante);

create index if not exists idx_solicitud_estado
  on public.solicitud (id_estado_solicitud);

create index if not exists idx_solicitud_tipo
  on public.solicitud (id_tipo_solicitud);

-- Sorting
create index if not exists idx_solicitud_fecha_creacion
  on public.solicitud (fecha_creacion desc);
