const db = require('../database/mongodb');

function mapMesa(mesa) {
  if (!mesa) return null;
  return {
    ...mesa,
    id: mesa.id || String(mesa._id),
    capacidad: Number(mesa.capacidad),
    disponible: Boolean(mesa.disponible),
  };
}

async function list(req, res) {
  try {
    const mesas = await db.Getmesas();
    return res.status(200).json(mesas.map(mapMesa));
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al listar mesas');
  }
}

async function getById(req, res) {
  try {
    const mesa = await db.GetMesaById(req.params.id);
    if (!mesa) return res.status(404).send('Mesa no encontrada');
    return res.status(200).json(mapMesa(mesa));
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al obtener mesa');
  }
}

async function create(req, res) {
  try {
    const body = req.body || {};
    const nombre = String(body.nombre || '').trim();
    const capacidad = Number(body.capacidad);
    if (!nombre || !capacidad) {
      return res.status(400).send('nombre y capacidad son requeridos');
    }

    const existing = await db.GetMesaById(nombre);
    if (existing) {
      return res.status(400).send('Mesa ya existe');
    }

    const numero = body.numero ? Number(body.numero) : await db.GetNextMesaNumero();
    const payload = {
      numero,
      nombre,
      capacidad,
      disponible: body.disponible !== undefined ? Boolean(body.disponible) : true,
      mesero: body.mesero || null,
      personaTitular: body.personaTitular || null,
    };

    const created = await db.AddMesa(payload);
    return res.status(201).json(mapMesa(created));
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al crear mesa');
  }
}

async function update(req, res) {
  try {
    const body = req.body || {};
    const patch = {
      disponible: body.disponible,
      personaTitular: body.personaTitular,
      mesero: body.mesero,
      nombre: body.nombre,
      capacidad: body.capacidad != null ? Number(body.capacidad) : undefined,
    };
    Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

    const result = await db.UpdateStatusMesa(req.params.id, patch);
    if (!result || result.matchedCount === 0) {
      return res.status(404).send('Mesa no existe');
    }
    const mesa = await db.GetMesaById(req.params.id);
    return res.status(200).json(mapMesa(mesa));
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al actualizar mesa');
  }
}

async function remove(req, res) {
  try {
    const result = await db.DeleteMesa(req.params.id);
    if (!result || result.deletedCount === 0) {
      return res.status(404).send('Mesa no existe');
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || 'Error al eliminar mesa');
  }
}

module.exports = { list, getById, create, update, remove };
