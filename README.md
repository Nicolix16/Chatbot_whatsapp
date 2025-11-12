<p align="center">
  <a href="https://builderbot.vercel.app/">
    <picture>
      <img src="https://builderbot.vercel.app/assets/thumbnail-vector.png" height="80">
    </picture>
    <h2 align="center">BuilderBot</h2>
  </a>
</p>



<p align="center">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/@builderbot/bot">
    <img alt="" src="https://img.shields.io/npm/v/@builderbot/bot?color=%2300c200&label=%40bot-whatsapp">
  </a>
  <a aria-label="Join the community on GitHub" href="https://link.codigoencasa.com/DISCORD">
    <img alt="" src="https://img.shields.io/discord/915193197645402142?logo=discord">
  </a>
</p>


## Getting Started

With this library, you can build automated conversation flows agnostic to the WhatsApp provider, set up automated responses for frequently asked questions, receive and respond to messages automatically, and track interactions with customers. Additionally, you can easily set up triggers to expand functionalities limitlessly.

```
npm create builderbot@latest
```


## Documentation

Visit [builderbot](https://builderbot.vercel.app/) to view the full documentation.


## Official Course

If you want to discover all the functions and features offered by the library you can take the course.
[View Course](https://app.codigoencasa.com/courses/builderbot?refCode=LEIFER)


## Contact Us
- [💻 Discord](https://link.codigoencasa.com/DISCORD)
- [👌 𝕏 (Twitter)](https://twitter.com/leifermendez)

## How to test the Pedido button

1) Create your `.env` file with your WhatsApp Cloud API credentials:

```
JWT_TOKEN=your_token
NUMBER_ID=1234567890
VERIFY_TOKEN=your_verify_token
PROVIDER_VERSION=v21.0
PORT=3008
```

2) Build and run locally:

```
npm run build
npm start
```

3) In WhatsApp, start the chat. You’ll see a welcome message with buttons. Tap "🛒 Pedido".

Expected:
- The bot logs a line similar to: `[flow] Pedido triggered by <phone> -> text: "🛒 Pedido"` in the console.
- You’ll receive a new message asking for your tipo de cliente with the buttons: "🏠 Hogar", "💼 Negocios", "📍 Encuéntranos - Almacenes Avellano", y "Volver al menú principal".

If the button text varies (upper/lowercase or emoji), the flow also accepts "Pedido" and "pedido" as triggers.