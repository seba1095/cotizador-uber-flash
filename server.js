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

const costo = calcularCostoFlash(10);

app.post('/cotizar', async (req, res) => {
  try {
    //const costo = 6100;

    const respuesta = {
      reference_id: `RND${Date.now()}`,
      rates: [
        {
          rate_id: `FLASH_${costo}`,
          rate_description: "Tarifa fija",
          service_name: "Envío Flash (Uber Moto)",
          service_code: "FLASH",
          price: "$6.150",
          price_unformatted: 6130.1,
          total_price: Math.round(costo).toString()
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
