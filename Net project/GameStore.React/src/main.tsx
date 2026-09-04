import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
    BrowserRouter as Router,
    Routes,
    Route
} from 'react-router-dom';

import App from './App';
import Home from './pages/Home';
import EditGame from './pages/EditGame';
import SimpleCmsPage from './pages/SimpleCmsPage';

import './styles.css';


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Router>
            <Routes>

                <Route path="/" element={<App />}>

                    <Route
                        index
                        element={<Home />}
                    />

                    <Route
                        path="editgame"
                        element={<EditGame />}
                    />

                    <Route
                        path="editgame/:id"
                        element={<EditGame />}
                    />

                    {/* Piranha CMS page */}
                    <Route
                        path="page/:slug"
                        element={<SimpleCmsPage />}
                    />

                </Route>

            </Routes>
        </Router>
    </StrictMode>,
);