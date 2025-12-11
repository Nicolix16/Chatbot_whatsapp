import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api';
import type { ExportType } from '../types';

type ExportFormat = 'excel' | 'powerbi';

class ExportService {
  async exportData(type: ExportType, format: ExportFormat = 'excel'): Promise<void> {
    let endpoint: string;
    let filename: string;
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Determinar la extensión según el formato
    const extension = format === 'excel' ? 'xlsx' : 'json';

    switch (type) {
      case 'clientes':
        endpoint = `${API_ENDPOINTS.EXPORT.CLIENTES}?format=${format}`;
        filename = `clientes_${timestamp}.${extension}`;
        break;
      case 'pedidos':
        endpoint = `${API_ENDPOINTS.EXPORT.PEDIDOS}?format=${format}`;
        filename = `pedidos_${timestamp}.${extension}`;
        break;
      case 'conversaciones':
        endpoint = `${API_ENDPOINTS.EXPORT.CONVERSACIONES}?format=${format}`;
        filename = `conversaciones_${timestamp}.${extension}`;
        break;
      case 'usuarios':
        endpoint = `${API_ENDPOINTS.EXPORT.USUARIOS}?format=${format}`;
        filename = `usuarios_${timestamp}.${extension}`;
        break;
      case 'estadisticas':
        endpoint = `${API_ENDPOINTS.EXPORT.ESTADISTICAS}?format=${format}`;
        filename = `estadisticas_${timestamp}.${extension}`;
        break;
      case 'eventos':
        endpoint = `${API_ENDPOINTS.EXPORT.EVENTOS}?format=${format}`;
        filename = `eventos_${timestamp}.${extension}`;
        break;
      default:
        throw new Error(`Tipo de exportación no soportado: ${type}`);
    }

    await apiService.downloadFile(endpoint, filename);
  }
}

export const exportService = new ExportService();
