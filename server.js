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
  console.log("Solicitud recibida de Jumpseller:\n", JSON.stringify(req.body, null, 2));
  try {
    const to = req.body?.request?.to;

    if (!to) {
      return res.status(200).json({
        reference_id: "PREVIEW",
        rates: [
          {
            rate_id: "FLASH_PREVIEW",
            rate_description: "Cotización estimada (dirección no recibida)",
            service_name: "Envío Flash (Uber Moto)",
            service_code: "FLASH",
            total_price: 3500
          }
        ]
      });
    }

    if (!to.address || !to.city || !to.region_name || !to.country) {
      throw new Error('Dirección incompleta');
    }
    const destino = `${to.address} ${to.street_number}, ${to.city}, ${to.region_name}, ${to.country}`;
    console.log("Consultando distancia a:", destino);
    const km = await getDistanceInKm(ORIGEN, destino);

    // if (km > 11) {
    //   return res.status(200).json({
    //     reference_id: `OUT_OF_RANGE`,
    //     rates: []
    //   });
    // }

    const costo = calcularCostoFlash(km);

    const respuesta = {
      reference_id: "RND" + Math.floor(Math.random() * 1000000),
      rates: [
        {
          rate_id: "FLASH_STATIC",
          rate_description: `Entrega rápida (${km.toFixed(1)} km)`,
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
