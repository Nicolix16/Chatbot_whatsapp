import * as XLSX from 'xlsx'
import type { Response } from 'express'

interface ExportColumn {
  header: string
  key: string
  width?: number
}

export class ExportService {
  /**
   * Exporta datos a formato Excel con tabla formateada
   */
  static exportToExcel(data: any[], columns: ExportColumn[], filename: string, res: Response) {
    try {
      // Crear array de headers
      const headers = columns.map(col => col.header)
      
      // Crear array de datos
      const rows = data.map(item => {
        return columns.map(col => {
          const value = item[col.key]
          // Convertir a string si es necesario, manejar valores vacíos
          if (value === null || value === undefined) return ''
          if (typeof value === 'object') return JSON.stringify(value)
          return value
        })
      })

      // Combinar headers y datos
      const worksheetData = [headers, ...rows]

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)

      // Aplicar anchos de columna
      const colWidths = columns.map(col => ({ wch: col.width || 15 }))
      ws['!cols'] = colWidths

      // Aplicar formato a los encabezados (fila 0)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellAddress]) continue
        
        // Agregar negrita a headers (esto requiere que se maneje en el cliente)
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "006633" } },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }

      // Agregar la tabla al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Datos')

      // Generar buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(buffer)
    } catch (error) {
      console.error('Error generando Excel:', error)
      throw error
    }
  }

  /**
   * Columnas para exportar clientes
   */
  static getClientesColumns(): ExportColumn[] {
    return [
      { header: 'TELÉFONO', key: 'telefono', width: 15 },
      { header: 'TIPO', key: 'tipoCliente', width: 20 },
      { header: 'NOMBRE NEGOCIO', key: 'nombreNegocio', width: 30 },
      { header: 'CIUDAD', key: 'ciudad', width: 20 },
      { header: 'RESPONSABLE', key: 'responsable', width: 20 },
      { header: 'CONVERSACIONES', key: 'totalConversaciones', width: 18 },
      { header: 'FECHA REGISTRO', key: 'fechaRegistro', width: 18 }
    ]
  }

  /**
   * Columnas para exportar pedidos
   */
  static getPedidosColumns(): ExportColumn[] {
    return [
      { header: 'TELÉFONO', key: 'telefono', width: 15 },
      { header: 'PRODUCTOS', key: 'productos', width: 40 },
      { header: 'CANTIDAD TOTAL', key: 'cantidadTotal', width: 18 },
      { header: 'DIRECCIÓN', key: 'direccion', width: 35 },
      { header: 'FECHA', key: 'fecha', width: 18 }
    ]
  }

  /**
   * Columnas para exportar conversaciones
   */
  static getConversacionesColumns(): ExportColumn[] {
    return [
      { header: 'TELÉFONO', key: 'telefono', width: 15 },
      { header: 'MENSAJE', key: 'mensaje', width: 50 },
      { header: 'ROL', key: 'rol', width: 12 },
      { header: 'FECHA', key: 'fecha', width: 18 }
    ]
  }

  /**
   * Columnas para exportar estadísticas
   */
  static getEstadisticasColumns(): ExportColumn[] {
    return [
      { header: 'CATEGORÍA', key: 'categoria', width: 25 },
      { header: 'SUBCATEGORÍA', key: 'subcategoria', width: 25 },
      { header: 'VALOR', key: 'valor', width: 15 },
      { header: 'TOTAL', key: 'total', width: 15 }
    ]
  }

  /**
   * Columnas para exportar usuarios
   */
  static getUsuariosColumns(): ExportColumn[] {
    return [
      { header: 'NOMBRE', key: 'nombre', width: 25 },
      { header: 'EMAIL', key: 'email', width: 30 },
      { header: 'ROL', key: 'rol', width: 15 },
      { header: 'TIPO OPERADOR', key: 'tipoOperador', width: 20 },
      { header: 'ESTADO', key: 'estado', width: 12 },
      { header: 'FECHA CREACIÓN', key: 'fechaCreacion', width: 18 }
    ]
  }

  /**
   * Procesa datos de clientes para exportación
   */
  static processClientesData(clientes: any[]): any[] {
    return clientes.map(c => {
      // Mapear tipos de cliente a formato legible
      let tipoFormateado = 'HOGAR'
      if (c.tipoCliente) {
        const tipo = c.tipoCliente.toLowerCase()
        if (tipo === 'hogar') tipoFormateado = 'HOGAR'
        else if (tipo === 'restaurante_estandar' || tipo.includes('restaurante')) tipoFormateado = 'RESTAURANTE ESTANDAR'
        else if (tipo === 'restaurante_premium' || tipo.includes('premium')) tipoFormateado = 'RESTAURANTE PREMIUM'
        else if (tipo === 'tienda') tipoFormateado = 'TIENDA'
        else if (tipo === 'asadero') tipoFormateado = 'ASADERO'
        else if (tipo === 'mayorista') tipoFormateado = 'MAYORISTA'
        else tipoFormateado = c.tipoCliente.toUpperCase()
      }

      return {
        telefono: c.telefono || '',
        tipoCliente: tipoFormateado,
        nombreNegocio: c.nombreNegocio || c.nombre || 'Sin nombre',
        ciudad: c.ciudad || 'Sin ciudad',
        responsable: c.responsable || 'Sin asignar',
        totalConversaciones: c.totalConversaciones || 0,
        fechaRegistro: c.fechaRegistro ? new Date(c.fechaRegistro).toLocaleDateString('es-ES') : ''
      }
    })
  }

  /**
   * Procesa datos de pedidos para exportación
   */
  static processPedidosData(pedidos: any[]): any[] {
    return pedidos.map(p => ({
      telefono: p.telefono,
      productos: Array.isArray(p.productos) 
        ? p.productos.map((prod: any) => `${prod.nombre} (${prod.cantidad})`).join(', ')
        : 'Sin productos',
      cantidadTotal: Array.isArray(p.productos)
        ? p.productos.reduce((sum: number, prod: any) => sum + (prod.cantidad || 0), 0)
        : 0,
      direccion: p.direccion || 'Sin dirección',
      fecha: p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : ''
    }))
  }

  /**
   * Procesa datos de conversaciones para exportación
   */
  static processConversacionesData(conversaciones: any[]): any[] {
    return conversaciones.map(c => ({
      telefono: c.telefono,
      mensaje: c.mensaje || '',
      rol: c.rol || 'user',
      fecha: c.fecha ? new Date(c.fecha).toLocaleDateString('es-ES') : ''
    }))
  }

  /**
   * Procesa datos de estadísticas para exportación
   */
  static processEstadisticasData(estadisticas: any): any[] {
    const rows: any[] = []

    // Clientes por tipo
    if (estadisticas.clientes) {
      rows.push({
        categoria: 'Clientes',
        subcategoria: 'Total',
        valor: estadisticas.clientes.total,
        total: ''
      })

      if (estadisticas.clientes.por_tipo) {
        estadisticas.clientes.por_tipo.forEach((tipo: any) => {
          rows.push({
            categoria: 'Clientes',
            subcategoria: tipo._id || 'Sin tipo',
            valor: tipo.count,
            total: ''
          })
        })
      }
    }

    // Pedidos por estado
    if (estadisticas.pedidos?.por_estado) {
      estadisticas.pedidos.por_estado.forEach((estado: any) => {
        rows.push({
          categoria: 'Pedidos',
          subcategoria: estado._id || 'Sin estado',
          valor: estado.count,
          total: estado.total || 0
        })
      })
    }

    // Pedidos por mes
    if (estadisticas.pedidos?.por_mes) {
      estadisticas.pedidos.por_mes.forEach((mes: any) => {
        const mesNombre = mes._id ? `${mes._id.mes}/${mes._id.año}` : 'Sin fecha'
        rows.push({
          categoria: 'Pedidos por Mes',
          subcategoria: mesNombre,
          valor: mes.count,
          total: mes.total || 0
        })
      })
    }

    return rows
  }

  /**
   * Procesa datos de usuarios para exportación
   */
  static processUsuariosData(usuarios: any[]): any[] {
    return usuarios.map(u => ({
      nombre: u.nombre || 'Sin nombre',
      email: u.email || 'Sin email',
      rol: u.rol?.toUpperCase() || 'SIN ROL',
      tipoOperador: u.tipoOperador || 'N/A',
      estado: u.estado || 'activo',
      fechaCreacion: u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES') : ''
    }))
  }
}
