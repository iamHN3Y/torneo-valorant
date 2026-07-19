export type RankId =
  | "hierro_oro"
  | "platino"
  | "diamante"
  | "ascendente"
  | "inmortal"
  | "radiante";

export type Rol = "titular" | "suplente";

export type Rama = "amateur" | "elite";

export type EstadoInscripcion =
  | "borrador"
  | "pendiente_pago"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "lista_espera";

export interface Player {
  id: string;
  nombre: string; // nombre para mostrar / capitán
  riotId: string; // "gameName#tagLine"
  rankId: RankId;
  nacionalidad: string; // ISO-2: "MX", "AR", ...
  rol: Rol;
  esCapitan?: boolean;
  riotVerificado?: boolean; // confirmado vía ACCOUNT-V1
}

export interface Team {
  id: string;
  nombre: string;
  tag: string;
  rama: Rama;
  estado: EstadoInscripcion;
  puntos: number; // suma de puntos de titulares
  jugadores: Player[];
  ordenInscripcion?: number;
  fechaRegistro?: string;
}

// Los tipos de partidos y standings viven en lib/repo.ts (DbMatch,
// GroupStanding, RankingStanding), derivados del esquema de Postgres.
