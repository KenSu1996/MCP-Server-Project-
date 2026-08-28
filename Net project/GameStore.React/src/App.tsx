import { Outlet } from 'react-router-dom';
import NavMenu from './components/NavMenu';

function App() {
    return (
        <div className="app-shell">
            <NavMenu />
            <main className="container main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default App;
