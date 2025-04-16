/**
 * CORS Ninja - A Cloudflare Worker CORS Proxy Service
 * 
 * This service enables CORS for any API endpoint with advanced features:
 * - Support for all HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
 * - Request forwarding with header preservation
 * - Configurable rate limiting with sliding window implementation
 * - Origin whitelisting for security
 * - Request validation and error handling
 * - Performance monitoring and caching
 * 
 * @author Harsh Raj
 * @version 1.0.0
 * @license MIT
 * @link https://github.com/harshraj001/Cors-Ninja
 */

// Configuration interface
export interface Config {
  // Rate limiting settings
  rateLimit: {
    requestsPerMinute: number;
    enabled: boolean;
  };
  // Security settings
  security: {
    allowedOrigins: string[];
    blockedDomains: string[];
    enabledHeaderValidation: boolean;
    enabledUrlValidation: boolean;
  };
  // Caching settings
  cache: {
    enabled: boolean;
    maxAgeSeconds: number;
  };
  // Monitoring settings
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Default configuration
const DEFAULT_CONFIG: Config = {
  rateLimit: {
    requestsPerMinute: 60,
    enabled: true,
  },
  security: {
    allowedOrigins: ['*'], // Default to allowing all origins
    blockedDomains: [], // Default to no blocked domains
    enabledHeaderValidation: true,
    enabledUrlValidation: true,
  },
  cache: {
    enabled: true,
    maxAgeSeconds: 300, // 5 minutes
  },
  monitoring: {
    enabled: true,
    logLevel: 'info',
  },
};

// Error response helper
function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        status,
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}

// Rate limiting using Cloudflare's KV store
interface RateLimitData {
  count: number;
  timestamps: number[];
}

/**
 * Validates a URL against blocked domains
 * @param url The URL to validate
 * @param blockedDomains Array of blocked domains
 * @returns boolean indicating if URL is valid
 */
function validateUrl(url: string, blockedDomains: string[]): boolean {
  try {
    const parsedUrl = new URL(url);
    // Check if domain is in blocked list
    return !blockedDomains.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
}

/**
 * Validates origin against allowlist
 * @param origin The origin to validate
 * @param allowedOrigins Array of allowed origins
 * @returns boolean indicating if origin is allowed
 */
function validateOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.includes(origin);
}

/**
 * Prepares headers for forwarding
 * @param requestHeaders Original request headers
 * @param forwardRequest Whether to prepare for forwarding
 * @returns New Headers object with prepared headers
 */
function prepareHeaders(requestHeaders: Headers, forwardRequest: boolean): Headers {
  const headers = new Headers();
  
  // Copy original headers
  requestHeaders.forEach((value, key) => {
    // Skip certain headers that shouldn't be forwarded
    const skippedHeaders = ['host', 'cf-', 'cdn-loop', 'connection', 'expect'];
    if (forwardRequest && skippedHeaders.some(h => key.toLowerCase().startsWith(h))) {
      return;
    }
    headers.append(key, value);
  });
  
  return headers;
}

/**
 * Sets CORS headers on response
 * @param headers Headers object to modify
 * @param request Original request
 * @param config Service configuration
 */
