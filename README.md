# CORS Ninja Proxy

![CORS Ninja Banner](./public/corsbanner.jpeg)

A powerful CORS proxy service built with Cloudflare Workers that enables cross-origin requests for any API endpoint with advanced security, rate limiting, and performance features.

[![GitHub license](https://img.shields.io/github/license/harshraj001/Cors-Ninja)](https://github.com/harshraj001/Cors-Ninja/blob/main/LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com)
[![GitHub stars](https://img.shields.io/github/stars/harshraj001/Cors-Ninja?style=social)](https://github.com/harshraj001/Cors-Ninja/stargazers)

## 🚀 Live Demo

The service is deployed and available at:
[https://cors-ninja.harshraj864869.workers.dev](https://cors-ninja.harshraj864869.workers.dev)

## 🌟 Features

- **Full CORS Support**: Enable cross-origin requests for any API endpoint
- **All HTTP Methods**: Support for GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Request Forwarding**: Preserves headers and request body
- **Rate Limiting**: Configurable requests per minute with sliding window implementation
- **Security**:
  - Origin whitelisting
  - Domain blacklisting
  - Request validation
  - Header sanitization
- **Error Handling**: Detailed error messages and status code mapping
- **Performance**:
  - Response caching with configurable TTL
  - Header optimization
  - Connection pooling
- **Monitoring**: Request logging and performance metrics

## 📋 Table of Contents

- [Endpoints](#endpoints)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Local Development](#local-development)
- [Security Considerations](#security-considerations)
- [Performance Monitoring](#performance-monitoring)
- [License](#license)

## 🔌 Endpoints

The CORS Ninja Proxy service exposes the following endpoints:

| Endpoint | Description |
|----------|-------------|
| `/` | Service information and documentation links |
| `/proxy?url=<target-url>` | Main proxy endpoint for forwarding requests |
| `/config` | View current configuration |

## 🔧 Usage Examples

### Basic Usage

To proxy a request through CORS Ninja:

```javascript
// JavaScript Fetch API example
fetch('https://cors-ninja.harshraj864869.workers.dev/proxy?url=https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Different HTTP Methods

CORS Ninja supports all HTTP methods:

```javascript
// POST request example
fetch('https://cors-ninja.harshraj864869.workers.dev/proxy?url=https://api.example.com/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Test Data',
    body: 'This is a test from CORS Ninja',
    userId: 1
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Testing with the Test Page

A comprehensive test page is available at:
[https://cors-ninja.harshraj864869.workers.dev/test.html](https://cors-ninja.harshraj864869.workers.dev/test.html)

This page allows you to:
- Test different HTTP methods
- Compare direct API calls vs. proxied calls
- View service configuration
- See detailed response information

## ⚙️ Configuration

CORS Ninja is highly configurable. The default configuration is:

```javascript
{
  "rateLimit": {
    "requestsPerMinute": 60,
    "enabled": true
  },
  "security": {
    "allowedOrigins": ["*"],
    "blockedDomains": [],
    "enabledHeaderValidation": true,
    "enabledUrlValidation": true
  },
  "cache": {
    "enabled": true,
    "maxAgeSeconds": 300
  },
  "monitoring": {
    "enabled": true,
    "logLevel": "info"
  }
}
```

You can view the current configuration by visiting the `/config` endpoint.

## 🌐 Deployment

CORS Ninja is designed to be deployed using Cloudflare Workers. Here's how to deploy your own instance:

### Prerequisites

- [Node.js](https://nodejs.org/en/) installed
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- A Cloudflare account

### Deployment Steps

1. Clone this repository:
   ```bash
   git clone https://github.com/harshraj001/Cors-Ninja.git
   cd Cors-Ninja
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

4. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

5. Your CORS Ninja proxy will be deployed to a URL like:
   ```
   https://<your-worker-name>.<your-account>.workers.dev
   ```

### Setting Up KV Namespaces for Rate Limiting

For rate limiting to work properly, you need to set up a KV namespace:

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to "Workers & Pages"
3. Select your "cors-ninja" worker
4. Go to "Settings" and then "Variables"
5. Under "KV Namespace Bindings", click "Add binding"
6. Set the Variable name to `RATE_LIMIT_STORE`
7. Either create a new namespace or select an existing one
8. Save and deploy

This KV namespace will store rate limiting data for each client IP, allowing the sliding window rate limiting implementation to function correctly.

### Customizing Your Deployment

You can customize your deployment by modifying the `wrangler.jsonc` file:

- Change the worker name
- Update compatibility settings
- Modify environment variables
- Add KV namespace for rate limiting

## 💻 Local Development

To run CORS Ninja locally for development:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cors-ninja.git
   cd cors-ninja
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run start
   ```

4. The service will be available at:
   ```
   http://localhost:8787
   ```

5. Visit the test page at:
   ```
   http://localhost:8787/test.html
   ```

## 🔒 Security Considerations

When deploying CORS Ninja, consider the following security best practices:

1. **Origin Whitelisting**: Update the `allowedOrigins` array in the configuration to limit which origins can use your proxy.

2. **Domain Blacklisting**: Update the `blockedDomains` array to prevent proxying requests to sensitive domains.

3. **Rate Limiting**: Configure the rate limiting settings to prevent abuse.

4. **Cloudflare Security**: Use Cloudflare's security features like Web Application Firewall (WAF) for additional protection.

## 📊 Performance Monitoring

CORS Ninja includes built-in performance monitoring:

- Response time tracking
- Custom headers with performance metrics
- Request logging

To enable detailed performance metrics, set the `monitoring.enabled` to `true` and `monitoring.logLevel` to `debug`.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Created by [Harsh Raj](https://github.com/harshraj864869) | Powered by Cloudflare Workers
