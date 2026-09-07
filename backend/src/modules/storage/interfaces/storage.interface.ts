import { Express } from 'express';

export const STORAGE_SERVICE = 'IStorageService';

export interface IStorageService {
  /**
   * Sube un archivo al proveedor de almacenamiento.
   * @param file El archivo a subir, compatible con Multer.
   * @param path Ruta o carpeta de destino dentro del bucket.
   * @returns un objeto con la URL pública y la key del archivo subido
   */
  upload(
    file: Express.Multer.File,
    path: string,
  ): Promise<{ url: string; key: string }>;

  /**
   * Elimina un archivo del proveedor de almacenamiento.
   * @param fileKey La clave o path completo del archivo a eliminar.
   * @returns Un booleano indicando si la operación fue exitosa.
   */
  delete(fileKey: string): Promise<boolean>;

  /**
   * Obtiene la URL pública de un archivo ya almacenado.
   * @param fileKey La clave o path completo del archivo.
   * @returns La URL pública del archivo.
   */
  getPublicUrl(fileKey: string): string;

  /**
   * Crea una URL firmada y con tiempo de expiración para un archivo privado.
   * @param fileKey La clave o path completo del archivo.
   * @param expiresInSeconds Tiempo en segundos para la expiración de la URL.
   * @returns La URL firmada.
   */
  getSignedUrl(fileKey: string, expiresInSeconds: number): Promise<string>;
}
