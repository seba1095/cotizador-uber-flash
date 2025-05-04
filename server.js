require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.get('/servicios', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    services: [
      {
        service_name: "Envío Flash (Uber Moto)",
        service_code: "FLASH"
      }
    ]
  });
});

const ORIGEN = 'Nueva San Martín 1490, 8340513 Santiago, Región Metropolitana';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const getDistanceInKm = async (origen, destino) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(origen)}&destinations=${encodeURIComponent(destino)}&mode=driving&key=${GOOGLE_API_KEY}`;
  const response = await axios.get(url);
  const data = response.data;

  if (data.status !== 'OK' || data.rows[0].elements[0].status !== 'OK') {
    throw new Error('No se pudo obtener la distancia');
  }

  const metros = data.rows[0].elements[0].distance.value;
  return metros / 1000;
};

const calcularCostoFlash = (km) => {
  const base = 3000;
  const porKm = 500;
  const bruto = base + (km * porKm);
  return Math.round(bruto / 100) * 100;
};

app.post('/cotizar', async (req, res) => {
  try {
    const to = req.body?.request?.to;
    console.log("Contenido de 'to':", to);

    let destino;
    if (!to || !to.address || !to.city || !to.region_name || !to.country) {
      destino = ORIGEN;
    } else {
      destino = `${to.address}${to.street_number ? ' ' + to.street_number : ''}, ${to.city}, ${to.region_name}, ${to.country}`;
    }
    console.log("Destino construido:", destino);

    let costo;
    try {
      const km = await getDistanceInKm(ORIGEN, destino);
      console.log("Distancia calculada:", km.toFixed(2), "km");

      if (km > 20) {
        console.warn("Distancia fuera de rango, usando tarifa fija.");
        costo = 3500;
      } else {
        costo = calcularCostoFlash(km);
      }
    } catch (err) {
      console.error("Error al calcular distancia:", err.response?.data || err.message);
      console.warn("Fallo consulta a Maps, usando tarifa fija.");
      costo = 3500;
    }

    const respuesta = {
      reference_id: "STATIC_OK",
      rates: [
        {
          rate_id: `FLASH_${costo}`,
          rate_description: "Tarifa calculada o fija",
          service_name: "Envío Flash (Uber Moto)",
          service_code: "FLASH",
          total_price: costo
        }
      ]
    };

    console.log("Respuesta enviada a Jumpseller:\n", JSON.stringify(respuesta, null, 2));
    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error en /cotizar:', error);
    return res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

app.listen(3000, () => {
  console.log('Servidor activo en http://localhost:3000');
});
