// Ruta: src/nucleo/errores.ts
import type { ErrorRequestHandler, RequestHandler } from 'express';

/** Error con código HTTP. Las rutas lo lanzan y el manejador lo convierte en `{ error, mensaje }`. */
export class ErrorHttp extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export const noEncontrado = (que: string) => new ErrorHttp(404, 'NO_ENCONTRADO', `${que} no existe.`);
export const datosInvalidos = (mensaje: string) => new ErrorHttp(400, 'DATOS_INVALIDOS', mensaje);
export const conflicto = (mensaje: string) => new ErrorHttp(409, 'CONFLICTO', mensaje);

export const rutaNoEncontrada: RequestHandler = (req, _res, next) => {
  next(new ErrorHttp(404, 'RUTA_NO_ENCONTRADA', `${req.method} ${req.path} no existe.`));
};

export const manejarErrores: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ErrorHttp) {
    res.status(error.estado).json({ error: error.codigo, mensaje: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'ERROR_INTERNO', mensaje: 'Algo salió mal en la API simulada.' });
};
