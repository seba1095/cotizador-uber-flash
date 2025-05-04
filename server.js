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

const ORIGEN = 'Nueva San Martín 1490, Santiag Centro, Región Metropolitana';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const getDistanceInKm = async (origen, destino) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(origen)}&destinations=${encodeURIComponent(destino)}&mode=driving&key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;

    if (data.status !== 'OK' || data.rows[0].elements[0].status !== 'OK') {
      console.warn("Google API devolvió una respuesta no válida:", data);
      return null;
    }

    const metros = data.rows[0].elements[0].distance.value;
    return metros / 1000;
  } catch (err) {
    console.error("Error consultando la API de Google:", err.message);
    return null;
  }
};

const calcularCostoFlash = (km) => {
  const base = 3200;
  const porKm = 500;
  const bruto = base + (km * porKm);
  return bruto;
};

// Esta línea ya no se necesita, porque el costo será dinámico según la distancia

app.post('/cotizar', async (req, res) => {
  try {
    const destino = req.body.request.to.address + ' ' + req.body.request.to.street_number + ', ' + req.body.request.to.municipality_name + ', ' + req.body.request.to.region_name + ', ' + 'Chile';
    const km = await getDistanceInKm(ORIGEN, destino);
    const costo = calcularCostoFlash(km)

    const respuesta = {
      //reference_id: `RND_${costo}}`,
      rates: [
        {
          //rate_id: `FLASH_${costo}`,
          //rate_description: "Tarifa fija",
          service_name: "Envío Flash (Uber Moto)",
          service_code: "FLASH",
          price: "$1001",
          price_unformatted: 1000.1,
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
