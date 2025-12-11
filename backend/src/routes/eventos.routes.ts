import { Router, Response } from 'express'
import multer from 'multer'
import Evento from '../models/Evento.js'
import Cliente from '../models/Cliente.js'
import { verificarToken, todosLosRoles, permisoEscritura, AuthRequest } from '../middleware/auth.js'
import { config } from '../config/environment.js'

const router = Router()

// Configurar multer para manejar archivos (imágenes de eventos)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes'))
    }
  }
})

// Obtener todos los eventos (todos los roles pueden ver)
router.get('/', verificarToken, todosLosRoles, async (req: AuthRequest, res: Response) => {
  try {
    const eventos = await Evento.find()
      .sort({ fechaCreacion: -1 })
      .select('-destinatarios.lista') // No enviar la lista completa de destinatarios
    
    res.json({
      success: true,
      data: eventos,
    })
  } catch (error) {
    console.error('Error obteniendo eventos:', error)
    res.status(500).json({
      success: false,
      message: 'Error obteniendo eventos',
    })
  }
})

// Obtener un evento por ID (todos los roles pueden ver)
router.get('/:id', verificarToken, todosLosRoles, async (req: AuthRequest, res: Response) => {
  try {
    const evento = await Evento.findById(req.params.id)
    
    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado',
      })
    }
    
    res.json({
      success: true,
      data: evento,
    })
  } catch (error) {
    console.error('Error obteniendo evento:', error)
    res.status(500).json({
      success: false,
      message: 'Error obteniendo evento',
    })
  }
})

// Crear y enviar evento (admin y soporte con permiso de escritura)
router.post('/', verificarToken, permisoEscritura, upload.single('imagen'), async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, mensaje, filtros } = req.body
    
    if (!nombre || !mensaje || !filtros) {
      console.error('❌ Error: Faltan campos requeridos en evento')
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      })
    }
    
    // Parsear filtros si viene como string
    const filtrosObj = typeof filtros === 'string' ? JSON.parse(filtros) : filtros
    
    // Obtener destinatarios según filtros
    const queryClientes: any = {}
    
    if (filtrosObj.tipo === 'hogar') {
      queryClientes.tipoCliente = 'hogar'
    } else if (filtrosObj.tipo === 'ciudad' && filtrosObj.ciudades?.length > 0) {
      queryClientes.ciudad = { $in: filtrosObj.ciudades }
    } else if (filtrosObj.tipo === 'tipo' && filtrosObj.tiposCliente?.length > 0) {
      queryClientes.tipoCliente = { $in: filtrosObj.tiposCliente }
    } else if (filtrosObj.tipo === 'personalizado') {
      if (filtrosObj.ciudades?.length > 0) {
        queryClientes.ciudad = { $in: filtrosObj.ciudades }
      }
      if (filtrosObj.tiposCliente?.length > 0) {
        queryClientes.tipoCliente = { $in: filtrosObj.tiposCliente }
      }
    }
    // Si tipo === 'todos', queryClientes queda vacío (todos los clientes)
    
    const clientes = await Cliente.find(queryClientes).select('telefono nombreNegocio ciudad tipoCliente')
    
    if (clientes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay destinatarios que cumplan los filtros seleccionados',
      })
    }
    
    // Crear lista de destinatarios
    const destinatarios = clientes.map(cliente => ({
      telefono: cliente.telefono,
      nombreNegocio: cliente.nombreNegocio,
      ciudad: cliente.ciudad,
      tipoCliente: cliente.tipoCliente,
      enviado: false,
    }))
    
    // Crear evento
    const evento = new Evento({
      nombre,
      mensaje,
      filtros: filtrosObj,
      destinatarios: {
        total: destinatarios.length,
        enviados: 0,
        fallidos: 0,
        lista: destinatarios,
      },
      estado: 'enviando',
      creadoPor: req.user!.email,
    })
    
    await evento.save()
    
    console.log(`📧 Iniciando envío de evento: ${nombre} a ${destinatarios.length} destinatarios`)
    
    // Enviar mensajes vía WhatsApp Business API
    const JWT_TOKEN = process.env.JWT_TOKEN || config.whatsapp.jwtToken
    const NUMBER_ID = process.env.NUMBER_ID || config.whatsapp.numberId
    const VERSION = config.whatsapp.version
    
    if (!JWT_TOKEN || !NUMBER_ID) {
      console.error('❌ Faltan credenciales de WhatsApp Business API')
      evento.estado = 'error'
      await evento.save()
      return res.status(500).json({
        success: false,
        message: 'Error de configuración: Faltan credenciales de WhatsApp',
      })
    }
    
    let enviados = 0
    let fallidos = 0
    
    // Enviar a cada destinatario
    for (let i = 0; i < evento.destinatarios.lista.length; i++) {
      const destinatario = evento.destinatarios.lista[i]
      
      try {
        // Limpiar teléfono (solo números)
        const telefonoLimpio = destinatario.telefono.replace(/\D/g, '')
        
        const response = await fetch(
          `https://graph.facebook.com/${VERSION}/${NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${JWT_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: telefonoLimpio,
              type: 'text',
              text: {
                body: mensaje
              }
            })
          }
        )
        
        const responseData = await response.json()
        
        if (response.ok) {
          destinatario.enviado = true
          destinatario.fechaEnvio = new Date()
          enviados++
          console.log(`✅ [${i + 1}/${destinatarios.length}] Mensaje enviado exitosamente`)
        } else {
          destinatario.error = responseData.error?.message || 'Error desconocido'
          fallidos++
          console.error(`❌ [${i + 1}/${destinatarios.length}] Error en envío:`, responseData.error?.message)
        }
        
        // Esperar 1.2 segundos entre cada mensaje para evitar rate limiting
        if (i < destinatarios.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1200))
        }
        
      } catch (error) {
        destinatario.error = error instanceof Error ? error.message : 'Error de red'
        fallidos++
        console.error(`❌ [${i + 1}/${destinatarios.length}] Excepción al enviar:`, error)
      }
    }
    
    // Actualizar evento con resultados finales
    evento.destinatarios.enviados = enviados
    evento.destinatarios.fallidos = fallidos
    evento.estado = 'enviado'
    evento.fechaEnvio = new Date()
    await evento.save()
    
    console.log(`✅ Evento completado: ${enviados} enviados, ${fallidos} fallidos`)
    
    res.json({
      success: true,
      message: 'Evento procesado exitosamente',
      data: {
        _id: evento._id,
        nombre: evento.nombre,
        destinatarios: {
          total: evento.destinatarios.total,
          enviados: evento.destinatarios.enviados,
          fallidos: evento.destinatarios.fallidos,
        },
      },
    })
  } catch (error) {
    console.error('❌ Error creando evento:', error)
    res.status(500).json({
      success: false,
      message: 'Error creando evento',
    })
  }
})

export default router
