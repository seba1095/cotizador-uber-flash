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

app.post('/cotizar', async (req, res) => {
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
            total_price: "3500"
          }
        ]
      });
    }

    return res.status(200).json({
      reference_id: "RND" + Math.floor(Math.random() * 1000000),
      rates: [
        {
          rate_id: "FLASH_STATIC",
          rate_description: "Envío con tarifa fija",
          service_name: "Envío Flash (Uber Moto)",
          service_code: "FLASH",
          total_price: "3500"
        }
      ]
    });
  } catch (error) {
    console.error('Error en /cotizar:', error);
    return res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

app.listen(3000, () => {
  console.log('Servidor activo en http://localhost:3000');
});
