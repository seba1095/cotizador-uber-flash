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

const ORIGEN = 'Av. Providencia 1234, Santiago';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const getDistanceInKm = async (origen, destino) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(origen)}&destinations=${encodeURIComponent(destino)}&mode=driving&key=${GOOGLE_API_KEY}`;

  const response = await axios.get(url);
  const data = response.data;
  console.log(JSON.stringify(data, null, 2));

  if (data.status !== 'OK' || data.rows[0].elements[0].status !== 'OK') {
    throw new Error('No se pudo obtener la distancia');
  }

  const metros = data.rows[0].elements[0].distance.value;
  return metros / 1000;
};

const calcularCostoFlash = (km) => {
  const base = 1500;
  const porKm = 400;
  return Math.round(base + (km * porKm));
};

app.post('/cotizar', async (req, res) => {
  try {
    const to = req.body?.request?.to;

    // Si no viene dirección (como cuando haces Fetch Services), devuelve algo genérico
    if (!to) {
      return res.json({
        rates: [
          {
            name: "Envío Flash (Uber Moto)",
            description: "Cotización estimada (dirección no recibida)",
            price: 4000,
            currency: "CLP"
          }
        ]
      });
    }

    const destino = `${to.address} ${to.street_number}, ${to.city}, ${to.region_name}, ${to.country}`;
    const km = await getDistanceInKm(ORIGEN, destino);
    const costo = calcularCostoFlash(km);

    res.json({
      rates: [
        {
          name: "Envío Flash (Uber Moto)",
          description: `Entrega rápida (${km.toFixed(2)} km)`,
          price: costo,
          currency: "CLP"
        }
      ]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

app.listen(3000, () => {
  console.log('Servidor activo en http://localhost:3000');
});
