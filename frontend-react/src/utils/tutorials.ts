import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { UserRole } from '../types';

// Configuración base de Driver.js
const driverConfig = {
  showProgress: true,
  nextBtnText: 'Siguiente →',
  prevBtnText: '← Anterior',
  doneBtnText: 'Finalizar',
  progressText: '{{current}} de {{total}}',
  popoverClass: 'driver-popover-custom'
};

let driverObj: any;

// Tutorial Completo - Filtrado por rol
export const startCompleteTutorial = (userRole: UserRole) => {
  const steps = [
    {
      element: '#dashboard-header',
      popover: {
        title: 'Bienvenido al Dashboard de Avellano',
        description: 'Este es tu panel de control donde podrás gestionar clientes, pedidos y conversaciones de WhatsApp. Te mostraré las principales funcionalidades disponibles.'
      }
    },
    {
      element: '[href="/dashboard/clientes"]',
      popover: {
        title: 'Gestión de Clientes',
        description: 'Consulta, crea y administra la información de todos tus clientes. Incluye datos de contacto, tipo de cliente y responsable asignado.'
      }
    },
    {
      element: '[href="/dashboard/pedidos"]',
      popover: {
        title: 'Gestión de Pedidos',
        description: 'Visualiza todos los pedidos con filtros por estado: pendientes, en proceso, atendidos y cancelados. Haz clic en cada pedido para ver detalles completos.'
      }
    },
    {
      element: '[href="/dashboard/conversaciones"]',
      popover: {
        title: 'Historial de Conversaciones',
        description: 'Consulta todas las conversaciones de WhatsApp con tus clientes. Útil para seguimiento y análisis de interacciones.'
      }
    }
  ];

  // Eventos solo para admin y soporte
  if (userRole === 'administrador' || userRole === 'soporte') {
    steps.push({
      element: '[href="/dashboard/eventos"]',
      popover: {
        title: 'Gestión de Eventos',
        description: 'Crea y programa eventos para enviar mensajes masivos a grupos de clientes. Funcionalidad disponible solo para administradores y soporte.'
      }
    });
  }

  // Usuarios solo para admin y soporte
  if (userRole === 'administrador' || userRole === 'soporte') {
    steps.push({
      element: '[href="/dashboard/usuarios"]',
      popover: {
        title: 'Gestión de Usuarios',
        description: 'Administra los usuarios del sistema: crea cuentas, asigna roles y controla permisos. Solo disponible para administradores y soporte.'
      }
    });
  }

  steps.push(
    {
      element: '.export-btn',
      popover: {
        title: 'Exportar Datos',
        description: 'Desde cualquier sección puedes exportar los datos a Excel para análisis externos o reportes.'
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
          title: 'Gestión de Clientes',
          description: 'En esta sección visualizas y administras toda la información de tus clientes.'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: 'Buscar Clientes',
          description: 'Usa este campo para buscar clientes por nombre, teléfono o negocio. La búsqueda filtra en tiempo real.'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: 'Estadísticas de Clientes',
          description: 'Visualiza el total de clientes registrados y estadísticas generales. Haz clic en las tarjetas para filtrar.'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: 'Lista de Clientes',
          description: 'Tabla completa con información de cada cliente: nombre, teléfono, tipo, dirección y responsable. Haz clic en una fila para ver más detalles.'
        }
      },
      {
        element: '.export-btn',
        popover: {
          title: 'Exportar a Excel',
          description: 'Exporta la lista de clientes a Excel para análisis externos o respaldos.'
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
          title: 'Gestión de Pedidos',
          description: 'Visualiza y administra todos los pedidos realizados por los clientes.'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: 'Buscar Pedidos',
          description: 'Busca pedidos por ID, nombre del cliente o productos. La búsqueda filtra la tabla en tiempo real.'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: 'Filtrar por Estado',
          description: 'Haz clic en cada tarjeta para filtrar pedidos: Total, Pendientes, En Proceso, Atendidos o Cancelados. Las tarjetas también muestran estadísticas actualizadas.'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: 'Lista de Pedidos',
          description: 'Todos los pedidos con ID, cliente, productos, total y estado. Haz clic en una fila para ver detalles completos y cambiar el estado del pedido.'
        }
      },
      {
        element: '.export-btn',
        popover: {
          title: 'Exportar Pedidos',
          description: 'Exporta los pedidos filtrados a Excel para análisis externos o reportes.'
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
          title: 'Historial de Conversaciones',
          description: 'Consulta todas las interacciones de WhatsApp registradas con tus clientes.'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: 'Buscar Conversaciones',
          description: 'Busca conversaciones por número de teléfono del cliente. La búsqueda filtra en tiempo real.'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: 'Estadísticas',
          description: 'Visualiza el total de conversaciones registradas en el sistema.'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: 'Historial',
          description: 'Lista de conversaciones con teléfono del cliente, cantidad de mensajes y fecha. Haz clic en "Ver Detalles" para leer los mensajes completos.'
        }
      },
      {
        element: '.export-btn',
        popover: {
          title: 'Exportar Conversaciones',
          description: 'Exporta el historial de conversaciones a Excel para análisis o respaldos.'
        }
      }
    ]
  });

  driverObj.drive();
};

// Tutorial de Eventos (solo Admin y Soporte)
export const startEventosTutorial = () => {
  driverObj = driver({
    ...driverConfig,
    steps: [
      {
        element: '.page-header h2',
        popover: {
          title: 'Gestión de Eventos',
          description: 'Crea y programa eventos para enviar mensajes masivos a grupos específicos de clientes.'
        }
      },
      {
        element: '.btn-create',
        popover: {
          title: 'Crear Evento',
          description: 'Haz clic aquí para crear un nuevo evento. Podrás seleccionar destinatarios, escribir el mensaje, programar fecha y hora de envío.'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: 'Buscar Eventos',
          description: 'Busca eventos por nombre o descripción. La búsqueda filtra en tiempo real.'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: 'Estadísticas de Eventos',
          description: 'Visualiza el total de eventos programados y estadísticas generales.'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: 'Lista de Eventos',
          description: 'Todos los eventos programados con nombre, fecha, hora, destinatarios y estado. Puedes ver detalles, editar o eliminar eventos.'
        }
      },
      {
        element: '.export-btn',
        popover: {
          title: 'Exportar Eventos',
          description: 'Exporta la lista de eventos a Excel para análisis o respaldos.'
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
          title: 'Gestión de Usuarios',
          description: 'Administra los usuarios del sistema, sus roles y permisos de acceso.'
        }
      },
      {
        element: '.btn-create',
        popover: {
          title: 'Agregar Usuario',
          description: 'Crea nuevos usuarios asignando nombre, email, contraseña y rol. Puedes crear administradores, soporte u operadores.'
        }
      },
      {
        element: '.search-input',
        popover: {
          title: 'Buscar Usuarios',
          description: 'Busca usuarios por nombre o email. La búsqueda filtra en tiempo real.'
        }
      },
      {
        element: '.stats-row',
        popover: {
          title: 'Estadísticas de Usuarios',
          description: 'Visualiza el total de usuarios registrados, activos e inactivos.'
        }
      },
      {
        element: '.data-table',
        popover: {
          title: 'Lista de Usuarios',
          description: 'Todos los usuarios con su nombre, email, rol y estado. Puedes cambiar roles, activar/desactivar o eliminar usuarios.'
        }
      },
      {
        element: '.export-btn',
        popover: {
          title: 'Exportar Usuarios',
          description: 'Exporta la lista de usuarios a Excel para análisis o respaldos.'
        }
      }
    ]
  });

  driverObj.drive();
};
