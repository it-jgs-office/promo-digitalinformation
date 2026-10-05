import React from 'react';
import { createRoot } from 'react-dom/client';
import StockManager from './pages/admin/StockManager.jsx';
import AdminLogin from './pages/admin/Login.jsx';
import DigitalBoard from './pages/display/DigitalBoard.jsx';
import { ResourceFormPage, ResourcePage } from './pages/admin/ContentManager.jsx';
import './app.css';
const pages={display:DigitalBoard,'admin/login':AdminLogin,'admin/stocks':StockManager,'admin/promotions':ResourcePage,'admin/promotion-form':ResourceFormPage};
const rootElement=document.getElementById('app');const Page=pages[rootElement.dataset.page]??DigitalBoard;const props=JSON.parse(rootElement.dataset.props||'{}');
createRoot(rootElement).render(<React.StrictMode><Page {...props}/></React.StrictMode>);

