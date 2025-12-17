import React, { useEffect } from 'react';
import { checkEnvConfig } from '../utils/checkEnv';

/**
 * Environment variable checker component (for development use)
 */
export const EnvChecker: React.FC = () => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const status = checkEnvConfig();
      
      console.log('=== Environment Variable Configuration Check ===');
      console.log('\nCurrent configuration values:');
      console.log('VITE_ARK_API_KEY (Language Model):', import.meta.env.VITE_ARK_API_KEY ? '✓ Set (hidden)' : '❌ Not set');
      console.log('VITE_ARK_BASE_URL:', import.meta.env.VITE_ARK_BASE_URL || '❌ Not set');
      console.log('VITE_ARK_MODEL:', import.meta.env.VITE_ARK_MODEL || '❌ Not set');
      console.log('VITE_ARK_VIDEO_API_KEY (Video Generation):', import.meta.env.VITE_ARK_VIDEO_API_KEY ? '✓ Set (hidden)' : '❌ Not set');
      console.log('VITE_ARK_VIDEO_BASE_URL:', import.meta.env.VITE_ARK_VIDEO_BASE_URL || '❌ Not set');
      console.log('VITE_ARK_VIDEO_MODEL:', import.meta.env.VITE_ARK_VIDEO_MODEL || '❌ Not set');
      console.log('VITE_TENCENT_SECRET_ID:', import.meta.env.VITE_TENCENT_SECRET_ID ? '✓ Set' : '❌ Not set');
      console.log('VITE_TENCENT_SECRET_KEY:', import.meta.env.VITE_TENCENT_SECRET_KEY ? '✓ Set (hidden)' : '❌ Not set');
      console.log('VITE_TENCENT_REGION:', import.meta.env.VITE_TENCENT_REGION || '❌ Not set');
      
      if (status.missing.length > 0) {
        console.warn('\n⚠️ Missing configuration items:', status.missing);
        console.warn('Please check if the .env file exists and is located in the project root directory (same level as package.json)');
        console.warn('After modifying the .env file, you need to restart the development server (Ctrl+C to stop, then npm run dev to restart)');
      }
      
      if (status.isValid) {
        console.log('\n✅ All configuration items are correctly set!');
      }
    }
  }, []);

  return null; // Don't render anything
};


