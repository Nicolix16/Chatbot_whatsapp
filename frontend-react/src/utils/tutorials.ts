import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { UserRole } from '../types';

// Configuración base de Driver.js
const driverConfig = {
  showProgress: true,
  nextBtnText: 'Siguiente →',
  prevBtnText: '← Anterior',
  doneBtnText: '✓ Finalizar',
  progressText: '{{current}} de {{total}}',
  popoverClass: 'driver-popover-custom'
};

let driverObj: any;

// Tutorial Completo - Todos los roles
export const startCompleteTutorial = (userRole: UserRole) => {
  const steps = [
    {
      element: '#dashboard-header',
      popover: {
        title: '🎉 ¡Bienvenido al Dashboard de Avellano!',
        description: 'Este es tu panel de control donde podrás gestionar clientes, pedidos y conversaciones. Te guiaré por todas las funcionalidades.',
        position: 'bottom'
      }
    },
    {
      element: '[href="/dashboard/clientes"]',
      popover: {
        title: '👥 Gestión de Clientes',
        description: 'Aquí podrás ver, crear y editar la información de todos tus clientes. Incluye datos de contacto, tipo de cliente y responsable asignado.',
        position: 'right'
      }
    },
    {
      element: '[href="/dashboard/pedidos"]',
      popover: {
        title: '📦 Gestión de Pedidos',
        description: 'Administra todos los pedidos: pendientes, en proceso, atendidos y cancelados. Puedes ver detalles, cambiar estados y exportar datos.',
        position: 'right'
      }
    },
    {
      element: '[href="/dashboard/conversaciones"]',
      popover: {
        title: '💬 Historial de Conversaciones',
        description: 'Revisa todas las conversaciones de WhatsApp con tus clientes. Útil para seguimiento y análisis de interacciones.',
        position: 'right'
      }
    },
    {
      element: '[href="/dashboard/eventos"]',
      popover: {
        title: '📅 Calendario de Eventos',
        description: 'Gestiona eventos y actividades programadas. Ideal para organizar entregas y reuniones.',
        position: 'right'
      }
    }
  ];

  // Agregar tutorial de Usuarios solo para admin y soporte
  if (userRole === 'administrador' || userRole === 'soporte') {
    steps.push({
      element: '[href="/dashboard/usuarios"]',
      popover: {
        title: '⚙️ Gestión de Usuarios',
        description: 'Administra los usuarios del sistema: crea cuentas, asigna roles y controla permisos. Solo disponible para administradores y soporte.',
        position: 'right'
      }
    });
  }

  steps.push(
    {
      element: '.user-profile',
      popover: {
        title: '👤 Tu Perfil',
        description: `Conectado como ${userRole}. Aquí puedes ver tu información de usuario.`
      }
    },
    {
      popover: {
        title: '✨ ¡Tutorial Completado!',
        description: 'Ahora conoces todas las secciones del dashboard. Usa el botón ❓ en cualquier momento para ver tutoriales específicos de cada sección.'
      }
    }
  );

  driverObj = driver({
    ...driverConfig,
    steps
  });

  driverObj.drive();
};

// Tutorial de Clientes
export const startClientesTutorial = () => {
  driverObj = driver({
    ...driverConfig,
    steps: [
      {
        element: '.page-header h2',
        popover: {
          title: '👥 Gestión de Clientes',
          description: 'En esta sección administras toda la información de tus clientes.',
          position: 'bottom'
        }
      },
      {
        element: '.btn-create',
        popover: {
          title: '➕ Agregar Cliente',
          description: 'Haz clic aquí para crear un nuevo cliente. Podrás ingresar nombre, teléfono, dirección, tipo de cliente y asignar un responsable.',
          position: 'bottom'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: '🔍 Buscar Clientes',
          description: 'Usa este campo para buscar clientes por nombre o teléfono rápidamente.',
          position: 'bottom'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: '📊 Estadísticas',
          description: 'Visualiza el total de clientes y su distribución por tipo (Hogar, Tienda, Restaurante, etc.).',
          position: 'bottom'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: '📋 Tabla de Clientes',
          description: 'Lista completa de clientes con información detallada. Puedes editar o eliminar desde los botones de acción.',
          position: 'top'
        }
      },
      {
        popover: {
          title: '✅ Tutorial Completado',
          description: '¡Ya conoces cómo gestionar clientes! Usa el botón ❓ para ver otros tutoriales.'
        }
      }
    ]
  });

  driverObj.drive();
};

