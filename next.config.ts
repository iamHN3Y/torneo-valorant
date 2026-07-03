import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que dispositivos de la LAN (p. ej. tu celular) accedan al
  // servidor de desarrollo. Next 16 bloquea por defecto los recursos de dev
  // a orígenes distintos de localhost, lo que impedía que el JS del cliente
  // se ejecutara en el teléfono (menú y animaciones quedaban muertos).
  allowedDevOrigins: ["192.168.1.76", "192.168.1.*"],
};

export default nextConfig;
