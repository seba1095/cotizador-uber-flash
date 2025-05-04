require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.get('/servicios', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    services: [
      {
        service_name: "Envío Flash (Uber Moto)",
        service_code: "FLASH2"
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
  const base = 3000;
  const porKm = 700;
  let bruto = 0
  bruto = base + (km * porKm);
  return bruto;
};

// Esta línea ya no se necesita, porque el costo será dinámico según la distancia

app.post('/cotizar', async (req, res) => {
  try {
    const destino = req.body.request.to.address + ' ' + req.body.request.to.street_number + ', ' + req.body.request.to.municipality_name + ', ' + req.body.request.to.region_name + ', ' + 'Chile';
    
    let km = 0;
    km = await getDistanceInKm(ORIGEN, destino);
    if (km > 10) {
      return res.status(400).json({ error: 'La distancia máxima permitida es 9 km.' });

      
    }
    let costo = 0;
    costo = calcularCostoFlash(km);
    //costo = km;

    const respuesta = {
      //reference_id: `RND_${costo}}`,
      rates: [
        {
          //rate_id: "242421214",
          //rate_description: "Tarifa fija",
          service_name: "Envío Flash (Uber Moto)",
          service_code: "FLASH2",
          //price: "$1001",
          total_price: costo
          //price_unformatted: parseInt(`${total}`, 10)
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

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});