function setCorsHeaders(headers: Headers, request: Request, config: Config): void {
  const origin = request.headers.get('Origin') || '*';
  
  // If origin validation is enabled, only set if origin is allowed
  if (config.security.allowedOrigins.includes('*') || 
      config.security.allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    headers.set('Access-Control-Allow-Origin', config.security.allowedOrigins[0] || '');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  headers.set('Access-Control-Allow-Headers', 
    request.headers.get('Access-Control-Request-Headers') || 
    'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Add Vary header for proper caching
  headers.append('Vary', 'Origin');
  
  // Add CORS Ninja headers for debugging and info
  headers.set('X-CORS-Ninja-Version', '1.0.0');
  headers.set('X-CORS-Ninja-Date', new Date().toISOString());
}

// Main worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Initialize performance tracking
    const startTime = Date.now();
    
    // Get configuration (in a real implementation, this could come from KV or environment)
    const config: Config = DEFAULT_CONFIG;
    
    // Extract the URL to proxy from the request
    const url = new URL(request.url);
    
    // Handle root path for service information
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(
        JSON.stringify({
          name: 'CORS Ninja Proxy',
          version: '1.0.0',
          documentation: 'https://github.com/harshraj001/Cors-Ninja',
          endpoints: {
            '/': 'Service information',
            '/proxy?url=<target>': 'Proxy the specified URL with CORS headers',
            '/config': 'View current configuration',
          },
          deployed: 'https://cors-ninja.harshraj864869.workers.dev'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          },
        }
      );
    }
    
    // Handle configuration endpoint
    if (url.pathname === '/config') {
      return new Response(
        JSON.stringify({
          config,
          message: 'Current CORS Ninja configuration',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          },
        }
      );
    }
    
    // Handle OPTIONS request (preflight)
    if (request.method === 'OPTIONS') {
      const headers = new Headers();
      setCorsHeaders(headers, request, config);
      return new Response(null, { headers });
    }
    
    // Handle proxy requests
    if (url.pathname === '/proxy') {
      const targetUrl = url.searchParams.get('url');
      
      // Validate target URL
      if (!targetUrl) {
        return errorResponse('Missing target URL. Please provide a url parameter.', 400);
      }
      
      if (config.security.enabledUrlValidation && !validateUrl(targetUrl, config.security.blockedDomains)) {
        return errorResponse('Invalid or blocked target URL.', 403);
      }
      
      // Validate origin if origin whitelisting is enabled
      const origin = request.headers.get('Origin');
      if (origin && config.security.allowedOrigins.length > 0 && 
          !config.security.allowedOrigins.includes('*') && 
          !validateOrigin(origin, config.security.allowedOrigins)) {
        return errorResponse('Origin not allowed.', 403);
      }
      
      try {
        // Apply rate limiting if enabled
        if (config.rateLimit.enabled) {
          // Get client IP for rate limiting
          const clientIP = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
          
          // If KV namespace is available, use it for rate limiting
          if (env.RATE_LIMIT_STORE) {
            const key = `ratelimit:${clientIP}`;
            const now = Date.now();
            const rateLimitWindow = 60 * 1000; // 1 minute in milliseconds
            
            // Get current rate limit data
            const storedData = await env.RATE_LIMIT_STORE.get(key);
            let rateData: RateLimitData = storedData ? 
              JSON.parse(storedData) : 
              { count: 0, timestamps: [] };
          
            // Filter out timestamps older than the window
            rateData.timestamps = rateData.timestamps.filter(ts => now - ts < rateLimitWindow);
            
            // Check if rate limit is exceeded
            if (rateData.timestamps.length >= config.rateLimit.requestsPerMinute) {
              return errorResponse('Rate limit exceeded. Try again later.', 429);
            }
            
            // Update rate limit data
            rateData.timestamps.push(now);
            rateData.count++;
            
            // Store updated data
            await env.RATE_LIMIT_STORE.put(key, JSON.stringify(rateData), { expirationTtl: 60 });
          } else {
            // Simple in-memory rate limiting fallback (for development only)
            console.log('Rate limiting KV not available - using fallback method');
          }
        }
        
        // Clone the request to modify it
        const requestInit: RequestInit = {
          method: request.method,
          headers: prepareHeaders(request.headers, true),
          redirect: 'follow',
        };
        
        // Include body for methods that support it
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          // Clone the request body
          requestInit.body = await request.clone().arrayBuffer();
        }
        
        // Forward the request to the target
        const response = await fetch(targetUrl, requestInit);
        
        // Prepare the response
        const responseInit: ResponseInit = {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers),
        };
        
        // Set CORS headers
        setCorsHeaders(responseInit.headers as Headers, request, config);
        
        // Add cache headers if caching is enabled
        if (config.cache.enabled) {
          responseInit.headers?.set('Cache-Control', `public, max-age=${config.cache.maxAgeSeconds}`);
        } else {
          responseInit.headers?.set('Cache-Control', 'no-store, no-cache');
        }
        
        // Add performance monitoring headers
        if (config.monitoring.enabled) {
          const processingTime = Date.now() - startTime;
          responseInit.headers?.set('X-CORS-Ninja-Processing-Time', `${processingTime}ms`);
        }
        
        // Create the response with the target's body
        const responseBody = await response.arrayBuffer();
        return new Response(responseBody, responseInit);
      } catch (error) {
        console.error('Proxy request failed:', error);
        return errorResponse(
          `Failed to proxy request: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500
        );
      }
    }
    
    // Handle all other routes
    return errorResponse('Not Found. Valid endpoints are /, /proxy, and /config', 404);
  },
} satisfies ExportedHandler<Env>;

// Define the Env interface for Cloudflare Workers
interface Env {
  // Add KV namespace or other bindings as needed
  RATE_LIMIT_STORE?: KVNamespace;
}
