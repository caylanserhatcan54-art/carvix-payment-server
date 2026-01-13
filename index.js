require("dotenv").config();
const express = require("express");
const Iyzipay = require("iyzipay");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: "https://sandbox-api.iyzipay.com",
});

/* ===============================
   ÖDEME BAŞLAT
================================ */
app.post("/create-payment", (req, res) => {
  const request = {
    locale: "tr",
    conversationId: "carvix-arac-analizi",
    price: "129.90",
    paidPrice: "129.90",
    currency: "TRY",
    basketId: "AI_ARAC_ANALIZI",
    paymentGroup: "PRODUCT",

    // ✅ CALLBACK BACKEND
    callbackUrl: "http://localhost:4000/payment/callback",

    enabledInstallments: [1],

    buyer: {
      id: "BY789",
      name: "Carvix",
      surname: "User",
      gsmNumber: "+905555555555",
      email: "info@carvix.site",
      identityNumber: "11111111111",
      registrationAddress: "Türkiye",
      ip: req.ip,
      city: "Istanbul",
      country: "Turkey",
    },

    shippingAddress: {
      contactName: "Carvix",
      city: "Istanbul",
      country: "Turkey",
      address: "Dijital Hizmet",
    },

    billingAddress: {
      contactName: "Carvix",
      city: "Istanbul",
      country: "Turkey",
      address: "Dijital Hizmet",
    },

    basketItems: [
      {
        id: "AI_ARAC_ANALIZI",
        name: "AI Destekli Araç Ön Analiz Raporu",
        category1: "Dijital Hizmet",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: "129.90",
      },
    ],
  };

  iyzipay.checkoutFormInitialize.create(request, (err, result) => {
    if (err || !result?.paymentPageUrl) {
      console.error("❌ Iyzico create error:", err, result);
      return res.status(500).json({ error: "İyzico hata verdi" });
    }

    res.json({ paymentPageUrl: result.paymentPageUrl });
  });
});

/* ===============================
   İYZICO CALLBACK
================================ */
app.post("/payment/callback", (req, res) => {
  const { token } = req.body;

  console.log("🔔 IYZICO CALLBACK TOKEN:", token);

  if (!token) {
    return res.redirect("http://localhost:3000/payment/fail");
  }

  // 🔑 TOKEN İLE ÖDEMEYİ SOR
  iyzipay.checkoutForm.retrieve(
    {
      locale: "tr",
      token,
    },
    (err, result) => {
      console.log("🔍 PAYMENT RESULT:", result);

      if (result?.paymentStatus === "SUCCESS") {
        // 👉 burada DB kaydı / analiz hakkı açma yapılır
        return res.redirect("http://localhost:3000/payment/success");
      } else {
        return res.redirect("http://localhost:3000/payment/fail");
      }
    }
  );
});

app.listen(4000, () => {
  console.log("💳 Payment server running on http://localhost:4000");
});
