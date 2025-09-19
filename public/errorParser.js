function parseError(str) {
  let obj = {};

  // Extract error code
  let errorMatch = str.match(/Error\(s\): (\d+)/);
  if (errorMatch) obj.errorCode = errorMatch[1];

  // Extract timestamp
  let timestampMatch = str.match(/Timestamp: ([0-9TZ:-]+)/);
  if (timestampMatch) obj.timestamp = timestampMatch[1];

  // Extract description
  let descMatch = str.match(/Description: (.*?)(Trace ID:|$)/);
  if (descMatch) obj.description = descMatch[1].trim();

  // Extract Trace ID
  let traceMatch = str.match(/Trace ID: ([a-f0-9-]+)/i);
  if (traceMatch) obj.traceId = traceMatch[1];

  // Extract Correlation ID
  let corrMatch = str.match(/Correlation ID: ([a-f0-9-]+)/i);
  if (corrMatch) obj.correlationId = corrMatch[1];

  return obj;
}

module.exports= {parseError}
