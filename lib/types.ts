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

export interface MatchTeam {
  nombre: string;
  tag: string;
  score?: number;
}

export interface Match {
  id: string;
  ronda: string;
  formato: "Bo1" | "Bo3" | "Bo5";
  a?: MatchTeam;
  b?: MatchTeam;
  estado: "programado" | "en_vivo" | "finalizado";
  fecha?: string;
  ganador?: "a" | "b";
}

export interface GroupRow {
  pos: number;
  nombre: string;
  tag: string;
  v: number; // victorias
  d: number; // derrotas
  difMapas: number;
  clasificado: boolean;
}
