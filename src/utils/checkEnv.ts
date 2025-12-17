/**
 * Environment variable configuration checker
 * Used to verify if .env file configuration is correct
 */

interface EnvConfig {
  ARK_API_KEY: string;
  ARK_BASE_URL: string;
  ARK_MODEL: string;
  ARK_VIDEO_API_KEY: string;
  ARK_VIDEO_BASE_URL: string;
  ARK_VIDEO_MODEL: string;
  TENCENT_SECRET_ID: string;
  TENCENT_SECRET_KEY: string;
  TENCENT_REGION: string;
}

export function checkEnvConfig(): {
  isValid: boolean;
  config: Partial<EnvConfig>;
  missing: string[];
  errors: string[];
} {
  const config: Partial<EnvConfig> = {
    ARK_API_KEY: import.meta.env.VITE_ARK_API_KEY,
    ARK_BASE_URL: import.meta.env.VITE_ARK_BASE_URL,
    ARK_MODEL: import.meta.env.VITE_ARK_MODEL,
    ARK_VIDEO_API_KEY: import.meta.env.VITE_ARK_VIDEO_API_KEY,
    ARK_VIDEO_BASE_URL: import.meta.env.VITE_ARK_VIDEO_BASE_URL,
    ARK_VIDEO_MODEL: import.meta.env.VITE_ARK_VIDEO_MODEL,
    TENCENT_SECRET_ID: import.meta.env.VITE_TENCENT_SECRET_ID,
    TENCENT_SECRET_KEY: import.meta.env.VITE_TENCENT_SECRET_KEY,
    TENCENT_REGION: import.meta.env.VITE_TENCENT_REGION,
  };

  const missing: string[] = [];
  const errors: string[] = [];

  // Check required configuration items
  if (!config.ARK_API_KEY) missing.push('VITE_ARK_API_KEY (Language Model)');
  if (!config.ARK_BASE_URL) missing.push('VITE_ARK_BASE_URL');
  if (!config.ARK_VIDEO_API_KEY) missing.push('VITE_ARK_VIDEO_API_KEY (Video Generation)');
  if (!config.ARK_VIDEO_BASE_URL) missing.push('VITE_ARK_VIDEO_BASE_URL');
  if (!config.TENCENT_SECRET_ID) missing.push('VITE_TENCENT_SECRET_ID');
  if (!config.TENCENT_SECRET_KEY) missing.push('VITE_TENCENT_SECRET_KEY');
  if (!config.TENCENT_REGION) missing.push('VITE_TENCENT_REGION');

  // Validate configuration format
  if (config.ARK_BASE_URL && !config.ARK_BASE_URL.startsWith('http')) {
    errors.push('VITE_ARK_BASE_URL should be a valid URL');
  }

  if (config.ARK_VIDEO_BASE_URL && !config.ARK_VIDEO_BASE_URL.startsWith('http')) {
    errors.push('VITE_ARK_VIDEO_BASE_URL should be a valid URL');
  }

  if (config.TENCENT_SECRET_ID && !config.TENCENT_SECRET_ID.startsWith('AKID')) {
    errors.push('VITE_TENCENT_SECRET_ID format may be incorrect (should start with AKID)');
  }

  const isValid = missing.length === 0 && errors.length === 0;

  return {
    isValid,
    config,
    missing,
    errors,
  };
}

export function printEnvStatus() {
  const status = checkEnvConfig();
  
  console.log('=== Environment Variable Configuration Check ===');
  console.log('\nConfiguration status:');
  console.table({
    'Language Model API Key': status.config.ARK_API_KEY ? '✓ Configured' : '✗ Not configured',
    'Language Model Base URL': status.config.ARK_BASE_URL ? '✓ Configured' : '✗ Not configured',
    'Language Model': status.config.ARK_MODEL ? '✓ Configured' : '✗ Not configured',
    'Video Generation API Key': status.config.ARK_VIDEO_API_KEY ? '✓ Configured' : '✗ Not configured',
    'Video Generation Base URL': status.config.ARK_VIDEO_BASE_URL ? '✓ Configured' : '✗ Not configured',
    'Video Generation Model': status.config.ARK_VIDEO_MODEL ? '✓ Configured' : '✗ Not configured',
    'Tencent Cloud SecretId': status.config.TENCENT_SECRET_ID ? '✓ Configured' : '✗ Not configured',
    'Tencent Cloud SecretKey': status.config.TENCENT_SECRET_KEY ? '✓ Configured' : '✗ Not configured',
    'Tencent Cloud Region': status.config.TENCENT_REGION ? '✓ Configured' : '✗ Not configured',
  });

  if (status.missing.length > 0) {
    console.warn('\n⚠️ Missing configuration items:', status.missing);
  }

  if (status.errors.length > 0) {
    console.error('\n❌ Configuration errors:', status.errors);
  }

  if (status.isValid) {
    console.log('\n✅ All configuration items are correctly set!');
  } else {
    console.log('\n❌ Please check the above configuration items');
  }

  return status;
}


