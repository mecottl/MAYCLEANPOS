const PRECIO_POR_KG = 18;
const PUNTOS_PARA_GRATIS = 9;

function limpiarTelefono(telefonoRaw) {
  if (!telefonoRaw) return '';
  let numLimpio = telefonoRaw.replace(/\D/g, '');
  if (numLimpio.length === 10) {
    return `52${numLimpio}`;
  }
  return numLimpio;
}

function _crearMensajeDesglosado(pedido, cliente, kilos, esPedidoGratis) {
  let lealtadTitulo = '';
  let lealtadProgreso = '';
  const contadorActual = Number(cliente.contador_lealtad) || 0;

  if (esPedidoGratis) {
    lealtadTitulo = '¡Felicidades, usaste tu pedido gratis!';
    lealtadProgreso = `Progreso: 0/${PUNTOS_PARA_GRATIS + 1}`;
  } else {
    lealtadTitulo = '¡Gracias por tu compra!';
    lealtadProgreso = `Progreso: ${contadorActual}/${PUNTOS_PARA_GRATIS + 1}`;
  }

  const kilosNum = Number(kilos) || 0;
  const precioServicioNum = Number(pedido.precio_servicio) || 0;
  const tarifaDomicilioNum = Number(pedido.tarifa_domicilio) || 0;

  const precioBrutoServicio = kilosNum * PRECIO_POR_KG;
  const descuento = precioBrutoServicio - precioServicioNum;

  const nombreCliente = cliente.nombre;
  const telefonoCliente = cliente.telefono;
  const total = pedido.precio_total;
  const estado_pago = pedido.estado_pago;
  const fechaPedido = new Date(pedido.fecha_creacion).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const mensaje =
    `*MAYACLEAN EXPRESS*%0A` +
    `====================%0A` +
    `¡Hola ${encodeURIComponent(nombreCliente)}!%0A%0A` +
    `*Fecha de Pedido:* ${encodeURIComponent(fechaPedido)}%0A` +
    `*Estado de pago:* ${encodeURIComponent(estado_pago)}%0A%0A` +
    `*DATOS DEL CLIENTE*%0A` +
    `*Tel:* ${encodeURIComponent(telefonoCliente)}%0A` +
    `*Dirección:* ${encodeURIComponent(cliente.direccion || 'Mostrador')}%0A%0A` +
    `--- DESGLOSE ---%0A` +
    `*Servicio (Lavado ${encodeURIComponent(kilosNum.toFixed(1))}kg):* $${encodeURIComponent(precioBrutoServicio.toFixed(2))}%0A` +
    `*Servicio a Domicilio:* $${encodeURIComponent(tarifaDomicilioNum.toFixed(2))}%0A` +
    `*Descuento de Lealtad:* -$${encodeURIComponent(descuento.toFixed(2))}%0A` +
    `*TOTAL A PAGAR:* $${encodeURIComponent(Number(total).toFixed(2))}%0A%0A` +
    `--- PROGRAMA LEALTAD ---%0A` +
    `${encodeURIComponent(lealtadTitulo)}%0A` +
    `${encodeURIComponent(lealtadProgreso)}%0A%0A` +
    `¡Gracias por tu preferencia!`;

  return mensaje;
}

export function generarTicketWhatsApp(pedido, cliente, kilos, esPedidoGratis) {
  const telefonoLimpio = limpiarTelefono(cliente.telefono);
  const mensaje = _crearMensajeDesglosado(pedido, cliente, kilos, esPedidoGratis);
  const waLink = `https://wa.me/${telefonoLimpio}?text=${mensaje}`;
  return waLink;
}

export function generarAvisoListo(pedido) {
  const telefonoLimpio = limpiarTelefono(pedido.telefono_cliente);
  const mensaje = encodeURIComponent(`¡Hola ${pedido.nombre_cliente}! Tu pedido de Mayaclean está listo para recoger.`);
  const waLink = `https://wa.me/${telefonoLimpio}?text=${mensaje}`;
  return waLink;
}

export function generarTicketReenvio(pedido, cliente, kilos) {
  const telefonoLimpio = limpiarTelefono(cliente.telefono);
  const fuePedidoGratis = (Number(pedido.precio_servicio) === 0 && Number(kilos) > 0);
  const mensaje = _crearMensajeDesglosado(pedido, cliente, kilos, fuePedidoGratis);
  const mensajeConPrefijo = `*Reenvío de Ticket*%0A${mensaje}`;
  const waLink = `https://wa.me/${telefonoLimpio}?text=${mensajeConPrefijo}`;
  return waLink;
}
