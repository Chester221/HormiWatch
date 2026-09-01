import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  // Función para aplicar trim recursivamente a un objeto
  private trimValue(value: any): any {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'object' && value !== null) {
      // Manejar arrays
      if (Array.isArray(value)) {
        return value.map((item: string) => this.trimValue(item));
      }

      // Manejar objetos planos (DTOs anidados)
      const newObject = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          newObject[key] = this.trimValue(value[key]);
        }
      }
      return newObject;
    }
    return value;
  }

  transform(value: any, metadata: ArgumentMetadata) {
    // Solo aplicar a Body, Query o Param (generalmente Body)
    if (
      metadata.type === 'body' ||
      metadata.type === 'query' ||
      metadata.type === 'param'
    ) {
      return this.trimValue(value);
    }
    return value;
  }
}
