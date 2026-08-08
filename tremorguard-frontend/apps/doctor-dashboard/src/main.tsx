import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createLogger } from '@tremorguard/utils';

const logger = createLogger('doctor-dashboard');

logger.info('Doctor Dashboard initializing');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
