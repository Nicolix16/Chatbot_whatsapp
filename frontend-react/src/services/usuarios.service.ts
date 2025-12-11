import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api';
import type { Usuario, UserRole, TipoOperador } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class UsuariosService {
  async getAll(): Promise<Usuario[]> {
    const response = await apiService.get<ApiResponse<Usuario[]>>(API_ENDPOINTS.USUARIOS.LIST);
    return response.data;
  }

  async getById(id: string): Promise<Usuario> {
    const response = await apiService.get<ApiResponse<Usuario>>(API_ENDPOINTS.USUARIOS.DETAIL(id));
    return response.data;
  }

  async create(usuario: Partial<Usuario>): Promise<Usuario> {
    const response = await apiService.post<ApiResponse<Usuario>>(API_ENDPOINTS.USUARIOS.CREATE, usuario);
    return response.data;
  }

  async update(id: string, usuario: Partial<Usuario>): Promise<Usuario> {
    const response = await apiService.put<ApiResponse<Usuario>>(API_ENDPOINTS.USUARIOS.UPDATE(id), usuario);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiService.delete<void>(API_ENDPOINTS.USUARIOS.DELETE(id));
  }

  async toggleStatus(id: string, activo: boolean): Promise<Usuario> {
    const response = await apiService.patch<ApiResponse<Usuario>>(`/usuarios/${id}/estado`, { activo });
    return response.data;
  }

  async cambiarRol(id: string, rol: UserRole, tipoOperador?: TipoOperador): Promise<Usuario> {
    const response = await apiService.patch<ApiResponse<Usuario>>(`/usuarios/${id}/rol`, { rol, tipoOperador });
    return response.data;
  }

  async importarCSV(usuarios: Partial<Usuario>[]): Promise<{ creados: number; errores: number; detalles: any[] }> {
    const response = await apiService.post<ApiResponse<{ creados: number; errores: number; detalles: any[] }>>('/usuarios/bulk', { usuarios });
    return response.data;
  }
}

export const usuariosService = new UsuariosService();