// Tutorial de Pedidos
export const startPedidosTutorial = () => {
  driverObj = driver({
    ...driverConfig,
    steps: [
      {
        element: '.page-header h2',
        popover: {
          title: '📦 Gestión de Pedidos',
          description: 'Administra todos los pedidos de tus clientes desde esta sección.',
          position: 'bottom'
        }
      },
      {
        element: '.btn-create',
        popover: {
          title: '➕ Crear Pedido',
          description: 'Crea un nuevo pedido seleccionando cliente, productos, cantidades y fecha de entrega.',
          position: 'bottom'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: '🔍 Buscar Pedidos',
          description: 'Busca pedidos por ID, cliente o productos.',
          position: 'bottom'
        }
      },
      {
        element: '.filters-row',
        popover: {
          title: '🎯 Filtros',
          description: 'Filtra pedidos por estado (Pendiente, En Proceso, Atendido, Cancelado) o por rango de fechas.',
          position: 'bottom'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: '📊 Resumen de Pedidos',
          description: 'Visualiza el total de pedidos y su distribución por estado.',
          position: 'bottom'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: '📋 Lista de Pedidos',
          description: 'Todos los pedidos con ID, cliente, productos, total y estado. Puedes cambiar el estado con el selector de cada fila.',
          position: 'top'
        }
      },
      {
        element: '.export-btn',
        popover: {
          title: '📤 Exportar Datos',
          description: 'Exporta los pedidos a Excel para análisis externos o reportes.',
          position: 'left'
        }
      },
      {
        popover: {
          title: '✅ Tutorial Completado',
          description: '¡Ya sabes cómo gestionar pedidos! Recuerda que puedes exportar datos en cualquier momento.'
        }
      }
    ]
  });

  driverObj.drive();
};

// Tutorial de Conversaciones
export const startConversacionesTutorial = () => {
  driverObj = driver({
    ...driverConfig,
    steps: [
      {
        element: '.page-header h2',
        popover: {
          title: '💬 Historial de Conversaciones',
          description: 'Revisa todas las interacciones de WhatsApp con tus clientes.',
          position: 'bottom'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: '🔍 Buscar Conversaciones',
          description: 'Busca conversaciones por teléfono del cliente.',
          position: 'bottom'
        }
      },
      {
        element: '.filters-row',
        popover: {
          title: '🎯 Filtrar por Fechas',
          description: 'Filtra las conversaciones por rango de fechas para encontrar interacciones específicas.',
          position: 'bottom'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: '📊 Estadísticas',
          description: 'Visualiza el total de conversaciones registradas.',
          position: 'bottom'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: '📋 Historial',
          description: 'Lista de conversaciones con teléfono del cliente, número de mensajes y fecha. Haz clic en "Ver Detalles" para ver los mensajes completos.',
          position: 'top'
        }
      },
      {
        popover: {
          title: '✅ Tutorial Completado',
          description: 'Ahora puedes revisar y analizar las conversaciones con tus clientes.'
        }
      }
    ]
  });

  driverObj.drive();
};

// Tutorial de Eventos
export const startEventosTutorial = () => {
  driverObj = driver({
    ...driverConfig,
    steps: [
      {
        element: '.page-header h2',
        popover: {
          title: '📅 Gestión de Eventos',
          description: 'Organiza y programa eventos, entregas y actividades.',
          position: 'bottom'
        }
      },
      {
        element: '.btn-create',
        popover: {
          title: '➕ Crear Evento',
          description: 'Programa un nuevo evento con título, descripción, fecha y hora.',
          position: 'bottom'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: '🔍 Buscar Eventos',
          description: 'Busca eventos por título o descripción.',
          position: 'bottom'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: '📊 Resumen',
          description: 'Visualiza el total de eventos programados.',
          position: 'bottom'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: '📋 Calendario de Eventos',
          description: 'Lista de todos los eventos con fecha, hora y descripción. Puedes editar o eliminar eventos.',
          position: 'top'
        }
      },
      {
        popover: {
          title: '✅ Tutorial Completado',
          description: 'Ya puedes gestionar eventos y mantener tu agenda organizada.'
        }
      }
    ]
  });

  driverObj.drive();
};

// Tutorial de Usuarios (solo Admin y Soporte)
export const startUsuariosTutorial = () => {
  driverObj = driver({
    ...driverConfig,
    steps: [
      {
        element: '.page-header h2',
        popover: {
          title: '⚙️ Gestión de Usuarios',
          description: 'Administra los usuarios del sistema, sus roles y permisos.',
          position: 'bottom'
        }
      },
      {
        element: '.btn-create',
        popover: {
          title: '➕ Agregar Usuario',
          description: 'Crea usuarios individuales o importa varios desde un archivo CSV. Puedes asignar diferentes roles.',
          position: 'bottom'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: '🔍 Buscar Usuarios',
          description: 'Busca usuarios por nombre o email.',
          position: 'bottom'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: '📊 Estadísticas',
          description: 'Visualiza el total de usuarios, activos y administradores.',
          position: 'bottom'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: '📋 Lista de Usuarios',
          description: 'Todos los usuarios con su rol y estado. Puedes cambiar roles, activar/desactivar usuarios o eliminarlos.',
          position: 'top'
        }
      },
      {
        element: '.rol-selector',
        popover: {
          title: '👤 Cambiar Roles',
          description: 'Cambia el rol de un usuario seleccionando entre: Administrador, Soporte, Mayorista, Director Comercial, etc.',
          position: 'left'
        }
      },
      {
        popover: {
          title: '✅ Tutorial Completado',
          description: 'Ya puedes administrar usuarios y controlar el acceso al sistema.'
        }
      }
    ]
  });

  driverObj.drive();
};
